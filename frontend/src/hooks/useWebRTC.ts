import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

export const useWebRTC = (
  socket: Socket | null,
  meetingId: string,
  isMicOn: boolean,
  isVideoOn: boolean,
  isScreenSharing: boolean,
  onScreenShareEnded: () => void
) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Handle incoming WebRTC offers
    socket.on('webrtc_offer', async (data) => {
      const { sdp, sender } = data;
      let pc = peerConnections.current[sender];
      if (!pc) {
        pc = createPeerConnection(sender, socket);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', { target: sender, sdp: pc.localDescription });
    });

    // Handle incoming WebRTC answers
    socket.on('webrtc_answer', async (data) => {
      const { sdp, sender } = data;
      const pc = peerConnections.current[sender];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    // Handle incoming ICE candidates
    socket.on('webrtc_ice_candidate', async (data) => {
      const { candidate, sender } = data;
      const pc = peerConnections.current[sender];
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // When a new participant joins, create an offer
    socket.on('participantsUpdated', (list: any[]) => {
      list.forEach(p => {
        if (p.socketId && p.socketId !== socket.id && !peerConnections.current[p.socketId]) {
          const pc = createPeerConnection(p.socketId, socket);
          pc.createOffer().then(offer => {
            pc.setLocalDescription(offer);
            socket.emit('webrtc_offer', { target: p.socketId, sdp: offer, meetingId });
          });
        }
      });
    });

    return () => {
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      socket.off('participantsUpdated'); // Might conflict if handled elsewhere, so be careful
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
    };
  }, [socket, meetingId]);

  const createPeerConnection = (targetId: string, socket: Socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnections.current[targetId] = pc;

    // Add local stream tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [targetId]: event.streams[0]
      }));
    };

    // Send ICE candidates to the remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', { target: targetId, candidate: event.candidate, meetingId });
      }
    };

    // Clean up on disconnect
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[targetId];
          return next;
        });
        delete peerConnections.current[targetId];
      }
    };

    return pc;
  };

  const onScreenShareEndedRef = useRef(onScreenShareEnded);
  useEffect(() => {
    onScreenShareEndedRef.current = onScreenShareEnded;
  }, [onScreenShareEnded]);

  const isCapturingScreenRef = useRef(false);
  const isDisplayMediaPendingRef = useRef(false);

  // Clean up all tracks only when the component unmounts
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle local media constraints
  useEffect(() => {
    let active = true;
    const initMedia = async () => {
      // If screen share is disabled, reset our capture state reference
      if (!isScreenSharing) {
        isCapturingScreenRef.current = false;
      }

      // If nothing is enabled, stop all current tracks
      if (!isScreenSharing && !isVideoOn && !isMicOn) {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
          if (active) {
            setLocalStream(null);
          }
        }
        return;
      }

      try {
        let stream: MediaStream;

        if (isScreenSharing) {
          if (isCapturingScreenRef.current && localStreamRef.current) {
            // Already sharing screen. If mic state toggled, swap only the audio track
            const currentStream = localStreamRef.current;
            const screenTrack = currentStream.getVideoTracks()[0];

            currentStream.getAudioTracks().forEach(t => t.stop());

            if (isMicOn) {
              const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              if (!active) {
                audioStream.getTracks().forEach(t => t.stop());
                return;
              }
              const audioTrack = audioStream.getAudioTracks()[0];
              stream = new MediaStream([screenTrack, audioTrack]);
            } else {
              stream = new MediaStream([screenTrack]);
            }
          } else {
            if (isDisplayMediaPendingRef.current) {
              console.log("getDisplayMedia is already pending, skipping concurrent call");
              return;
            }
            isDisplayMediaPendingRef.current = true;
            isCapturingScreenRef.current = true;

            try {
              // Stop previous webcam stream before screen capture
              if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
              }

              const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
              if (!active) {
                screenStream.getTracks().forEach(t => t.stop());
                isCapturingScreenRef.current = false;
                isDisplayMediaPendingRef.current = false;
                return;
              }

              const screenTrack = screenStream.getVideoTracks()[0];

              // Listen for native stop button on browser toolbar
              screenTrack.onended = () => {
                isCapturingScreenRef.current = false;
                onScreenShareEndedRef.current();
              };

              if (isMicOn) {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (!active) {
                  screenStream.getTracks().forEach(t => t.stop());
                  audioStream.getTracks().forEach(t => t.stop());
                  isCapturingScreenRef.current = false;
                  isDisplayMediaPendingRef.current = false;
                  return;
                }
                const audioTrack = audioStream.getAudioTracks()[0];
                stream = new MediaStream([screenTrack, audioTrack]);
              } else {
                stream = new MediaStream([screenTrack]);
              }
            } catch (err) {
              isCapturingScreenRef.current = false;
              isDisplayMediaPendingRef.current = false;
              throw err;
            }
            isDisplayMediaPendingRef.current = false;
          }
        } else {
          // Standard Webcam + Microphone stream
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
          }
          const userMediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: isVideoOn, 
            audio: isMicOn 
          });
          if (!active) {
            userMediaStream.getTracks().forEach(t => t.stop());
            return;
          }
          stream = userMediaStream;
        }

        if (active) {
          setLocalStream(stream);
          localStreamRef.current = stream;

          // Replace tracks in existing peer connections and renegotiate if adding a new track
          Object.entries(peerConnections.current).forEach(([targetId, pc]) => {
            const senders = pc.getSenders();
            let needsNegotiation = false;
            stream.getTracks().forEach(track => {
              const sender = senders.find(s => s.track && s.track.kind === track.kind);
              if (sender) {
                sender.replaceTrack(track);
              } else {
                pc.addTrack(track, stream);
                needsNegotiation = true;
              }
            });
            if (needsNegotiation) {
              pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                socket.emit('webrtc_offer', { target: targetId, sdp: offer, meetingId });
              }).catch(err => {
                console.error("Renegotiation offer creation failed", err);
              });
            }
          });
        }
      } catch (err) {
        console.error("Error accessing media devices", err);
        if (isScreenSharing && active) {
          isCapturingScreenRef.current = false;
          onScreenShareEndedRef.current();
        }
      }
    };
    initMedia();
    return () => {
      active = false;
    };
  }, [isMicOn, isVideoOn, isScreenSharing]);

  return { localStream, remoteStreams };
};

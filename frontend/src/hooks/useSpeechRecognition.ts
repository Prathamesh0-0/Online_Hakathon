import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

export const useSpeechRecognition = (
  socket: Socket | null,
  meetingId: string,
  isMicOn: boolean,
  userName: string,
  lang: string = 'en-US'
) => {
  const recognitionRef = useRef<any>(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API is not supported in this browser.");
      return;
    }

    // Clean up previous recognition if lang changed
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(currentInterim);

      if (finalTranscript.trim() && socket) {
        socket.emit('sendTranscript', {
          meetingId,
          speakerName: userName,
          text: finalTranscript.trim(),
          languageCode: lang,
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        recognition.stop();
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current && isMicOn) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    };

    recognitionRef.current = recognition;

    if (isMicOn) {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setInterimTranscript('');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, [socket, meetingId, isMicOn, userName, lang]);

  return { interimTranscript };
};

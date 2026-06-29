import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { Video, VideoOff, Mic, MicOff, Clock, User, AlertCircle, RefreshCw } from 'lucide-react';

export const WaitingRoom: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const meetingId = searchParams.get('meetingId') || '';
  const meetingTitle = searchParams.get('meetingTitle') || 'Team Session';
  const name = searchParams.get('name') || '';
  const email = searchParams.get('email') || '';
  const cameraOn = searchParams.get('camera') === 'true';
  const micOn = searchParams.get('mic') === 'true';
  const isGuest = searchParams.get('isGuest') === 'true';

  const [status, setStatus] = useState<'WAITING' | 'APPROVED' | 'REJECTED'>('WAITING');
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!meetingId || !name || !email) {
      navigate('/join');
      return;
    }

    // Connect to backend Socket.IO gateway
    const socket = io(API_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket gateway for waiting room');
      // Join waiting room
      socket.emit('joinWaitingRoom', { meetingId, name, email });
    });

    // Listen for host decision
    socket.on('joinApproved', ({ meetingId: approvedMeetingId }: { meetingId: string }) => {
      console.log('Join request APPROVED by host!');
      setStatus('APPROVED');
      
      // If joining as guest, save mock guest session credentials
      if (isGuest) {
        const guestId = `guest_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('token', 'guest_bypass_token');
        localStorage.setItem('user', JSON.stringify({ id: guestId, name, email, isGuest: true }));
      }
      
      // Redirect to the live meeting room
      setTimeout(() => {
        navigate(`/meeting/${approvedMeetingId}`);
        // Force window refresh to load guest session
        if (isGuest) {
          window.location.reload();
        }
      }, 1000);
    });

    socket.on('joinRejected', () => {
      console.log('Join request REJECTED by host.');
      setStatus('REJECTED');
      socket.disconnect();
    });

    // Listen for other waiting participants (optional UI benefit)
    socket.on('waitingListUpdated', (list: any[]) => {
      setWaitingList(list);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [meetingId, name, email, isGuest, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '40px' }}>
        {status === 'WAITING' && (
          <div>
            {/* Sonar Pulsing Loading Animation */}
            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 32px' }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: '50%',
                background: 'rgba(92, 107, 77, 0.1)',
                border: '2px solid var(--primary)',
                animation: 'pulseGlow 2s infinite ease-in-out'
              }} />
              <div style={{
                position: 'absolute',
                top: '15px', left: '15px', right: '15px', bottom: '15px',
                borderRadius: '50%',
                background: 'rgba(92, 107, 77, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-hover)'
              }}>
                <Clock size={32} />
              </div>
            </div>

            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }} className="gradient-text">Waiting Room</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
              Host approval is required to join <strong style={{ color: 'var(--text-primary)' }}>{meetingTitle}</strong>.
            </p>

            {/* Quick check panel */}
            <div style={{ 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '16px', 
              display: 'flex', 
              justifyContent: 'space-around', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <User size={14} style={{ color: 'var(--primary)' }} />
                <span>{name}</span>
              </div>
              <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {cameraOn ? <Video size={14} style={{ color: 'var(--success)' }} /> : <VideoOff size={14} style={{ color: 'var(--danger)' }} />}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Video</span>
              </div>
              <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {micOn ? <Mic size={14} style={{ color: 'var(--success)' }} /> : <MicOff size={14} style={{ color: 'var(--danger)' }} />}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Audio</span>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <RefreshCw size={12} className="pulse-indicator active" style={{ animationDuration: '2s', width: 'auto', height: 'auto', background: 'none', boxShadow: 'none' }} />
              Waiting for host to admit you...
            </div>
            
            {waitingList.length > 1 && (
              <div style={{ marginTop: '24px', textAlign: 'left', borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Other users in lobby ({waitingList.length - 1})</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {waitingList.filter(p => p.socketId !== socketRef.current?.id).map((p, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'APPROVED' && (
          <div style={{ color: 'var(--success)' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(16, 185, 129, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              border: '2px solid var(--success)'
            }}>
              <Check size={40} />
            </div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Entry Approved</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Redirecting you to the meeting room...</p>
          </div>
        )}

        {status === 'REJECTED' && (
          <div>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              color: 'var(--danger)',
              border: '2px solid var(--danger)'
            }}>
              <AlertCircle size={40} />
            </div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--danger)' }}>Access Denied</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '28px' }}>
              The host declined your request to join this meeting room.
            </p>
            <button className="btn btn-secondary" onClick={() => navigate('/join')}>
              Return to Join Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Quick helper to prevent compiler check errors on 'Check'
const Check: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

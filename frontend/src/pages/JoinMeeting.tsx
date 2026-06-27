import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Key, User, Mail, Play } from 'lucide-react';

interface JoinMeetingProps {
  currentUser?: any;
}

export const JoinMeeting: React.FC<JoinMeetingProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [meetingCode, setMeetingCode] = useState('');
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setMeetingCode(codeParam);
    }
  }, [searchParams]);

  const handleJoin = async (isGuest: boolean) => {
    if (!meetingCode.trim()) {
      setError('Please enter a valid Meeting ID or Code');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Verify meeting code/ID exists
      const code = meetingCode.trim();
      const response = await fetch(`http://localhost:5000/meetings/code/${code}`);
      
      if (!response.ok) {
        throw new Error('Meeting not found. Please verify the Meeting ID or Code.');
      }
      
      const meeting = await response.json();
      
      if (meeting.status === 'COMPLETED') {
        throw new Error('This meeting has already ended. You cannot join it.');
      }

      // 2. Redirect to Waiting Room with details in search query
      const params = new URLSearchParams({
        meetingId: meeting.id,
        meetingCode: meeting.code || '',
        meetingTitle: meeting.title,
        name: name.trim(),
        email: email.trim(),
        camera: cameraOn.toString(),
        mic: micOn.toString(),
        isGuest: isGuest.toString(),
      });

      navigate(`/waiting-room?${params.toString()}`);
    } catch (err: any) {
      setError(err.message || 'Error joining meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }} className="gradient-text">Ready to Join?</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Check your audio & video, and enter the meeting details below.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Device Preview Block */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Device Setup</h3>
          
          {/* Mock Camera Viewframe */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '220px',
            borderRadius: 'var(--radius-md)',
            background: cameraOn ? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' : '#09090b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: cameraOn ? '0 0 20px rgba(92, 107, 77, 0.1)' : 'none',
            transition: 'var(--transition-smooth)'
          }}>
            {cameraOn ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: 'rgba(92, 107, 77, 0.25)', 
                  color: 'var(--primary-hover)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--primary)'
                }}>
                  {name ? name[0].toUpperCase() : '?'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Camera is Streaming Live</div>
                
                {/* Voice bar visualization if mic is on */}
                {micOn && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '4px',
                    height: '24px',
                    position: 'absolute',
                    bottom: '16px'
                  }}>
                    <div className="voice-wave-bar" style={{ animationDuration: '0.8s', width: '4px', background: 'var(--secondary)' }} />
                    <div className="voice-wave-bar" style={{ animationDuration: '1.1s', width: '4px', background: 'var(--secondary)' }} />
                    <div className="voice-wave-bar" style={{ animationDuration: '0.9s', width: '4px', background: 'var(--secondary)' }} />
                    <div className="voice-wave-bar" style={{ animationDuration: '1.2s', width: '4px', background: 'var(--secondary)' }} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                <VideoOff size={48} />
                <div style={{ fontSize: '0.85rem' }}>Camera is Turned Off</div>
              </div>
            )}

            {/* Quick status overlays */}
            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
              <span className={`badge ${cameraOn ? 'badge-success' : 'badge-danger'}`} style={{ padding: '2px 8px', fontSize: '0.65rem' }}>
                CAM
              </span>
              <span className={`badge ${micOn ? 'badge-success' : 'badge-danger'}`} style={{ padding: '2px 8px', fontSize: '0.65rem' }}>
                MIC
              </span>
            </div>
          </div>

          {/* Quick toggle buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button 
              className={`btn ${cameraOn ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCameraOn(!cameraOn)}
              style={{ flex: 1, padding: '10px 16px', gap: '8px', border: '1px solid var(--border-color)' }}
            >
              {cameraOn ? <Video size={16} /> : <VideoOff size={16} />}
              {cameraOn ? 'Stop Video' : 'Start Video'}
            </button>

            <button 
              className={`btn ${micOn ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMicOn(!micOn)}
              style={{ flex: 1, padding: '10px 16px', gap: '8px', border: '1px solid var(--border-color)' }}
            >
              {micOn ? <Mic size={16} /> : <MicOff size={16} />}
              {micOn ? 'Mute' : 'Unmute'}
            </button>
          </div>
        </div>

        {/* Credentials Form Block */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>Meeting Details</h3>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              color: 'var(--danger)', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '20px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Meeting ID or Code</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. TM-8X4K92 or UUID"
                  value={meetingCode}
                  onChange={e => setMeetingCode(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
                <Key size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Your Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
                <User size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Your Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input-field"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              {currentUser && (
                <button 
                  onClick={() => handleJoin(false)} 
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '14px', gap: '8px' }}
                  disabled={loading}
                >
                  <Play size={16} /> Join Meeting
                </button>
              )}
              
              <button 
                onClick={() => handleJoin(true)} 
                className={`btn ${currentUser ? 'btn-secondary' : 'btn-primary'}`}
                style={{ flex: 1, padding: '14px', gap: '8px' }}
                disabled={loading}
              >
                Join as Guest
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

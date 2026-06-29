import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, FileText, Video, Clipboard, Check, ArrowLeft, Mail } from 'lucide-react';
import { EmailInviteModal } from './EmailInviteModal';

interface CreateMeetingProps {
  token: string;
}

export const CreateMeeting: React.FC<CreateMeetingProps> = ({ token }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [invitedEmails, setInvitedEmails] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ id: string; code: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Always read the freshest token directly from localStorage to avoid stale prop
    const authToken = localStorage.getItem('token') || token;

    if (!authToken || authToken === 'null' || authToken === 'undefined') {
      setError('You must be logged in to schedule a meeting. Please log in and try again.');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title,
          description,
          startTime: startTime || undefined,
          invitedEmails,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // If token expired, clear it and prompt re-login
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(data.message || data.detail || 'Failed to create meeting');
      }

      setSuccessData({ id: data.id, code: data.code });
    } catch (err: any) {
      setError(err.message || 'An error occurred while scheduling meeting');
    } finally {
      setLoading(false);
    }
  };

  const getJoinLink = () => {
    if (!successData) return '';
    return `${window.location.origin}/join?code=${successData.code}`;
  };

  const handleCopyCode = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const link = getJoinLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 0' }}>
      <button 
        className="btn btn-secondary" 
        style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {!successData ? (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              background: 'rgba(92, 107, 77, 0.12)',
              color: 'var(--primary)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
            }}>
              <Video size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }} className="gradient-text">Schedule Meeting</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Create a session and generate a secure link for team access.</p>
            </div>
          </div>

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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Meeting Title</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Weekly Standup / Sync Session"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Date & Time</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
                <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Participants Email IDs</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. john@company.com, bob@company.com"
                  value={invitedEmails}
                  onChange={e => setInvitedEmails(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
                <Users size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Separate multiple emails with commas.</span>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Meeting Agenda / Goals</label>
              <div style={{ position: 'relative' }}>
                <textarea
                  className="input-field"
                  placeholder="What is the goal of this meeting? Describe agenda items..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  style={{ paddingLeft: '44px', paddingTop: '12px' }}
                />
                <FileText size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Scheduling...' : '➕ Schedule Meeting'}
            </button>
          </form>
        </div>
      ) : (
        <div className="glass-card" style={{ border: '1px solid var(--border-color-glow)', background: 'rgba(92, 107, 77, 0.03)', textAlign: 'center', padding: '40px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'rgba(16, 185, 129, 0.1)', 
            color: 'var(--success)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Check size={36} />
          </div>

          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }} className="gradient-text">Meeting Created Successfully</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Your meeting has been scheduled and unique credentials are ready.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '450px', margin: '0 auto 32px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Meeting ID / Code</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)', marginTop: '2px' }}>{successData.code}</div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '8px 16px', gap: '6px' }} onClick={handleCopyCode}>
                {copiedCode ? <Check size={14} color="var(--success)" /> : <Clipboard size={14} />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Join Link</span>
                <div style={{ fontSize: '0.9rem', color: 'var(--primary-hover)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getJoinLink()}</div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '8px 16px', gap: '6px' }} onClick={handleCopyLink}>
                {copiedLink ? <Check size={14} color="var(--success)" /> : <Clipboard size={14} />}
                {copiedLink ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              Go to Dashboard
            </button>
            <button
              className="btn btn-secondary"
              style={{ gap: '6px', border: '1px solid rgba(92,107,77,0.3)', color: 'var(--primary)', background: 'rgba(92,107,77,0.06)' }}
              onClick={() => setShowEmailModal(true)}
            >
              <Mail size={16} /> Email Invites
            </button>
            <button className="btn btn-primary" onClick={() => navigate(`/meeting/${successData.id}`)}>
              Enter Meeting Room
            </button>
          </div>
        </div>
      )}

      {/* Email Invite Modal */}
      {showEmailModal && successData && (
        <EmailInviteModal
          meetingId={successData.id}
          meetingTitle={title || 'Meeting'}
          meetingCode={successData.code}
          token={token}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
};

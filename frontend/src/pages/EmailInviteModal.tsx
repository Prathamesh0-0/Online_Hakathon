import React, { useState } from 'react';
import { Mail, X, Send, Plus, Trash2, Check, AlertCircle, Loader } from 'lucide-react';

interface EmailInviteModalProps {
  meetingId: string;
  meetingTitle: string;
  meetingCode: string;
  token: string;
  onClose: () => void;
}

export const EmailInviteModal: React.FC<EmailInviteModalProps> = ({
  meetingId,
  meetingTitle,
  meetingCode,
  token,
  onClose,
}) => {
  const [emails, setEmails] = useState<string[]>(['']);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: string[]; total: number } | null>(null);
  const [error, setError] = useState('');

  const updateEmail = (index: number, value: string) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index: number) => {
    if (emails.length === 1) return; // keep at least one
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handlePaste = (index: number, e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text');
    // Auto split comma/newline separated emails
    const parts = pasted.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      e.preventDefault();
      const updated = [...emails];
      updated.splice(index, 1, ...parts);
      setEmails(updated);
    }
  };

  const handleSend = async () => {
    const validEmails = emails.map((e) => e.trim()).filter(Boolean);
    if (validEmails.length === 0) {
      setError('Please enter at least one email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = validEmails.filter((e) => !emailRegex.test(e));
    if (invalid.length > 0) {
      setError(`Invalid email(s): ${invalid.join(', ')}`);
      return;
    }

    setSending(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/email/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meetingId,
          emails: validEmails,
          appBaseUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invites');
      }

      setResult({ sent: data.sent, failed: data.failed || [], total: data.total });
    } catch (err: any) {
      setError(err.message || 'Error sending invite emails');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '32px',
          position: 'relative',
          border: '1px solid rgba(109, 40, 217, 0.25)',
          boxShadow: '0 0 40px rgba(109, 40, 217, 0.15)',
          animation: 'fadeSlideUp 0.2s ease-out',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: '4px', display: 'flex',
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: 'linear-gradient(135deg, rgba(109,40,217,0.2), rgba(8,145,178,0.2))',
            border: '1px solid rgba(109,40,217,0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2px' }}>
              Invite by Email
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Send a join link for <strong style={{ color: 'var(--text-primary)' }}>{meetingTitle}</strong>
            </p>
          </div>
        </div>

        {/* Meeting code badge */}
        <div style={{
          background: 'rgba(109,40,217,0.06)',
          border: '1px solid rgba(109,40,217,0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
        }}>
          <span>Meeting Code:</span>
          <span style={{ color: 'var(--primary-hover)', fontWeight: 700, letterSpacing: '0.06em' }}>{meetingCode}</span>
        </div>

        {/* Result State */}
        {result ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: result.failed.length === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              border: `2px solid ${result.failed.length === 0 ? 'var(--success)' : 'var(--warning)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              color: result.failed.length === 0 ? 'var(--success)' : 'var(--warning)',
            }}>
              {result.failed.length === 0 ? <Check size={32} /> : <AlertCircle size={32} />}
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
              {result.failed.length === 0 ? 'All Invites Sent!' : 'Partially Sent'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {result.sent} of {result.total} invite email{result.total !== 1 ? 's' : ''} sent successfully.
            </p>
            {result.failed.length > 0 && (
              <div style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                textAlign: 'left',
                marginBottom: '16px',
                fontSize: '0.8rem',
                color: 'var(--danger)',
              }}>
                <strong>Failed to send to:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                  {result.failed.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => { setResult(null); setEmails(['']); }}>
                Send More
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Email Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Recipient Email Address(es)
              </label>
              {emails.map((email, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="email"
                      className="input-field"
                      placeholder={`e.g. colleague${idx + 1}@company.com`}
                      value={email}
                      onChange={(e) => updateEmail(idx, e.target.value)}
                      onPaste={(e) => handlePaste(idx, e)}
                      style={{ paddingLeft: '40px' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addEmailField(); }
                      }}
                    />
                    <Mail size={15} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  </div>
                  {emails.length > 1 && (
                    <button
                      onClick={() => removeEmailField(idx)}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--text-muted)', cursor: 'pointer',
                        padding: '6px', display: 'flex',
                        borderRadius: '6px',
                        transition: 'color 0.15s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                      onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addEmailField}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: '1px dashed var(--border-color)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem', fontWeight: 500,
                  transition: 'border-color 0.15s, color 0.15s',
                  width: 'fit-content',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Plus size={14} /> Add Another Email
              </button>
            </div>

            {/* Paste tip */}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              💡 Tip: Paste multiple comma-separated emails into one field to auto-split them.
            </p>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {/* Send Button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', gap: '8px', fontSize: '0.95rem' }}
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending Invites...</>
              ) : (
                <><Send size={16} /> Send Invite Email{emails.filter(Boolean).length > 1 ? 's' : ''}</>
              )}
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

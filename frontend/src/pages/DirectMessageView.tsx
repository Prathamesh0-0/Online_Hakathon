import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Send, MessageSquare } from 'lucide-react';

interface DirectMessageViewProps {
  token: string;
  otherUserId: string;
  currentUser: any;
  socket: Socket | null;
}

export const DirectMessageView: React.FC<DirectMessageViewProps> = ({
  token,
  otherUserId,
  currentUser,
  socket,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const fetchDmData = async () => {
    try {
      setLoading(true);
      // Fetch users list to find metadata
      const usersRes = await fetch('http://localhost:5000/teams/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const users = await usersRes.json();
        const info = users.find((u: any) => u.id === otherUserId);
        setOtherUser(info);
      }

      // Fetch DM history
      const msgsRes = await fetch(`http://localhost:5000/teams/dms/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (msgsRes.ok) {
        const msgs = await msgsRes.json();
        setMessages(msgs);
      }
    } catch (err) {
      console.error('Error loading direct messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDmData();

    if (!socket) return;

    // Listen to real-time direct messages
    socket.on('directMessageAdded', (message: any) => {
      // Validate that this message belongs to the current conversation
      const isRelevant = 
        (message.senderId === currentUser.id && message.receiverId === otherUserId) ||
        (message.senderId === otherUserId && message.receiverId === currentUser.id);
        
      if (isRelevant) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      socket.off('directMessageAdded');
    };
  }, [otherUserId, socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit('sendDirectMessage', {
      senderId: currentUser.id,
      receiverId: otherUserId,
      text: inputText.trim()
    });

    setInputText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '80vh' }}>
      {/* DM Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '28px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }}>
          {otherUser?.name ? otherUser.name[0] : 'U'}
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {otherUser?.name || 'Chatting...'}
          </h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{otherUser?.email}</span>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading chat...</p>
      ) : (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '540px', padding: '20px' }}>
          {/* Chat box */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px', marginBottom: '20px' }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MessageSquare size={44} style={{ opacity: 0.15, marginBottom: '12px' }} />
                <p>This is the start of your message history with {otherUser?.name || 'them'}.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div 
                    key={msg.id || idx} 
                    style={{
                      background: isMe ? 'rgba(92, 107, 77, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderColor: isMe ? 'var(--primary-glow)' : 'var(--border-color)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-lg)',
                      maxWidth: '75%',
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      boxShadow: isMe ? '0 4px 12px rgba(92,107,77,0.05)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8rem', color: isMe ? 'var(--primary-hover)' : 'var(--secondary)' }}>
                        {isMe ? 'You' : msg.sender?.name || otherUser?.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.4', wordBreak: 'break-word' }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <input
              type="text"
              className="input-field"
              placeholder={`Message ${otherUser?.name || 'user'}...`}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', flexShrink: 0 }}>
              <Send size={16} /> Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { CheckSquare, Clock, ListTodo, ExternalLink } from 'lucide-react';

interface TasksProps {
  token: string;
}

export const Tasks: React.FC<TasksProps> = ({ token }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);

  const handleSyncTask = async (taskId: string, platform: 'clickup') => {
    setSyncingTaskId(taskId);
    try {
      const response = await fetch(`http://localhost:5000/meetings/action-items/${taskId}/sync/${platform}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, ...updatedTask } : t));
      } else {
        alert(`Failed to sync to ${platform.toUpperCase()}.`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error connecting to ${platform.toUpperCase()} sync service.`);
    } finally {
      setSyncingTaskId(null);
    }
  };

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return 'No Deadline';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        const response = await fetch('http://localhost:5000/meetings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meetings = await response.json();
        
        if (response.ok) {
          // Flatten all action items from all meetings
          const allTasks: any[] = [];
          meetings.forEach((meeting: any) => {
            if (meeting.actionItems) {
              meeting.actionItems.forEach((item: any) => {
                allTasks.push({
                  ...item,
                  meetingTitle: meeting.title,
                });
              });
            }
          });
          setTasks(allTasks);
        }
      } catch (err) {
        console.error('Failed to fetch action items', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTasks();
  }, [token]);

  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }} className="gradient-text">Action Board</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Centralized workspace for all task assignments extracted by AI from your meeting transcripts.</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading action board...</p>
      ) : tasks.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <ListTodo size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>No action items assigned yet. Complete a meeting session to extract tasks automatically.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          
          {/* PENDING COLUMN */}
          <div className="glass-card glow-card" style={{ borderTop: '4px solid var(--warning)', padding: '28px 24px' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} style={{ color: 'var(--warning)' }} /> Pending Review ({pendingTasks.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingTasks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>All tasks completed! Great work.</p>
              ) : (
                pendingTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="glow-card"
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px 22px',
                      transition: 'var(--transition-smooth)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    {/* Rich Flow-style Layout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.9rem', marginBottom: '12px' }}>
                      <input
                        type="text"
                        value={task.assigneeName || ''}
                        placeholder="Unassigned"
                        onChange={async (e) => {
                          const newName = e.target.value;
                          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, assigneeName: newName } : t));
                          try {
                            await fetch(`http://localhost:5000/meetings/action-items/${task.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({ assigneeName: newName })
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        style={{
                          background: 'rgba(92, 107, 77, 0.12)',
                          color: 'var(--primary-hover)',
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          border: 'none',
                          outline: 'none',
                          fontSize: '0.85rem',
                          width: '110px',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500, flex: 1, minWidth: '150px' }}>
                        {task.text}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                      <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', padding: '2px 10px', borderRadius: '9999px', fontWeight: 600, fontSize: '0.8rem' }}>
                        {formatDueDate(task.dueDate)}
                      </span>
                    </div>

                    <div style={{ marginTop: '14px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>{task.meetingTitle}</span>
                      
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {task.externalUrl ? (
                          <a 
                            href={task.externalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(123, 104, 238, 0.12)',
                              color: '#a294f9',
                              border: '1px solid rgba(123, 104, 238, 0.3)',
                              borderRadius: '9999px',
                              padding: '4px 12px',
                              fontSize: '0.75rem',
                              textDecoration: 'none',
                              fontWeight: 600,
                            }}
                          >
                            <ExternalLink size={10} /> {task.externalPlatform ? task.externalPlatform.toUpperCase() : 'EXTERNAL'}
                          </a>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '3px 12px', fontSize: '0.75rem', height: 'auto', borderRadius: '9999px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            onClick={() => handleSyncTask(task.id, 'clickup')}
                            disabled={syncingTaskId === task.id}
                          >
                            Sync to ClickUp
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COMPLETED COLUMN */}
          <div className="glass-card glow-card" style={{ borderTop: '4px solid var(--success)', padding: '28px 24px' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={20} style={{ color: 'var(--success)' }} /> Completed Tasks ({completedTasks.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {completedTasks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>No completed tasks recorded yet.</p>
              ) : (
                completedTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="glow-card"
                    style={{
                      background: 'rgba(255,255,255,0.005)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px 22px',
                      opacity: 0.65,
                      transition: 'var(--transition-smooth)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                      e.currentTarget.style.opacity = '0.85';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.005)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.opacity = '0.65';
                    }}
                  >
                    {/* Rich Flow-style Layout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.9rem', marginBottom: '12px', opacity: 0.8 }}>
                      <input
                        type="text"
                        value={task.assigneeName || ''}
                        placeholder="Unassigned"
                        onChange={async (e) => {
                          const newName = e.target.value;
                          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, assigneeName: newName } : t));
                          try {
                            await fetch(`http://localhost:5000/meetings/action-items/${task.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({ assigneeName: newName })
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        style={{
                          background: 'rgba(92, 107, 77, 0.12)',
                          color: 'var(--primary-hover)',
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          border: 'none',
                          outline: 'none',
                          fontSize: '0.85rem',
                          width: '110px',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500, flex: 1, minWidth: '150px', textDecoration: 'line-through' }}>
                        {task.text}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                      <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', padding: '2px 10px', borderRadius: '9999px', fontWeight: 600, fontSize: '0.8rem' }}>
                        Completed
                      </span>
                    </div>

                    <div style={{ marginTop: '14px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>{task.meetingTitle}</span>
                      
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {task.externalUrl ? (
                          <a 
                            href={task.externalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(123, 104, 238, 0.12)',
                              color: '#a294f9',
                              border: '1px solid rgba(123, 104, 238, 0.3)',
                              borderRadius: '9999px',
                              padding: '4px 12px',
                              fontSize: '0.75rem',
                              textDecoration: 'none',
                              fontWeight: 600,
                            }}
                          >
                            <ExternalLink size={10} /> {task.externalPlatform ? task.externalPlatform.toUpperCase() : 'EXTERNAL'}
                          </a>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '3px 12px', fontSize: '0.75rem', height: 'auto', borderRadius: '9999px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            onClick={() => handleSyncTask(task.id, 'clickup')}
                            disabled={syncingTaskId === task.id}
                          >
                            Sync to ClickUp
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

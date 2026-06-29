import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Clock, X, Check, Calendar } from 'lucide-react';

interface CalendarViewProps {
  token: string;
  onSelectMeeting: (meetingId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ token, onSelectMeeting }) => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar navigation states
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Modal state for scheduling a meeting by clicking a date
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchMeetings = async () => {
    try {
      const authToken = localStorage.getItem('token') || token;
      const response = await fetch('http://localhost:5000/meetings', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMeetings(data);
      }
    } catch (err) {
      console.error('Failed to fetch meetings in calendar', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [token]);

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const gridCells = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    gridCells.push({
      day: prevMonthDays - i,
      month: currentMonth === 0 ? 11 : currentMonth - 1,
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= totalDaysInMonth; i++) {
    gridCells.push({ day: i, month: currentMonth, year: currentYear, isCurrentMonth: true });
  }

  const totalCells = Math.ceil(gridCells.length / 7) * 7;
  const remainingCells = totalCells - gridCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    gridCells.push({
      day: i,
      month: currentMonth === 11 ? 0 : currentMonth + 1,
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
      isCurrentMonth: false,
    });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(prev => prev - 1); }
    else { setCurrentMonth(prev => prev - 1); }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(prev => prev + 1); }
    else { setCurrentMonth(prev => prev + 1); }
  };

  const handleResetToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getMeetingsForDate = (day: number, month: number, year: number) => {
    return meetings.filter(m => {
      const mDate = new Date(m.startTime);
      return mDate.getDate() === day && mDate.getMonth() === month && mDate.getFullYear() === year;
    });
  };

  const isToday = (day: number, month: number, year: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  // Open the create-meeting modal for a specific date
  const handleDateClick = (cell: { day: number; month: number; year: number; isCurrentMonth: boolean }) => {
    const date = new Date(cell.year, cell.month, cell.day);
    setSelectedDate(date);
    setMeetingTitle('');
    setMeetingTime('09:00');
    setMeetingDesc('');
    setSubmitError('');
    setSubmitSuccess(false);
    setShowModal(true);
  };

  // Submit meeting from modal
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !meetingTitle.trim()) return;
    setSubmitting(true);
    setSubmitError('');

    const authToken = localStorage.getItem('token') || token;
    if (!authToken || authToken === 'null') {
      setSubmitError('You must be logged in to schedule a meeting.');
      setSubmitting(false);
      return;
    }

    // Build ISO start time from selected date + time input
    const [hours, minutes] = meetingTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    try {
      const response = await fetch('http://localhost:5000/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          title: meetingTitle,
          description: meetingDesc,
          startTime: startTime.toISOString(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.detail || 'Failed to create meeting');
      }
      setSubmitSuccess(true);
      await fetchMeetings(); // Refresh calendar
      setTimeout(() => setShowModal(false), 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const formatModalDate = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Loading Calendar...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }} className="gradient-text">Meetings Calendar</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Click any date to schedule a meeting directly on that day.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
            <button className="btn btn-secondary" onClick={handlePrevMonth} style={{ padding: '8px 12px', height: '36px', border: 'none', background: 'transparent' }}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-secondary" onClick={handleResetToToday} style={{ padding: '6px 16px', height: '36px', fontSize: '0.85rem', border: 'none', background: 'transparent' }}>
              Today
            </button>
            <button className="btn btn-secondary" onClick={handleNextMonth} style={{ padding: '8px 12px', height: '36px', border: 'none', background: 'transparent' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => navigate('/create-meeting')} style={{ height: '44px' }}>
            <Plus size={18} /> Add Meeting
          </button>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Month title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <span className="badge badge-info" style={{ textTransform: 'none', padding: '4px 12px', fontSize: '0.8rem' }}>
            {meetings.length} Scheduled
          </span>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          {weekdayNames.map(name => (
            <div key={name} style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {name}
            </div>
          ))}
        </div>

        {/* Day Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(110px, auto)', gap: '10px' }}>
          {gridCells.map((cell, idx) => {
            const cellMeetings = getMeetingsForDate(cell.day, cell.month, cell.year);
            const isCellToday = isToday(cell.day, cell.month, cell.year);

            return (
              <div
                key={idx}
                onClick={() => handleDateClick(cell)}
                title={`Add meeting on ${monthNames[cell.month]} ${cell.day}`}
                style={{
                  background: cell.isCurrentMonth ? 'var(--bg-card)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid',
                  borderColor: isCellToday ? 'var(--primary)' : 'var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minHeight: '110px',
                  opacity: cell.isCurrentMonth ? 1 : 0.45,
                  boxShadow: isCellToday ? '0 0 15px var(--primary-glow)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = cell.isCurrentMonth ? 'rgba(92,107,77,0.07)' : 'rgba(92,107,77,0.03)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = cell.isCurrentMonth ? 'var(--bg-card)' : 'rgba(255,255,255,0.02)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = isCellToday ? 'var(--primary)' : 'var(--border-color)';
                }}
              >
                {/* Day number */}
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: isCellToday ? 800 : 500,
                  color: isCellToday ? 'var(--primary-hover)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isCellToday ? '26px' : 'auto',
                  height: isCellToday ? '26px' : 'auto',
                  borderRadius: isCellToday ? '50%' : 'none',
                  background: isCellToday ? 'var(--primary-glow)' : 'transparent',
                  alignSelf: 'flex-start',
                }}>
                  {cell.day}
                </div>

                {/* + icon hint on hover */}
                {cellMeetings.length === 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '8px',
                    color: 'var(--text-muted)',
                    opacity: 0.35,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    pointerEvents: 'none'
                  }}>
                    <Plus size={11} /> Add
                  </div>
                )}

                {/* Meeting pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                  {cellMeetings.map((m: any) => {
                    const timeStr = new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isMeetingActive = m.status === 'ACTIVE';
                    const isMeetingPast = m.status === 'COMPLETED';

                    return (
                      <button
                        key={m.id}
                        onClick={e => { e.stopPropagation(); onSelectMeeting(m.id); }}
                        style={{
                          background: isMeetingActive ? 'rgba(16, 185, 129, 0.12)' : isMeetingPast ? 'rgba(255,255,255,0.03)' : 'rgba(92, 107, 77, 0.08)',
                          border: '1px solid',
                          borderColor: isMeetingActive ? 'rgba(16,185,129,0.3)' : isMeetingPast ? 'var(--border-color)' : 'rgba(92,107,77,0.2)',
                          color: isMeetingActive ? 'var(--success)' : isMeetingPast ? 'var(--text-secondary)' : 'var(--primary-hover)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          width: '100%',
                          transition: 'all 0.2s ease',
                          overflow: 'hidden',
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'none'; }}
                        title={`${m.title} (${timeStr})`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', width: '100%' }}>
                          {isMeetingActive
                            ? <span className="pulse-indicator active" style={{ width: '5px', height: '5px', flexShrink: 0 }} />
                            : <Clock size={8} style={{ flexShrink: 0 }} />
                          }
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                            {m.title}
                          </span>
                        </div>
                        <div style={{ opacity: 0.8, fontSize: '0.65rem' }}>{timeStr}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ——— Schedule Meeting Modal ——— */}
      {showModal && selectedDate && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass-card"
            style={{
              width: '100%', maxWidth: '440px',
              padding: '32px',
              borderRadius: '20px',
              position: 'relative',
              animation: 'slideUp 0.2s ease',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
            >
              <X size={20} />
            </button>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--success)' }}>
                  <Check size={28} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem' }}>Meeting Scheduled!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{meetingTitle} has been added to your calendar.</p>
              </div>
            ) : (
              <>
                {/* Modal header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(92,107,77,0.12)', color: 'var(--primary)', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Schedule Meeting</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{formatModalDate(selectedDate)}</p>
                  </div>
                </div>

                {submitError && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.85rem' }}>
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Meeting Title *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Weekly Standup"
                      value={meetingTitle}
                      onChange={e => setMeetingTitle(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Time
                    </label>
                    <input
                      type="time"
                      className="input-field"
                      value={meetingTime}
                      onChange={e => setMeetingTime(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Agenda / Notes <span style={{ fontWeight: 400 }}>(optional)</span>
                    </label>
                    <textarea
                      className="input-field"
                      placeholder="What will this meeting cover?"
                      value={meetingDesc}
                      onChange={e => setMeetingDesc(e.target.value)}
                      rows={3}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 2 }}
                      disabled={submitting || !meetingTitle.trim()}
                    >
                      {submitting ? 'Scheduling...' : '➕ Schedule Meeting'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

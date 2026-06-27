import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Video, Clock } from 'lucide-react';

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

  const fetchMeetings = async () => {
    try {
      const response = await fetch('http://localhost:5000/meetings', {
        headers: { Authorization: `Bearer ${token}` },
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
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // Day of week (0-6)
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const gridCells = [];

  // 1. Fills previous month padding cells
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    gridCells.push({
      day: prevMonthDays - i,
      month: currentMonth === 0 ? 11 : currentMonth - 1,
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      isCurrentMonth: false,
    });
  }

  // 2. Fills current month cells
  for (let i = 1; i <= totalDaysInMonth; i++) {
    gridCells.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
    });
  }

  // 3. Fills next month padding cells to complete a balanced grid (usually 42 cells)
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
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
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

  // Helper to filter meetings by cell date
  const getMeetingsForDate = (day: number, month: number, year: number) => {
    return meetings.filter(m => {
      const mDate = new Date(m.startTime);
      return (
        mDate.getDate() === day &&
        mDate.getMonth() === month &&
        mDate.getFullYear() === year
      );
    });
  };

  const isToday = (day: number, month: number, year: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Loading Calendar...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Calendar Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }} className="gradient-text">Meetings Calendar</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Schedule, track and launch meetings directly from the monthly planner.</p>
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

      {/* Calendar Card container */}
      <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Month Selector Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <span className="badge badge-info" style={{ textTransform: 'none', padding: '4px 12px', fontSize: '0.8rem' }}>
            {meetings.length} Scheduled
          </span>
        </div>

        {/* Weekday columns header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          {weekdayNames.map(name => (
            <div key={name} style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Day Grid cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(110px, auto)', gap: '10px' }}>
          {gridCells.map((cell, idx) => {
            const cellMeetings = getMeetingsForDate(cell.day, cell.month, cell.year);
            const isCellToday = isToday(cell.day, cell.month, cell.year);
            
            return (
              <div
                key={idx}
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
                  transition: 'var(--transition-smooth)',
                  position: 'relative'
                }}
              >
                {/* Day Number */}
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
                  alignSelf: 'flex-start'
                }}>
                  {cell.day}
                </div>

                {/* Day Meetings List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                  {cellMeetings.map((m: any) => {
                    const timeStr = new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isMeetingActive = m.status === 'ACTIVE';
                    const isMeetingPast = m.status === 'COMPLETED';

                    return (
                      <button
                        key={m.id}
                        onClick={() => onSelectMeeting(m.id)}
                        style={{
                          background: isMeetingActive 
                            ? 'rgba(16, 185, 129, 0.12)' 
                            : isMeetingPast 
                              ? 'rgba(255,255,255,0.03)' 
                              : 'rgba(92, 107, 77, 0.08)',
                          border: '1px solid',
                          borderColor: isMeetingActive 
                            ? 'rgba(16, 185, 129, 0.3)' 
                            : isMeetingPast 
                              ? 'var(--border-color)' 
                              : 'rgba(92, 107, 77, 0.2)',
                          color: isMeetingActive 
                            ? 'var(--success)' 
                            : isMeetingPast 
                              ? 'var(--text-secondary)' 
                              : 'var(--primary-hover)',
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
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        title={`${m.title} (${timeStr})`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', width: '100%' }}>
                          {isMeetingActive ? (
                            <span className="pulse-indicator active" style={{ width: '5px', height: '5px', flexShrink: 0 }} />
                          ) : (
                            <Clock size={8} style={{ flexShrink: 0 }} />
                          )}
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
    </div>
  );
};

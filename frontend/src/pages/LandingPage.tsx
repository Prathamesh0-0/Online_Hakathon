import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  Globe, 
  Volume2, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Twitter,
  Linkedin,
  Youtube
} from 'lucide-react';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Dynamic Date context
  const currentDateObj = new Date();
  const currentDateString = currentDateObj.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Live time ticker
  const [liveTime, setLiveTime] = useState<string>(
    new Date().toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Interactive Calendar View State
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const currentMonthName = calendarDate.toLocaleString('default', { month: 'long' });
  const currentYear = calendarDate.getFullYear();

  // Days count & start weekday offset (Monday layout)
  const daysInMonth = new Date(currentYear, calendarDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentYear, calendarDate.getMonth(), 1).getDay();
  const padCount = startDay === 0 ? 6 : startDay - 1;

  const handlePrevMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Dashboard mock tab state
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'highlights' | 'action-items'>('summary');
  
  // Checklist state in mock dashboard
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Design mockups for new dashboard', assignee: 'Emily', checked: false },
    { id: 2, text: 'Prepare beta rollout plan', assignee: 'Liam', checked: true },
    { id: 3, text: 'Update pricing page copy', assignee: 'Noah', checked: false },
  ]);

  // Calendar Scheduler State
  const [selectedTime, setSelectedTime] = useState<string>('1:00 PM');
  const [showBookingAlert, setShowBookingAlert] = useState(false);

  // Testimonials Carousel State
  const [activeQuoteIdx, setActiveQuoteIdx] = useState<number>(0);
  const testimonials = [
    {
      text: "CopilotAI is like having an extra teammate that never misses a thing.",
      name: "Marcus Lee",
      title: "Head of Operations, RemoteFirst",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&q=80"
    },
    {
      text: "The real-time transcription and action item tracking has cut our sync meeting times in half.",
      name: "Sarah Jenkins",
      title: "VP of Product, CloudTech",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80"
    },
    {
      text: "I love how it automatically syncs all tasks to ClickUp and Jira. It saves our engineers hours of manual entry.",
      name: "David Chen",
      title: "Engineering Manager, DevFlow",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80"
    }
  ];

  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setActiveQuoteIdx(prev => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(quoteTimer);
  }, []);

  const handleToggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const faqs = [
    {
      question: "What does the AI Meeting Copilot do?",
      answer: "CopilotAI is an interactive, real-time AI meeting assistant that streams your conversation, automatically transcribes speech, highlights key points, extracts timezone-aware action items with deadlines, and generates professional meeting summaries."
    },
    {
      question: "How does it handle different accents and regional languages?",
      answer: "Our system integrates Sarvam AI's advanced models (specifically saaras:v3 and bulbul:v3) which are optimized for multiple regional languages, Hinglish (code-mixed Hindi/English) dialogue, and diverse accents, ensuring highly accurate transcriptions."
    },
    {
      question: "What happens if API keys (Gemini, Groq, Sarvam AI) are not configured?",
      answer: "If API keys are missing, the system automatically falls back to Mock AI Mode. This mode generates fully structured mock summaries, transcript logs, and action items so you can evaluate all dashboard features seamlessly."
    },
    {
      question: "Where are my meeting records stored?",
      answer: "Structured details (users, meetings, tasks) are stored securely in our database (PostgreSQL/SQLite). Raw audio and transcription documents are archived in AWS S3, and semantic dialogue embeddings are indexed in Qdrant for fast query processing."
    },
    {
      question: "How does the semantic search knowledge base work?",
      answer: "We index meeting dialogue transcripts as vector embeddings in Qdrant. You can query your past meetings using natural language (e.g., 'What did Alice say about the Figma prototypes?') and get relevant results based on meaning rather than exact keywords."
    }
  ];

  const handleBookDemo = (e: React.FormEvent) => {
    e.preventDefault();
    setShowBookingAlert(true);
    setTimeout(() => {
      setShowBookingAlert(false);
    }, 4000);
  };

  const scrollToScheduler = () => {
    const element = document.getElementById('scheduler-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Mock dialogue for transcript tab
  const mockDialogue = [
    { speaker: 'Alice', text: "Let's review the Q3 roadmap. What's the status of the dashboard mockup?" },
    { speaker: 'Emily', text: "I'll have the Figma drafts ready for review by tomorrow afternoon." },
    { speaker: 'Liam', text: "And I am finalizing the beta rollout plan for the dev environment." }
  ];

  return (
    <div className="lp-wrapper">
      {/* Header */}
      <header className="lp-header">
        <a href="/" className="lp-logo">
          <span className="lp-logo-icon"><Sparkles size={22} fill="var(--lp-primary)" /></span>
          CopilotAI
        </a>
        
        <nav className="lp-nav">
          <a href="#features" className="lp-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>About us</a>
          <a href="#features" className="lp-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a>
          <a href="#faq-section" className="lp-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' }); }}>FAQ</a>
          <a href="#footer" className="lp-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' }); }}>Company</a>
        </nav>

        <div className="lp-header-actions">
          <button className="lp-btn-text" onClick={() => navigate('/login')}>Sign in</button>
          <button className="lp-btn-primary" onClick={() => navigate('/register')}>
            Register
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="lp-hero">
        {/* Hero Left Card */}
        <div className="lp-hero-left">
          <span className="lp-hero-tag">AI Meeting Copilot</span>
          <h1 className="lp-hero-title">
            Run meetings.<br />
            Not the <span>follow-up.</span>
          </h1>
          <p className="lp-hero-desc">
            CopilotAI captures every word, action, and decision so your team stays aligned—across any time zone.
          </p>

          <div className="lp-hero-ctas">
            <button className="lp-btn-primary" onClick={() => navigate('/register')}>
              Get Started
            </button>
            <button className="lp-btn-secondary" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>

          <div className="lp-hero-rating">
            <div className="lp-rating-avatars">
              <div className="lp-rating-avatar" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80')`, backgroundSize: 'cover' }}></div>
              <div className="lp-rating-avatar" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80')`, backgroundSize: 'cover' }}></div>
              <div className="lp-rating-avatar" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=80&h=80&q=80')`, backgroundSize: 'cover' }}></div>
              <div className="lp-rating-avatar" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=80&h=80&q=80')`, backgroundSize: 'cover' }}></div>
            </div>
            <div className="lp-rating-details">
              <div className="lp-stars">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                <span className="lp-rating-text" style={{ marginLeft: '8px', color: 'var(--lp-text-main)', fontWeight: 700 }}>4.9/5</span>
              </div>
              <span className="lp-rating-text">Loved by remote teams worldwide</span>
            </div>
          </div>

          <div className="lp-hero-globe-bg"></div>
        </div>

        {/* Hero Right Dashboard Mockup */}
        <div className="lp-hero-right">
          <div className="lp-dashboard-card">
            {/* Two-Tier Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 className="lp-db-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#2b3024' }}>Product Strategy Sync</h4>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="lp-rating-avatar" style={{ width: '26px', height: '26px', border: '1.5px solid #fff', backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=40&h=40&q=80')`, backgroundSize: 'cover' }}></div>
                  <div className="lp-rating-avatar" style={{ width: '26px', height: '26px', border: '1.5px solid #fff', backgroundImage: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=40&h=40&q=80')`, backgroundSize: 'cover', marginLeft: '-6px' }}></div>
                  <div className="lp-rating-avatar" style={{ width: '26px', height: '26px', border: '1.5px solid #fff', backgroundImage: `url('https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=40&h=40&q=80')`, backgroundSize: 'cover', marginLeft: '-6px' }}></div>
                  <div className="lp-rating-avatar" style={{ width: '26px', height: '26px', border: '1.5px solid #fff', backgroundImage: `url('https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=80&h=80&q=80')`, backgroundSize: 'cover', marginLeft: '-6px' }}></div>
                  <div className="lp-rating-avatar" style={{ width: '26px', height: '26px', border: '1.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d4cbb8', fontSize: '0.65rem', fontWeight: 800, color: '#4a573b', marginLeft: '-6px' }}>+3</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="lp-rec-indicator" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(234, 67, 53, 0.1)', color: '#ea4335', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                  <span className="lp-rec-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ea4335', display: 'inline-block' }}></span> REC
                </span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(24, 40, 72, 0.65)', fontWeight: 600 }}>32:14</span>
              </div>
            </div>

            {/* Tabs row with custom active states */}
            <div className="lp-db-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px', marginBottom: '20px' }}>
              <button 
                className={`lp-db-tab ${activeTab === 'summary' ? 'active' : ''}`} 
                onClick={() => setActiveTab('summary')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === 'summary' ? '#f0efe9' : 'none',
                  color: activeTab === 'summary' ? 'var(--lp-primary)' : 'var(--lp-text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Summary
              </button>
              <button 
                className={`lp-db-tab ${activeTab === 'transcript' ? 'active' : ''}`} 
                onClick={() => setActiveTab('transcript')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === 'transcript' ? '#f0efe9' : 'none',
                  color: activeTab === 'transcript' ? 'var(--lp-primary)' : 'var(--lp-text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Transcript
              </button>
              <button 
                className={`lp-db-tab ${activeTab === 'highlights' ? 'active' : ''}`} 
                onClick={() => setActiveTab('highlights')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === 'highlights' ? '#f0efe9' : 'none',
                  color: activeTab === 'highlights' ? 'var(--lp-primary)' : 'var(--lp-text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Highlights
              </button>
              <button 
                className={`lp-db-tab ${activeTab === 'action-items' ? 'active' : ''}`} 
                onClick={() => setActiveTab('action-items')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === 'action-items' ? '#f0efe9' : 'none',
                  color: activeTab === 'action-items' ? 'var(--lp-primary)' : 'var(--lp-text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Action Items
              </button>
            </div>

            {/* Inner Content Card body */}
            <div style={{ minHeight: '260px', background: '#fafaf8', borderRadius: '12px', padding: '20px', border: '1px solid rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
              {activeTab === 'summary' && (
                <div className="lp-summary-content animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: '#2b3024' }}>
                      <Sparkles size={14} fill="var(--lp-primary)" style={{ color: 'var(--lp-primary)' }} /> AI Summary
                    </span>
                    <span style={{ color: '#8e9686', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>✕</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#2b3024', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                    Discussed Q3 roadmap, user feedback, and prioritized features. Decided to launch AI reporting in beta.
                  </p>
                  
                  {/* Action Items directly embedded inside Summary Card View */}
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 12px 0', color: '#2b3024' }}>Action Items</h5>
                  <div className="lp-action-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {tasks.map(t => (
                      <div key={t.id} className="lp-action-item" onClick={() => handleToggleTask(t.id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', alignItems: 'center' }}>
                        <div className="lp-action-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="lp-action-checkbox" style={{
                            width: '15px',
                            height: '15px',
                            borderRadius: '4px',
                            border: '1.5px solid #8e9686',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: t.checked ? 'var(--lp-primary)' : 'none',
                            borderColor: t.checked ? 'var(--lp-primary)' : '#8e9686',
                            transition: 'all 0.15s ease'
                          }}>
                            {t.checked && <Check size={9} color="#fff" strokeWidth={3} />}
                          </div>
                          <span style={{ textDecoration: t.checked ? 'line-through' : 'none', opacity: t.checked ? 0.6 : 1, color: '#2b3024', fontWeight: 500 }}>{t.text}</span>
                        </div>
                        <span style={{ color: 'var(--lp-text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>{t.assignee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'transcript' && (
                <div className="lp-summary-content animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#2b3024' }}>Real-time Feed</span>
                    <span style={{ color: '#8e9686', cursor: 'pointer', fontSize: '0.85rem' }}>✕</span>
                  </div>
                  <div className="lp-summary-box" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', fontSize: '0.82rem' }}>
                    {mockDialogue.map((d, i) => (
                      <div key={i} style={{ color: '#2b3024', lineHeight: '1.4' }}>
                        <strong style={{ color: 'var(--lp-primary)', fontWeight: 700 }}>{d.speaker}:</strong> {d.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'highlights' && (
                <div className="lp-summary-content animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#2b3024' }}>Key Takeaways</span>
                    <span style={{ color: '#8e9686', cursor: 'pointer', fontSize: '0.85rem' }}>✕</span>
                  </div>
                  <div className="lp-summary-box" style={{ paddingLeft: '16px' }}>
                    <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#2b3024', lineHeight: '1.4' }}>
                      <li>Aligned on Q3 launch details.</li>
                      <li>Emily will design drafts by tomorrow.</li>
                      <li>Liam is finalizing deployment script.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'action-items' && (
                <div className="lp-actions-content animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#2b3024' }}>Checklist</span>
                    <span style={{ color: '#8e9686', cursor: 'pointer', fontSize: '0.85rem' }}>✕</span>
                  </div>
                  <div className="lp-action-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {tasks.map(t => (
                      <div key={t.id} className="lp-action-item" onClick={() => handleToggleTask(t.id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', alignItems: 'center' }}>
                        <div className="lp-action-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="lp-action-checkbox" style={{
                            width: '15px',
                            height: '15px',
                            borderRadius: '4px',
                            border: '1.5px solid #8e9686',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: t.checked ? 'var(--lp-primary)' : 'none',
                            borderColor: t.checked ? 'var(--lp-primary)' : '#8e9686'
                          }}>
                            {t.checked && <Check size={9} color="#fff" strokeWidth={3} />}
                          </div>
                          <span style={{ textDecoration: t.checked ? 'line-through' : 'none', opacity: t.checked ? 0.6 : 1, color: '#2b3024', fontWeight: 500 }}>{t.text}</span>
                        </div>
                        <span style={{ color: 'var(--lp-text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>{t.assignee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Custom High-Fidelity Footer */}
            <div className="lp-db-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
              <span className="lp-sync-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 800, color: '#2b3024' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', background: 'rgba(92,107,77,0.1)', borderRadius: '4px', color: 'var(--lp-primary)' }}>✓</span> Auto-sync to
              </span>
              <div className="lp-sync-platforms" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Notion SVG */}
                <div title="Notion" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="3.5" fill="#000000" />
                    <rect x="4.5" y="4.5" width="15" height="15" rx="2" fill="#ffffff" />
                    <path d="M7 6.5h1.5l5.5 8V6.5H16v11h-1.5L9 9.5v8H7v-11z" fill="#000000" />
                  </svg>
                </div>
                {/* Slack SVG */}
                <div title="Slack" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                    <path d="M5.04 15.12a2.52 2.52 0 11-2.52-2.52h2.52v2.52zm1.26 0a2.52 2.52 0 012.52-2.52h5.04a2.52 2.52 0 012.52 2.52v5.04a2.52 2.52 0 01-2.52 2.52H8.82a2.52 2.52 0 01-2.52-2.52v-5.04z" fill="#E01E5A" />
                    <path d="M8.88 5.04a2.52 2.52 0 112.52-2.52v2.52H8.88zm0 1.26a2.52 2.52 0 012.52 2.52v5.04a2.52 2.52 0 01-2.52 2.52H3.84a2.52 2.52 0 01-2.52-2.52V8.82a2.52 2.52 0 012.52-2.52h5.04z" fill="#36C5F0" />
                    <path d="M18.96 8.88a2.52 2.52 0 112.52 2.52h-2.52V8.88zm-1.26 0a2.52 2.52 0 01-2.52 2.52h-5.04a2.52 2.52 0 01-2.52-2.52V3.84a2.52 2.52 0 012.52-2.52h5.04a2.52 2.52 0 012.52 2.52v5.04z" fill="#2EB67D" />
                    <path d="M15.12 18.96a2.52 2.52 0 11-2.52 2.52v-2.52h2.52zm0-1.26a2.52 2.52 0 01-2.52-2.52v-5.04a2.52 2.52 0 012.52-2.52h5.04a2.52 2.52 0 012.52 2.52v5.04a2.52 2.52 0 01-2.52 2.52h-5.04z" fill="#ECB22E" />
                  </svg>
                </div>
                {/* Google Drive SVG */}
                <div title="Google Drive" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                    <path d="M8.5 2h7l6.5 11h-7z" fill="#FFC107" />
                    <path d="M15.5 13H8.5L5 20h7z" fill="#4CAF50" />
                    <path d="M8.5 2L5 8l3.5 12 3.5-6L8.5 2z" fill="#2196F3" />
                  </svg>
                </div>
                {/* Task Document Sync SVG */}
                <div title="Tasks Sync" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="#2b3024" strokeWidth="2.5" />
                    <path d="M8 8h8M8 12h8M8 16h5" stroke="#2b3024" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Works Where You Do Integration Bar */}
      <section className="lp-integrations-bar">
        {/* Label */}
        <div className="lp-int-label">
          WORKS WHERE YOU DO
        </div>

        {/* Logos row */}
        <div className="lp-int-logos" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          flex: 1
        }}>
          {/* Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(24, 40, 72, 0.65)' }}>
            <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <rect width="24" height="24" rx="6" fill="#2D8CFF" />
              <path d="M6.5 8.5h7.5a1 1 0 011 1v5a1 1 0 01-1 1H6.5a1 1 0 01-1-1v-5a1 1 0 011-1z" fill="#fff" />
              <path d="M16 11l3-2.5v7l-3-2.5z" fill="#fff" />
            </svg>
            <span>Zoom</span>
          </div>

          {/* Google Meet */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(24, 40, 72, 0.65)' }}>
            <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <path d="M3 6.5A1.5 1.5 0 014.5 5h10A1.5 1.5 0 0116 6.5v11a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 013 17.5z" fill="#00832F" />
              <path d="M16 9.5l4-3.5v12l-4-3.5z" fill="#00AA47" />
              <path d="M16 6.5L13.5 9H16z" fill="#2684FC" />
              <path d="M3 14.5L5.5 12H3z" fill="#FFBA00" />
              <path d="M13.5 15l2.5 2.5h-2.5z" fill="#EA4335" />
            </svg>
            <span>Google Meet</span>
          </div>

          {/* Microsoft Teams */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(24, 40, 72, 0.65)' }}>
            <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <circle cx="16" cy="8" r="2.5" fill="#5C60C8" />
              <path d="M12 14c0-2.2 3.6-3 4-3s4 .8 4 3v2h-8v-2z" fill="#5C60C8" />
              <circle cx="11.5" cy="9.5" r="2" fill="#7B83EB" />
              <path d="M8.5 15.2c0-1.8 2.8-2.5 3.2-2.5s3.2.7 3.2 2.5v1.3H8.5v-1.3z" fill="#7B83EB" />
              <rect x="3" y="6" width="10" height="12" rx="1.5" fill="#4B53BC" />
              <text x="6" y="15" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">T</text>
            </svg>
            <span>Microsoft Teams</span>
          </div>

          {/* Slack */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(24, 40, 72, 0.65)' }}>
            <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <path d="M5.04 15.12a2.52 2.52 0 11-2.52-2.52h2.52v2.52zm1.26 0a2.52 2.52 0 012.52-2.52h5.04a2.52 2.52 0 012.52 2.52v5.04a2.52 2.52 0 01-2.52 2.52H8.82a2.52 2.52 0 01-2.52-2.52v-5.04z" fill="#E01E5A" />
              <path d="M8.88 5.04a2.52 2.52 0 112.52-2.52v2.52H8.88zm0 1.26a2.52 2.52 0 012.52 2.52v5.04a2.52 2.52 0 01-2.52 2.52H3.84a2.52 2.52 0 01-2.52-2.52V8.82a2.52 2.52 0 012.52-2.52h5.04z" fill="#36C5F0" />
              <path d="M18.96 8.88a2.52 2.52 0 112.52 2.52h-2.52V8.88zm-1.26 0a2.52 2.52 0 01-2.52 2.52h-5.04a2.52 2.52 0 01-2.52-2.52V3.84a2.52 2.52 0 012.52-2.52h5.04a2.52 2.52 0 012.52 2.52v5.04z" fill="#2EB67D" />
              <path d="M15.12 18.96a2.52 2.52 0 11-2.52 2.52v-2.52h2.52zm0-1.26a2.52 2.52 0 01-2.52-2.52v-5.04a2.52 2.52 0 012.52-2.52h5.04a2.52 2.52 0 012.52 2.52v5.04a2.52 2.52 0 01-2.52 2.52h-5.04z" fill="#ECB22E" />
            </svg>
            <span>Slack</span>
          </div>

          {/* Notion */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(24, 40, 72, 0.65)' }}>
            <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <rect x="3" y="3" width="18" height="18" rx="3.5" fill="#000000" />
              <rect x="4.5" y="4.5" width="15" height="15" rx="2" fill="#ffffff" />
              <path d="M7 6.5h1.5l5.5 8V6.5H16v11h-1.5L9 9.5v8H7v-11z" fill="#000000" />
            </svg>
            <span>Notion</span>
          </div>

          {/* ClickUp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(24, 40, 72, 0.65)' }}>
            <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <defs>
                <linearGradient id="cu-top-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF00DF" />
                  <stop offset="100%" stopColor="#FF7A00" />
                </linearGradient>
                <linearGradient id="cu-bottom-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7B00FF" />
                  <stop offset="100%" stopColor="#00A3FF" />
                </linearGradient>
              </defs>
              <path d="M12 3L3.5 11.5l2 2L12 7l6.5 6.5 2-2z" fill="url(#cu-top-grad)" />
              <path d="M4.5 15.5c0 4.1 3.4 7.5 7.5 7.5s7.5-3.4 7.5-7.5h-3c0 2.5-2 4.5-4.5 4.5s-4.5-2-4.5-4.5h-3z" fill="url(#cu-bottom-grad)" />
            </svg>
            <span>ClickUp</span>
          </div>

          {/* Google Calendar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(24, 40, 72, 0.65)' }}>
            <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <rect width="24" height="24" rx="5" fill="#4285F4" />
              <rect x="4" y="8" width="16" height="12" rx="1.5" fill="#ffffff" />
              <text x="6" y="17" fill="#4285F4" fontSize="9" fontWeight="800" fontFamily="sans-serif">31</text>
              <circle cx="8" cy="5" r="1" fill="#fff" />
              <circle cx="16" cy="5" r="1" fill="#fff" />
            </svg>
            <span>Google Calendar</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="lp-features-grid" id="features">
        {/* Feature 1 */}
        <div className="lp-feat-card" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="lp-feat-icon-wrapper"><Sparkles size={20} /></div>
            <h3 className="lp-feat-title" style={{ fontSize: '1.5rem', marginBottom: '8px', lineHeight: '1.3' }}>AI Meeting Notes<br />That actually help</h3>
            <p className="lp-feat-desc" style={{ fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.5' }}>Get concise summaries, key decisions, and action items—instantly.</p>
            <a href="#features" className="lp-feat-link">Learn more <ArrowRight size={14} /></a>
          </div>
          
          <div className="lp-notes-graphic-container" style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            background: 'var(--lp-card-bg-light)',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            {/* Stacked Cards mockup background card layers */}
            <div style={{
              position: 'absolute',
              width: '75%',
              height: '170px',
              background: '#f9fafb',
              border: '1px solid rgba(0,0,0,0.03)',
              borderRadius: '16px',
              bottom: '16px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              width: '80%',
              height: '175px',
              background: '#f3f4f6',
              border: '1px solid rgba(0,0,0,0.03)',
              borderRadius: '16px',
              bottom: '22px',
              boxShadow: '0 6px 14px rgba(0,0,0,0.03)',
              zIndex: 1
            }} />

            {/* Main Foreground Card */}
            <div style={{
              position: 'relative',
              width: '85%',
              height: '180px',
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.04)',
              borderRadius: '16px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              zIndex: 2,
              bottom: '10px'
            }}>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" style={{ width: '12px', height: '12px', fill: '#fff' }}>
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-2h2v-2c0-1.66 1.34-3 3-3h2v2h-2c-.55 0-1 .45-1 1v2h3v2h-3v6.8c4.56-.93 8-4.96 8-9.8 0-5.52-4.48-10-10-10z" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#000' }}>Meeting notes</span>
              </div>

              {/* People & Info row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#ffafcc', border: '1px solid #fff', backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=40&h=40&q=80')`, backgroundSize: 'cover' }} />
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#bde0fe', border: '1px solid #fff', marginLeft: '-6px', backgroundImage: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=40&h=40&q=80')`, backgroundSize: 'cover' }} />
                  <span style={{ marginLeft: '6px', color: '#6b7280', fontWeight: 600 }}>2 people</span>
                </div>
              </div>

              {/* Edit / Share Buttons & Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ background: '#000', color: '#fff', padding: '3px 10px', borderRadius: '9999px', fontWeight: 700 }}>Edit</span>
                  <span style={{ background: '#f3f4f6', color: '#1f2937', padding: '3px 10px', borderRadius: '9999px', fontWeight: 600 }}>Share</span>
                </div>
                <span style={{ color: '#9ca3af', fontWeight: 500 }}>Edited 2 min ago</span>
              </div>

              {/* Summary Text Paragraph */}
              <p style={{
                fontSize: '0.62rem',
                color: '#4b5563',
                lineHeight: '1.4',
                margin: '4px 0',
                display: '-webkit-box',
                WebkitLineClamp: '3',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textAlign: 'left'
              }}>
                During the discussion, the current project status was reviewed, highlighting the completion and approval of all deliverables for Phase 1 of the new website design. The upcoming milestones were also discussed, with the Phase 2 kick-off scheduled for June 1, 2024.
              </p>

              {/* Footer View Transcript link */}
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#000', textAlign: 'left', cursor: 'pointer' }}>
                View transcript
              </div>
            </div>

            {/* Floating Audio Recording Pill Overlay */}
            <div style={{
              position: 'absolute',
              right: '15px',
              top: '15px',
              background: '#000',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '10px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              width: '135px',
              zIndex: 3,
              gap: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.55rem', opacity: 0.8 }}>
                <span>Recording</span>
                <span>•••</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontSize: '0.45rem'
                }}>▶</div>
                <div style={{ display: 'flex', gap: '1.5px', alignItems: 'center', height: '10px', flex: 1 }}>
                  {[4, 6, 8, 3, 7, 5, 8, 4, 6, 3, 5].map((h, i) => (
                    <div key={i} style={{ width: '1px', height: `${h * 1.2}px`, background: '#fff', opacity: 0.8 }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.55rem', fontWeight: 'bold' }}>6:03</span>
                <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>1x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="lp-feat-card" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="lp-feat-icon-wrapper"><Volume2 size={20} /></div>
            <h3 className="lp-feat-title" style={{ fontSize: '1.5rem', marginBottom: '8px', lineHeight: '1.3' }}>Accurate<br />Transcription</h3>
            <p className="lp-feat-desc" style={{ fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.5' }}>99% accuracy across accents and languages.</p>
            <a href="#features" className="lp-feat-link">Learn more <ArrowRight size={14} /></a>
          </div>

          <div className="lp-transcription-graphic-container" style={{
            position: 'relative',
            width: '100%',
            height: '180px',
            background: 'var(--lp-card-bg-light)',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            {/* White Recording Card */}
            <div style={{
              width: '90%',
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.04)',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Header: Name and Time */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.62rem',
                fontFamily: 'monospace, Courier New, monospace',
                color: '#9ca3af',
                letterSpacing: '0.5px'
              }}>
                <span>NEW RECORDING #256</span>
                <span>00:07</span>
              </div>

              {/* Symmetrical Soundwave with Red Playhead */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '45px',
                gap: '3px'
              }}>
                {/* Symmetrical Wave Bars */}
                {[
                  4, 10, 16, 12, 18, 26, 32, 28, 22, 14, 
                  18, 24, 30, 26, 20, 16, 10, 6, 4
                ].map((h, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '2px',
                      height: `${h}px`,
                      background: '#1f2937',
                      borderRadius: '1px'
                    }}
                  />
                ))}

                {/* Red Playhead line */}
                <div style={{
                  width: '1.5px',
                  height: '35px',
                  background: '#ef4444',
                  margin: '0 2px',
                  borderRadius: '1px'
                }} />

                {/* Gray dotted line */}
                <span style={{
                  color: '#d1d5db',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  marginLeft: '4px',
                  lineHeight: '1'
                }}>.......</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="lp-feat-card" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="lp-feat-icon-wrapper"><Globe size={20} /></div>
            <h3 className="lp-feat-title" style={{ fontSize: '1.5rem', marginBottom: '8px', lineHeight: '1.3' }}>Time Zone<br />Coordination</h3>
            <p className="lp-feat-desc" style={{ fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.5' }}>Smart scheduling that finds the best time for everyone.</p>
            <a href="#features" className="lp-feat-link">Learn more <ArrowRight size={14} /></a>
          </div>

          <div className="lp-timezone-graphic-container" style={{
            position: 'relative',
            width: '100%',
            height: '180px',
            background: 'var(--lp-card-bg-light)',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* 3D Glowing Globe Background */}
            <div style={{
              position: 'absolute',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #9dbaff 0%, #4b6cb7 55%, #182848 100%)',
              boxShadow: '0 8px 32px rgba(75, 108, 183, 0.45), inset -10px -10px 25px rgba(0,0,0,0.5), inset 10px 10px 20px rgba(255,255,255,0.4)',
              opacity: 0.85,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {/* Dotted continents overlay inside the globe */}
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', opacity: 0.6 }}>
                <path d="M15 35h15v20H15z M25 25h12v15H25z M45 40h20v25H45z M35 65h15v20H35z" fill="rgba(255,255,255,0.85)" style={{ mixBlendMode: 'overlay' }} />
                <circle cx="20" cy="30" r="1" fill="#fff" />
                <circle cx="24" cy="32" r="1.5" fill="#fff" />
                <circle cx="28" cy="35" r="1" fill="#fff" />
                <circle cx="32" cy="28" r="1" fill="#fff" />
                <circle cx="50" cy="45" r="1.2" fill="#fff" />
                <circle cx="54" cy="48" r="1.5" fill="#fff" />
                <circle cx="58" cy="52" r="1" fill="#fff" />
                <circle cx="62" cy="42" r="1.2" fill="#fff" />
                <circle cx="66" cy="46" r="1.5" fill="#fff" />
                <circle cx="42" cy="70" r="1.2" fill="#fff" />
                <circle cx="46" cy="74" r="1" fill="#fff" />
                <circle cx="50" cy="78" r="1.5" fill="#fff" />
              </svg>
            </div>

            {/* Dotted connection line SVG */}
            <svg
              viewBox="0 0 400 180"
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                zIndex: 1,
                pointerEvents: 'none'
              }}
            >
              <path d="M90 120 Q 200 30 310 110" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeDasharray="4,4" strokeWidth="2" />
            </svg>

            {/* San Francisco Node */}
            <div style={{
              position: 'absolute',
              left: '25px',
              bottom: '15px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0,0,0,0.05)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(24, 40, 72, 0.12)',
              zIndex: 2,
              textAlign: 'center',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#182848' }}>9:00 AM</span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(24, 40, 72, 0.6)', fontWeight: 700, marginTop: '2px', lineHeight: '1.2' }}>San Francisco</span>
            </div>

            {/* London Node */}
            <div style={{
              position: 'absolute',
              left: '160px',
              top: '10px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0,0,0,0.05)',
              width: '85px',
              height: '85px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(24, 40, 72, 0.12)',
              zIndex: 2,
              textAlign: 'center',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#182848' }}>5:00 PM</span>
              <span style={{ fontSize: '0.62rem', color: 'rgba(24, 40, 72, 0.6)', fontWeight: 700, marginTop: '2px' }}>London</span>
            </div>

            {/* Singapore Node */}
            <div style={{
              position: 'absolute',
              right: '25px',
              bottom: '15px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0,0,0,0.05)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(24, 40, 72, 0.12)',
              zIndex: 2,
              textAlign: 'center',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#182848' }}>1:00 AM</span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(24, 40, 72, 0.6)', fontWeight: 700, marginTop: '2px' }}>Singapore</span>
            </div>
          </div>
        </div>

        {/* Feature 4 Testimonial */}
        <div className="lp-feat-card lp-quote-card" style={{ cursor: 'pointer' }} onClick={() => setActiveQuoteIdx((activeQuoteIdx + 1) % 3)}>
          <div className="lp-quote-icon">“</div>
          <p className="lp-quote-text">
            {testimonials[activeQuoteIdx].text}
          </p>
          
          <div className="lp-quote-author">
            <div className="lp-author-avatar" style={{ backgroundImage: `url('${testimonials[activeQuoteIdx].avatar}')`, backgroundSize: 'cover' }}></div>
            <div className="lp-author-info">
              <span className="lp-author-name">{testimonials[activeQuoteIdx].name}</span>
              <span className="lp-author-title">{testimonials[activeQuoteIdx].title}</span>
            </div>
          </div>

          <div className="lp-quote-dots">
            {testimonials.map((_, idx) => (
              <div 
                key={idx} 
                className={`lp-quote-dot ${activeQuoteIdx === idx ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveQuoteIdx(idx);
                }}
              ></div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="lp-stats-row">
        <div className="lp-stat-item">
          <span className="lp-stat-number">10,000+</span>
          <span className="lp-stat-label">Teams using CopilotAI</span>
        </div>
        <div className="lp-stat-item">
          <span className="lp-stat-number">2M+</span>
          <span className="lp-stat-label">Meetings summarized</span>
        </div>
        <div className="lp-stat-item">
          <span className="lp-stat-number">15+</span>
          <span className="lp-stat-label">Hours saved per week</span>
        </div>
        <div className="lp-stat-item">
          <span className="lp-stat-number">99%</span>
          <span className="lp-stat-label">Transcription accuracy</span>
        </div>
      </section>

      {/* Security row */}
      <section className="lp-security-row">
        <div className="lp-sec-badges">
          <span className="lp-sec-badge"><ShieldCheck size={16} style={{ color: 'var(--lp-primary)' }} /> Enterprise-grade security</span>
          <span>SOC 2 Type II certified</span>
        </div>
        <a href="#features" className="lp-sec-link">Learn more <ArrowRight size={14} /></a>
      </section>

      {/* Booking / Calendar Section */}
      <section className="lp-booking-section" id="scheduler-section">
        <div className="lp-booking-card">
          <div className="lp-booking-left">
            <span className="lp-booking-tag">See CopilotAI in Action</span>
            <h2 className="lp-booking-title">See how CopilotAI can transform your meetings</h2>
            <p className="lp-booking-desc">
              Book a personalized demo and get answers to your team's specific needs.
            </p>
            <div>
              <button className="lp-btn-primary" onClick={scrollToScheduler}>
                Schedule a Demo
              </button>
            </div>
          </div>

          <div className="lp-booking-right">
            {/* Calendar widget */}
            <div className="lp-cal-container">
              <div className="lp-cal-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="lp-cal-month">{currentMonthName} {currentYear}</span>
                  <div className="lp-cal-nav">
                    <button className="lp-cal-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
                    <button className="lp-cal-nav-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--lp-text-muted)', fontWeight: 500 }}>
                  Today: {currentDateString}
                </div>
              </div>

              <div className="lp-cal-days-header">
                <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span>
              </div>

              <div className="lp-cal-grid">
                {/* Dynamically pad days based on starting weekday */}
                {Array.from({ length: padCount }).map((_, idx) => (
                  <span key={`empty-${idx}`} className="lp-cal-day empty"></span>
                ))}
                
                {/* Dynamically render days of the month */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const isSelected = selectedDate.getDate() === day &&
                                     selectedDate.getMonth() === calendarDate.getMonth() &&
                                     selectedDate.getFullYear() === calendarDate.getFullYear();
                  return (
                    <div 
                      key={day} 
                      className={`lp-cal-day ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedDate(new Date(currentYear, calendarDate.getMonth(), day))}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              <div className="lp-cal-footer">
                <div className="lp-cal-footer-left">
                  <div className="lp-cal-avatars">
                    <div className="lp-cal-avatar" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=40&h=40&q=80')`, backgroundSize: 'cover' }}></div>
                    <div className="lp-cal-avatar" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=40&h=40&q=80')`, backgroundSize: 'cover', marginLeft: '-4px' }}></div>
                  </div>
                  <span>Demo takes 30 minutes</span>
                </div>
                <span>Tailored to your team</span>
              </div>
            </div>

            {/* Time Slot Widget */}
            <div className="lp-times-container">
              <div className="lp-times-header" style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                <span className="lp-times-title">Available Times</span>
                <span className="lp-times-tz" style={{ fontSize: '0.72rem', color: 'var(--lp-primary)', fontWeight: 'bold' }}>
                  Live Time: {liveTime}
                </span>
              </div>

              <div className="lp-times-list">
                {['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'].map(time => (
                  <div 
                    key={time} 
                    className={`lp-time-slot ${selectedTime === time ? 'selected' : ''}`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </div>
                ))}
              </div>

              <button className="lp-btn-primary" style={{ width: '100%', padding: '10px 0', fontSize: '0.85rem' }} onClick={handleBookDemo}>
                Book Time Slot
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Success Alert */}
      {showBookingAlert && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#ffffff',
          borderLeft: '4px solid var(--lp-primary)',
          padding: '16px 24px',
          borderRadius: 'var(--lp-radius-sm)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fade-in 0.3s ease'
        }}>
          <Sparkles size={20} style={{ color: 'var(--lp-primary)' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.9rem' }}>Demo Request Received!</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>
              Successfully booked for {selectedDate.toLocaleString('default', { month: 'long' })} {selectedDate.getDate()}, {selectedDate.getFullYear()} at {selectedTime}. Check your email.
            </span>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <section className="lp-faq-section" id="faq-section">
        <div className="lp-faq-header">
          <span className="lp-faq-subtitle">Questions & Answers</span>
          <h2 className="lp-faq-title">Frequently Asked Questions</h2>
        </div>
        <div className="lp-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div 
                key={idx} 
                className={`lp-faq-item ${isOpen ? 'open' : ''}`}
              >
                <button 
                  className="lp-faq-question-btn"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span className="lp-faq-question">{faq.question}</span>
                  <span className="lp-faq-icon">
                    <ChevronDown size={18} />
                  </span>
                </button>
                <div 
                  className="lp-faq-answer-wrapper" 
                  style={{ maxHeight: isOpen ? '200px' : '0' }}
                >
                  <p className="lp-faq-answer">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer" id="footer">
        <div className="lp-footer-container">
          <div className="lp-footer-left">
            <a href="/" className="lp-logo">
              <span className="lp-logo-icon"><Sparkles size={22} fill="var(--lp-primary)" /></span>
              CopilotAI
            </a>
            <p className="lp-footer-desc">
              CopilotAI is the AI meeting copilot for remote teams. We help you capture conversations and focus on what's next.
            </p>
            <div className="lp-social-links">
              <a href="#footer" className="lp-social-link"><Twitter size={18} /></a>
              <a href="#footer" className="lp-social-link"><Linkedin size={18} /></a>
              <a href="#footer" className="lp-social-link"><Youtube size={18} /></a>
            </div>
          </div>

          <div className="lp-footer-col">
            <span className="lp-footer-title">Product</span>
            <div className="lp-footer-links">
              <a href="#features" className="lp-footer-link">Overview</a>
              <a href="#features" className="lp-footer-link">Features</a>
              <a href="#features" className="lp-footer-link">Integrations</a>
            </div>
          </div>

          <div className="lp-footer-col">
            <span className="lp-footer-title">Resources</span>
            <div className="lp-footer-links">
              <a href="#scheduler-section" className="lp-footer-link">Blog</a>
              <a href="#scheduler-section" className="lp-footer-link">Guides</a>
              <a href="#scheduler-section" className="lp-footer-link">Help Center</a>
            </div>
          </div>

          <div className="lp-footer-col">
            <span className="lp-footer-title">Company</span>
            <div className="lp-footer-links">
              <a href="#footer" className="lp-footer-link">About Us</a>
              <a href="#footer" className="lp-footer-link">Careers</a>
              <a href="/contact" className="lp-footer-link" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

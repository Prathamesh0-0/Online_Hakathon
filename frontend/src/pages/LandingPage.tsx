import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Play, 
  Calendar, 
  Check, 
  ArrowRight, 
  Globe, 
  Volume2, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Twitter,
  Linkedin,
  Youtube
} from 'lucide-react';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Dashboard mock tab state
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'highlights' | 'action-items'>('summary');
  
  // Checklist state in mock dashboard
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Design mockups for new dashboard', assignee: 'Emily', checked: false },
    { id: 2, text: 'Prepare beta rollout plan', assignee: 'Liam', checked: true },
    { id: 3, text: 'Update pricing page copy', assignee: 'Noah', checked: false },
  ]);

  // Calendar Scheduler State
  const [selectedDay, setSelectedDay] = useState<number>(22);
  const [selectedTime, setSelectedTime] = useState<string>('1:00 PM');
  const [showBookingAlert, setShowBookingAlert] = useState(false);

  // Soundwave Animation State
  const [waveHeights, setWaveHeights] = useState<number[]>([30, 50, 80, 40, 90, 60, 30, 70, 40, 60, 80, 50, 30]);

  useEffect(() => {
    // Animate wave heights randomly for the "Accurate Transcription" wave graphic
    const interval = setInterval(() => {
      setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 80) + 15));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const handleToggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };

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
          <a href="#features" className="lp-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Product</a>
          <a href="#features" className="lp-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a>
          <a href="#scheduler-section" className="lp-nav-link" onClick={(e) => { e.preventDefault(); scrollToScheduler(); }}>Resources</a>
          <a href="#footer" className="lp-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' }); }}>Company</a>
        </nav>

        <div className="lp-header-actions">
          <button className="lp-btn-text" onClick={() => navigate('/login')}>Sign in</button>
          <button className="lp-btn-primary" onClick={scrollToScheduler}>
            Schedule a Demo
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
            <button className="lp-btn-primary" onClick={scrollToScheduler}>
              <Calendar size={16} /> Schedule a Demo
            </button>
            <button className="lp-btn-secondary" onClick={() => navigate('/login')}>
              <Play size={18} fill="currentColor" /> See How It Works
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
            <div className="lp-db-header">
              <h4 className="lp-db-title">Product Strategy Sync</h4>
              <div className="lp-db-meta">
                <span className="lp-rec-indicator">
                  <span className="lp-rec-dot"></span> REC
                </span>
                <span>32:14</span>
                <div style={{ display: 'flex', marginLeft: '4px' }}>
                  <div className="lp-rating-avatar" style={{ width: '22px', height: '22px', border: '1px solid #fff', backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=40&h=40&q=80')`, backgroundSize: 'cover' }}></div>
                  <div className="lp-rating-avatar" style={{ width: '22px', height: '22px', border: '1px solid #fff', backgroundImage: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=40&h=40&q=80')`, backgroundSize: 'cover', marginLeft: '-4px' }}></div>
                  <div className="lp-rating-avatar" style={{ width: '22px', height: '22px', border: '1px solid #fff', backgroundImage: `url('https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=40&h=40&q=80')`, backgroundSize: 'cover', marginLeft: '-4px' }}></div>
                  <div className="lp-rating-avatar" style={{ width: '22px', height: '22px', border: '1px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lp-primary)', fontSize: '0.55rem', color: '#fff', marginLeft: '-4px' }}>+3</div>
                </div>
              </div>
            </div>

            <div className="lp-db-tabs">
              <button className={`lp-db-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</button>
              <button className={`lp-db-tab ${activeTab === 'transcript' ? 'active' : ''}`} onClick={() => setActiveTab('transcript')}>Transcript</button>
              <button className={`lp-db-tab ${activeTab === 'highlights' ? 'active' : ''}`} onClick={() => setActiveTab('highlights')}>Highlights</button>
              <button className={`lp-db-tab ${activeTab === 'action-items' ? 'active' : ''}`} onClick={() => setActiveTab('action-items')}>Action items</button>
            </div>

            <div style={{ minHeight: '190px' }}>
              {activeTab === 'summary' && (
                <div className="lp-summary-content animate-fade-in">
                  <div className="lp-summary-title">
                    <Sparkles size={16} style={{ color: 'var(--lp-primary)' }} />
                    AI Summary
                  </div>
                  <div className="lp-summary-box">
                    Discussed Q3 roadmap, user feedback, and prioritized features. Decided to launch AI reporting in beta.
                  </div>
                </div>
              )}

              {activeTab === 'transcript' && (
                <div className="lp-summary-content animate-fade-in">
                  <div className="lp-summary-title">Real-time Feed</div>
                  <div className="lp-summary-box" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto', fontSize: '0.85rem' }}>
                    {mockDialogue.map((d, i) => (
                      <div key={i}>
                        <strong style={{ color: 'var(--lp-primary)' }}>{d.speaker}:</strong> {d.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'highlights' && (
                <div className="lp-summary-content animate-fade-in">
                  <div className="lp-summary-title">Key Takeaways</div>
                  <div className="lp-summary-box" style={{ paddingLeft: '24px' }}>
                    <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                      <li>Aligned on Q3 launch details.</li>
                      <li>Emily will design drafts by tomorrow.</li>
                      <li>Liam is finalizing deployment script.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'action-items' && (
                <div className="lp-actions-content animate-fade-in">
                  <div className="lp-actions-title">Checklist</div>
                  <div className="lp-action-list">
                    {tasks.map(t => (
                      <div key={t.id} className="lp-action-item" onClick={() => handleToggleTask(t.id)} style={{ cursor: 'pointer' }}>
                        <div className="lp-action-left">
                          <div className="lp-action-checkbox" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.checked ? 'var(--lp-primary)' : 'none', borderColor: t.checked ? 'var(--lp-primary)' : 'var(--lp-text-light)' }}>
                            {t.checked && <Check size={10} color="#fff" strokeWidth={3} />}
                          </div>
                          <span style={{ textDecoration: t.checked ? 'line-through' : 'none', opacity: t.checked ? 0.6 : 1 }}>{t.text}</span>
                        </div>
                        <span className="lp-action-assignee">{t.assignee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lp-db-footer">
              <span className="lp-sync-label">
                <Check size={14} style={{ color: 'var(--lp-primary)', strokeWidth: 3 }} /> Auto-sync to
              </span>
              <div className="lp-sync-platforms">
                <div className="lp-sync-icon" title="Notion">N</div>
                <div className="lp-sync-icon" title="Slack">💬</div>
                <div className="lp-sync-icon" title="Google Drive">📁</div>
                <div className="lp-sync-icon" title="Jira">⚙️</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Works Where You Do Integration Bar */}
      <section className="lp-integrations-bar">
        <div className="lp-int-label">Works Where You Do</div>
        <div className="lp-int-logos">
          <div className="lp-int-logo">🎥 Zoom</div>
          <div className="lp-int-logo">🟢 Google Meet</div>
          <div className="lp-int-logo">💻 Microsoft Teams</div>
          <div className="lp-int-logo">💬 Slack</div>
          <div className="lp-int-logo">📓 Notion</div>
          <div className="lp-int-logo">📅 Google Calendar</div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="lp-features-grid" id="features">
        {/* Feature 1 */}
        <div className="lp-feat-card">
          <div className="lp-feat-icon-wrapper"><Sparkles size={20} /></div>
          <h3 className="lp-feat-title">AI Meeting Notes<br />That actually help</h3>
          <p className="lp-feat-desc">Get concise summaries, key decisions, and action items—instantly.</p>
          <a href="#features" className="lp-feat-link">Learn more <ArrowRight size={14} /></a>
          
          <div className="lp-notes-graphic">
            <div className="lp-notes-line"></div>
            <div className="lp-notes-line half"></div>
            <div className="lp-notes-line short"></div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="lp-feat-card">
          <div className="lp-feat-icon-wrapper"><Volume2 size={20} /></div>
          <h3 className="lp-feat-title">Accurate<br />Transcription</h3>
          <p className="lp-feat-desc">99% accuracy across accents and languages.</p>
          <a href="#features" className="lp-feat-link">Learn more <ArrowRight size={14} /></a>

          <div className="lp-transcription-graphic">
            {waveHeights.map((h, i) => (
              <div 
                key={i} 
                className={`lp-wave-bar ${i > 3 && i < 9 ? 'active' : ''}`} 
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Feature 3 */}
        <div className="lp-feat-card">
          <div className="lp-feat-icon-wrapper"><Globe size={20} /></div>
          <h3 className="lp-feat-title">Time Zone<br />Coordination</h3>
          <p className="lp-feat-desc">Smart scheduling that finds the best time for everyone.</p>
          <a href="#features" className="lp-feat-link">Learn more <ArrowRight size={14} /></a>

          <div className="lp-timezone-graphic">
            <div className="lp-tz-node">
              <span className="lp-tz-time">9:00 AM</span>
              <span className="lp-tz-label">San Francisco</span>
            </div>
            <div className="lp-tz-node">
              <span className="lp-tz-time">5:00 PM</span>
              <span className="lp-tz-label">London</span>
            </div>
            <div className="lp-tz-node">
              <span className="lp-tz-time">1:00 AM</span>
              <span className="lp-tz-label">Singapore</span>
            </div>
          </div>
        </div>

        {/* Feature 4 Testimonial */}
        <div className="lp-feat-card lp-quote-card">
          <div className="lp-quote-icon">“</div>
          <p className="lp-quote-text">
            CopilotAI is like having an extra teammate that never misses a thing.
          </p>
          
          <div className="lp-quote-author">
            <div className="lp-author-avatar" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&q=80')`, backgroundSize: 'cover' }}></div>
            <div className="lp-author-info">
              <span className="lp-author-name">Marcus Lee</span>
              <span className="lp-author-title">Head of Operations, RemoteFirst</span>
            </div>
          </div>

          <div className="lp-quote-dots">
            <div className="lp-quote-dot active"></div>
            <div className="lp-quote-dot"></div>
            <div className="lp-quote-dot"></div>
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
              <div className="lp-cal-header">
                <span className="lp-cal-month">May 2024</span>
                <div className="lp-cal-nav">
                  <button className="lp-cal-nav-btn"><ChevronLeft size={16} /></button>
                  <button className="lp-cal-nav-btn"><ChevronRight size={16} /></button>
                </div>
              </div>

              <div className="lp-cal-days-header">
                <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span>
              </div>

              <div className="lp-cal-grid">
                {/* Pad first week of May 2024 (starts on Wednesday) */}
                <span className="lp-cal-day empty"></span>
                <span className="lp-cal-day empty"></span>
                {Array.from({ length: 24 }, (_, i) => i + 1).map(day => {
                  // Filter out weekends for display (days 4, 5, 11, 12, 18, 19, 25, 26 in May are weekends)
                  const matches = [29, 30, 1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 27, 28, 29, 30, 31];
                  const displayDay = matches[day - 1] || day;
                  return (
                    <div 
                      key={day} 
                      className={`lp-cal-day ${selectedDay === displayDay ? 'active' : ''}`}
                      onClick={() => setSelectedDay(displayDay)}
                    >
                      {displayDay}
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
              <div className="lp-times-header">
                <span className="lp-times-title">Available Times</span>
                <span className="lp-times-tz">(GMT+0) Pacific Time</span>
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
              Successfully booked for May {selectedDay} at {selectedTime}. Check your email.
            </span>
          </div>
        </div>
      )}

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
              <a href="#footer" className="lp-footer-link">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

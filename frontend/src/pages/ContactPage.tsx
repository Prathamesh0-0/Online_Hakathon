import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import './ContactPage.css';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="cp-wrapper">

      {/* Header */}
      <header className="cp-header">
        <a href="/" className="cp-logo" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <span className="cp-logo-icon"><Sparkles size={20} fill="var(--cp-primary)" /></span>
          CopilotAI
        </a>
        <button className="cp-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={15} /> Back
        </button>
      </header>

      {/* Page Body */}
      <main className="cp-body">
        <div className="cp-card">

          {submitted ? (
            <div className="cp-success">
              <CheckCircle size={48} className="cp-success-icon" />
              <h2>Message Sent!</h2>
              <p>Thanks <strong>{formData.name}</strong>! We'll reply to <strong>{formData.email}</strong> soon.</p>
              <button className="cp-btn" onClick={() => navigate('/')}>Go Home</button>
            </div>
          ) : (
            <>
              <h1 className="cp-title">Contact Us</h1>
              <p className="cp-subtitle">Have a question or feedback? We'd love to hear from you.</p>

              <form onSubmit={handleSubmit} className="cp-form">
                <div className="cp-field">
                  <label htmlFor="name">Name</label>
                  <input
                    id="name" name="name" type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="cp-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email" name="email" type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="cp-field">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message" name="message"
                    placeholder="Write your message here..."
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button type="submit" className="cp-btn" disabled={loading}>
                  {loading ? <span className="cp-spinner" /> : <><Send size={15} /> Send Message</>}
                </button>
              </form>

              <div className="cp-divider" />

              <div className="cp-contact-info">
                <span>📧 hello@copilotai.com</span>
                <span>📞 +1 (800) 555-0199</span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

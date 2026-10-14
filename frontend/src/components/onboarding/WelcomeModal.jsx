import React from 'react';
import { 
  Sparkles, CheckCircle2, ArrowRight, X, Compass, 
  Layers, ShieldCheck, Clock
} from 'lucide-react';

export default function WelcomeModal({ user, onStartTour, onSkipTour }) {
  const firstName = user?.first_name || user?.username || 'Team Member';
  const roleName = user?.role || 'Operator';

  return (
    <div className="onboarding-modal-overlay">
      <div className="onboarding-welcome-card">
        {/* Close Button */}
        <button 
          className="onboarding-close-x"
          onClick={onSkipTour}
          title="Skip Welcome Tour"
          aria-label="Skip Welcome Tour"
        >
          <X size={18} />
        </button>

        {/* Brand Tag */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} className="badge-pill badge-mint">
          <Sparkles size={13} /> Welcome to Minu Marketing
        </div>

        {/* Personalized Heading */}
        <h2 className="onboarding-welcome-title">
          Welcome aboard, {firstName}! <span className="waving-hand">👋</span>
        </h2>
        <p className="onboarding-welcome-desc">
          You are signed in as an <strong>{roleName}</strong>. Let's take a quick interactive tour to discover key capabilities, live stock telemetry, and operational workflows.
        </p>

        {/* Value Proposition Pills */}
        <div className="onboarding-feature-grid">
          <div className="onboarding-feature-item">
            <div className="onboarding-feature-icon">
              <Compass size={18} color="var(--accent-blue)" />
            </div>
            <div>
              <div className="onboarding-feature-head">Interactive Walkthrough</div>
              <div className="onboarding-feature-sub">Guided spotlight through live modules, search, and transactions.</div>
            </div>
          </div>

          <div className="onboarding-feature-item">
            <div className="onboarding-feature-icon">
              <Layers size={18} color="#D97706" />
            </div>
            <div>
              <div className="onboarding-feature-head">Stock Telemetry & Alerts</div>
              <div className="onboarding-feature-sub">Monitor live valuation, threshold triggers, and PDF reports.</div>
            </div>
          </div>

          <div className="onboarding-feature-item">
            <div className="onboarding-feature-icon">
              <ShieldCheck size={18} color="#059669" />
            </div>
            <div>
              <div className="onboarding-feature-head">Role-Based Access</div>
              <div className="onboarding-feature-sub">Concurrency-safe ledger shifts and security audit logging.</div>
            </div>
          </div>
        </div>

        {/* Tour Meta Info */}
        <div className="onboarding-meta-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Clock size={14} /> Estimated time: <strong>~3 minutes</strong> &bull; 5 Chapters
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Can be replayed anytime from topbar
          </div>
        </div>

        {/* Action Buttons */}
        <div className="onboarding-welcome-actions">
          <button 
            type="button" 
            className="btn-pill btn-pill-soft"
            onClick={onSkipTour}
            style={{ padding: '10px 20px', fontSize: '0.88rem' }}
          >
            I'll Explore on My Own
          </button>
          <button 
            type="button" 
            className="btn-pill btn-pill-dark"
            onClick={onStartTour}
            style={{ padding: '10px 24px', fontSize: '0.88rem', gap: '8px' }}
          >
            Start Interactive Tour <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

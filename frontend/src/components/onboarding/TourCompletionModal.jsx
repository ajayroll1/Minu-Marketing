import React from 'react';
import { 
  CheckCircle2, Compass, ArrowRight, RotateCcw, 
  ChevronRight, Sparkles 
} from 'lucide-react';

export default function TourCompletionModal({ 
  user, 
  completedStepsCount, 
  totalStepsCount, 
  onFinish, 
  onRestart,
  onOpenChecklist
}) {
  const firstName = user?.first_name || user?.username || 'Team Member';

  return (
    <div className="onboarding-modal-overlay">
      <div className="onboarding-welcome-card" style={{ textAlign: 'center' }}>
        <div 
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#DEF7EC',
            color: '#03543F',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(3, 84, 63, 0.12)'
          }}
        >
          <CheckCircle2 size={36} color="#059669" />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }} className="badge-pill badge-mint">
          <Sparkles size={13} /> Tour Complete
        </div>

        <h2 className="onboarding-welcome-title" style={{ marginTop: '4px' }}>
          You're all set, {firstName}! 🎉
        </h2>

        <p className="onboarding-welcome-desc" style={{ maxWidth: '440px', margin: '0 auto 20px' }}>
          You've explored the core capabilities of Minu Marketing IMS. Live inventory valuation, append-only stock mutations, automated thresholds, and access control are now ready for your daily workflow.
        </p>

        {/* Quick summary stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          padding: '16px',
          backgroundColor: '#F8FAFD',
          borderRadius: '16px',
          marginBottom: '24px',
          border: '1px solid var(--border-light)'
        }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {completedStepsCount}/{totalStepsCount}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tour Milestones</div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>100%</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Orientation</div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue)' }}>Live</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>System Status</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            type="button" 
            className="btn-pill btn-pill-soft"
            onClick={onRestart}
            style={{ padding: '10px 18px', fontSize: '0.86rem' }}
          >
            <RotateCcw size={14} /> Replay Tour
          </button>

          <button 
            type="button" 
            className="btn-pill btn-pill-dark"
            onClick={onFinish}
            style={{ padding: '10px 24px', fontSize: '0.86rem', gap: '6px' }}
          >
            Go to Workspace &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

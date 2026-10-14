import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
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

  // Trigger celebratory confetti burst on mount
  useEffect(() => {
    // Center cannon burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#6366F1', '#F59E0B', '#EC4899'],
        disableForReducedMotion: true
      });

      // Secondary left & right celebration streams
      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#10B981', '#3B82F6', '#60A5FA']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#10B981', '#3B82F6', '#F59E0B']
        });
      }, 250);

      return () => clearTimeout(timer);
    } catch (e) {
      console.warn('Celebration confetti effect:', e);
    }
  }, []);

  return (
    <div className="onboarding-modal-overlay">
      <div className="onboarding-welcome-card" style={{ textAlign: 'center' }}>
        
        {/* Centered green check icon circle ABOVE the badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#DEF7EC',
              color: '#03543F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(3, 84, 63, 0.14)'
            }}
          >
            <CheckCircle2 size={36} color="#059669" />
          </div>
        </div>

        {/* Tour Complete pill centered directly underneath the icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div className="badge-pill badge-mint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} /> TOUR COMPLETE
          </div>
        </div>

        <h2 className="onboarding-welcome-title" style={{ marginTop: '0', fontSize: '1.45rem' }}>
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

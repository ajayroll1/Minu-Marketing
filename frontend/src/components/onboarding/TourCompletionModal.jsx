import React, { useEffect, useRef } from 'react';
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
  const canvasRef = useRef(null);

  // Confetti bounded strictly inside the popup modal card
  useEffect(() => {
    if (!canvasRef.current) return;

    let myConfetti = null;
    let timer = null;

    try {
      myConfetti = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true
      });

      // Fire celebratory burst strictly constrained within the popup card canvas
      myConfetti({
        particleCount: 55,
        spread: 60,
        origin: { x: 0.5, y: 0.25 },
        colors: ['#10B981', '#3B82F6', '#6366F1', '#F59E0B', '#EC4899'],
        disableForReducedMotion: true,
        gravity: 1.1,
        ticks: 200
      });

      timer = setTimeout(() => {
        if (myConfetti) {
          myConfetti({
            particleCount: 35,
            spread: 50,
            origin: { x: 0.5, y: 0.2 },
            colors: ['#10B981', '#3B82F6', '#F59E0B'],
            gravity: 1.2,
            ticks: 180
          });
        }
      }, 300);
    } catch (e) {
      console.warn('Modal confetti error:', e);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (myConfetti) {
        try {
          myConfetti.reset();
        } catch (_) {}
      }
    };
  }, []);

  return (
    <div className="onboarding-modal-overlay">
      <div 
        className="onboarding-welcome-card" 
        style={{ 
          textAlign: 'center', 
          position: 'relative', 
          overflow: 'hidden' 
        }}
      >
        {/* Isolated Canvas covering ONLY this popup modal card */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10
          }}
        />

        {/* Content container with higher z-index to stay crisp above confetti particles */}
        <div style={{ position: 'relative', zIndex: 20 }}>
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
    </div>
  );
}

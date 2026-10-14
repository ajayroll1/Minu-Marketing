import React, { useEffect, useState, useRef } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Check, HelpCircle, 
  RotateCcw, Sparkles 
} from 'lucide-react';

export default function TourSpotlightTooltip({
  step,
  stepIndex,
  totalSteps,
  chapterInfo,
  onNext,
  onPrev,
  onSkip,
  onFinish
}) {
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [arrowSide, setArrowSide] = useState('top');
  const tooltipRef = useRef(null);

  // Recalculate target element position and scroll into view smoothly
  useEffect(() => {
    let animationFrameId;

    const updatePosition = () => {
      if (!step?.target) return;
      const el = document.querySelector(step.target);
      if (!el) {
        setTargetRect(null);
        return;
      }

      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right
      });

      // Position tooltip relative to target rect
      const tooltipEl = tooltipRef.current;
      const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 360;
      const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 220;
      const margin = 14;

      const placement = step.placement || 'bottom';
      let top = 0;
      let left = 0;
      let side = 'top';

      if (placement === 'bottom') {
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        side = 'top';
      } else if (placement === 'top') {
        top = rect.top - tooltipHeight - margin;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        side = 'bottom';
      } else if (placement === 'left') {
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - margin;
        side = 'right';
      } else if (placement === 'right') {
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + margin;
        side = 'left';
      }

      // Viewport collision boundary detection
      const padding = 16;
      const maxLeft = window.innerWidth - tooltipWidth - padding;
      const maxTop = window.innerHeight - tooltipHeight - padding;

      if (left < padding) left = padding;
      if (left > maxLeft) left = maxLeft;
      if (top < padding) top = padding;
      if (top > maxTop) top = maxTop;

      setTooltipPos({ top, left });
      setArrowSide(side);
    };

    // Scroll element smoothly into center view if outside visible viewport
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      const isInViewport = (
        rect.top >= 60 &&
        rect.bottom <= window.innerHeight - 60 &&
        rect.left >= 40 &&
        rect.right <= window.innerWidth - 40
      );

      if (!isInViewport) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    }

    updatePosition();

    // Listen to resize, scroll and dynamic repositioning
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const interval = setInterval(updatePosition, 300);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      clearInterval(interval);
      cancelAnimationFrame(animationFrameId);
    };
  }, [step]);

  const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <>
      {/* Dynamic SVG / Canvas Spotlight Cutout Overlay */}
      <svg className="onboarding-spotlight-svg" aria-hidden="true">
        <defs>
          <mask id="spotlight-mask">
            {/* White base = fully dark overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout = transparent spotlight hole */}
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(17, 20, 28, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Target Highlight Pulsing Ring */}
      {targetRect && (
        <div
          className="onboarding-target-pulse-ring"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: '14px',
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        ref={tooltipRef}
        className="onboarding-tooltip-card"
        style={{
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
        }}
      >
        {/* Header: Chapter title & close */}
        <div className="onboarding-tooltip-header">
          <div className="onboarding-tooltip-chapter-badge">
            <Sparkles size={12} color="var(--accent-blue)" />
            <span>{chapterInfo?.title || 'Tour Navigation'}</span>
          </div>

          <button
            className="onboarding-tooltip-close"
            onClick={onSkip}
            title="Exit Tour"
            aria-label="Exit Tour"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="onboarding-tooltip-body">
          <h4 className="onboarding-tooltip-title">{step.title}</h4>
          <p className="onboarding-tooltip-desc">{step.content}</p>
        </div>

        {/* Segmented Progress Bar */}
        <div className="onboarding-progress-wrapper">
          <div className="onboarding-progress-bar">
            <div 
              className="onboarding-progress-fill" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
          <div className="onboarding-progress-text">
            <span>Step <strong>{stepIndex + 1}</strong> of <strong>{totalSteps}</strong></span>
            <span>{progressPercent}%</span>
          </div>
        </div>

        {/* Controls Bar: Prev, Next / Finish */}
        <div className="onboarding-tooltip-footer">
          <button
            type="button"
            className="btn-pill btn-pill-soft"
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            onClick={onPrev}
            disabled={stepIndex === 0}
          >
            <ChevronLeft size={13} /> Prev
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-pill btn-pill-soft"
              style={{ padding: '6px 12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}
              onClick={onSkip}
            >
              Skip
            </button>

            {stepIndex + 1 < totalSteps ? (
              <button
                type="button"
                className="btn-pill btn-pill-dark"
                style={{ padding: '6px 16px', fontSize: '0.78rem', gap: '4px' }}
                onClick={onNext}
              >
                Next <ChevronRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                className="btn-pill btn-pill-dark"
                style={{ padding: '6px 16px', fontSize: '0.78rem', gap: '4px', backgroundColor: '#059669' }}
                onClick={onFinish}
              >
                Finish Tour <Check size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

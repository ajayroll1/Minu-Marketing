import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, ChevronDown, ChevronUp, X, 
  ArrowRight, Compass, Sparkles, Award 
} from 'lucide-react';
import { ONBOARDING_CHECKLIST_ITEMS } from '../../config/tourConfig';

export default function OnboardingChecklist({
  onboardingState,
  onToggleItem,
  onNavigate,
  onDismiss,
  onReplayTour,
  user
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [blinkingItemId, setBlinkingItemId] = useState(null);

  // Extract completed items from onboardingState
  const completedItems = onboardingState?.completed_checklist_items || [];

  // Filter checklist items by user role (hide adminOnly items from non-admins)
  const isAdmin = user?.role === 'ADMIN' || user?.is_superuser;
  const applicableItems = ONBOARDING_CHECKLIST_ITEMS.filter(item => !item.adminOnly || isAdmin);

  const completedCount = applicableItems.filter(item => completedItems.includes(item.id)).length;
  const progressPercent = applicableItems.length > 0 
    ? Math.round((completedCount / applicableItems.length) * 100) 
    : 0;

  if (applicableItems.length === 0) return null;

  const handleItemClick = (item) => {
    // Visual click feedback: blink/pulse background
    setBlinkingItemId(item.id);
    setTimeout(() => {
      setBlinkingItemId(null);
    }, 450);

    // Toggle/mark completed if not already completed
    if (onToggleItem) {
      onToggleItem(item.id);
    }

    // Seamlessly navigate to target page/tab if defined
    if (item.targetTab && onNavigate) {
      onNavigate(item.targetTab);
    }
  };

  return (
    <div className="onboarding-checklist-card">
      {/* Header */}
      <div className="onboarding-checklist-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="onboarding-checklist-icon-box">
            <Award size={18} color="var(--accent-blue)" />
          </div>
          <div>
            <div className="onboarding-checklist-title">
              Getting Started Checklist
            </div>
            <div className="onboarding-checklist-subtitle">
              {completedCount} of {applicableItems.length} essential tasks completed ({progressPercent}%)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            type="button"
            className="icon-btn-round"
            style={{ width: '28px', height: '28px' }}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand Checklist" : "Collapse Checklist"}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button 
            type="button"
            className="icon-btn-round"
            style={{ width: '28px', height: '28px' }}
            onClick={onDismiss}
            title="Dismiss Checklist"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="onboarding-progress-bar" style={{ height: '5px', margin: '0 0 14px' }}>
        <div 
          className="onboarding-progress-fill" 
          style={{ 
            width: `${progressPercent}%`, 
            backgroundColor: progressPercent === 100 ? '#059669' : 'var(--accent-blue)',
            transition: 'width 0.35s ease'
          }} 
        />
      </div>

      {/* Checklist items list */}
      {!collapsed && (
        <div className="onboarding-checklist-items">
          {applicableItems.map((item) => {
            const isCompleted = completedItems.includes(item.id);
            const isBlinking = blinkingItemId === item.id;

            return (
              <div 
                key={item.id}
                className={`onboarding-checklist-row ${isCompleted ? 'completed' : ''} ${isBlinking ? 'checklist-item-blink' : ''}`}
                onClick={() => handleItemClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item);
                  }
                }}
                title={isCompleted ? "Completed - click to visit section" : "Click to complete and navigate"}
              >
                <div className="checklist-status-icon">
                  {isCompleted ? (
                    <CheckCircle2 size={19} color="#059669" />
                  ) : (
                    <Circle size={19} color="var(--border-hover)" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div className={`checklist-item-title ${isCompleted ? 'done' : ''}`}>
                    {item.title}
                  </div>
                  <div className="checklist-item-desc">
                    {item.description}
                  </div>
                </div>

                <div className="checklist-arrow-icon">
                  <ArrowRight size={15} />
                </div>
              </div>
            );
          })}

          {/* Quick Tour Replay Action Footer */}
          <div className="onboarding-checklist-footer">
            <button 
              type="button"
              className="btn-pill btn-pill-soft"
              style={{ width: '100%', fontSize: '0.8rem', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={onReplayTour}
            >
              <Compass size={14} /> Replay Interactive Tour
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

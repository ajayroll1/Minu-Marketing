import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, ChevronDown, ChevronUp, X, 
  ArrowRight, Compass, Sparkles, Award 
} from 'lucide-react';
import { ONBOARDING_CHECKLIST_ITEMS } from '../../config/tourConfig';

export default function OnboardingChecklist({
  completedItems = [],
  onItemClick,
  onDismiss,
  onReplayTour,
  user
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Filter checklist items by user role (hide adminOnly items from non-admins)
  const isAdmin = user?.role === 'ADMIN' || user?.is_superuser;
  const applicableItems = ONBOARDING_CHECKLIST_ITEMS.filter(item => !item.adminOnly || isAdmin);

  const completedCount = applicableItems.filter(item => completedItems.includes(item.id)).length;
  const progressPercent = Math.round((completedCount / applicableItems.length) * 100);

  if (applicableItems.length === 0) return null;

  return (
    <div className="onboarding-checklist-card">
      {/* Header */}
      <div className="onboarding-checklist-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="onboarding-checklist-icon-box">
            <Award size={16} color="var(--accent-blue)" />
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
      <div className="onboarding-progress-bar" style={{ height: '4px', margin: '0 0 12px' }}>
        <div 
          className="onboarding-progress-fill" 
          style={{ width: `${progressPercent}%`, backgroundColor: progressPercent === 100 ? '#059669' : 'var(--accent-blue)' }} 
        />
      </div>

      {/* Checklist items list */}
      {!collapsed && (
        <div className="onboarding-checklist-items">
          {applicableItems.map((item) => {
            const isCompleted = completedItems.includes(item.id);
            return (
              <div 
                key={item.id}
                className={`onboarding-checklist-row ${isCompleted ? 'completed' : ''}`}
                onClick={() => onItemClick(item)}
              >
                <div className="checklist-status-icon">
                  {isCompleted ? (
                    <CheckCircle2 size={18} color="#059669" />
                  ) : (
                    <Circle size={18} color="var(--border-hover)" />
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
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}

          {/* Quick Tour Replay Action Footer */}
          <div className="onboarding-checklist-footer">
            <button 
              type="button"
              className="btn-pill btn-pill-soft"
              style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
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

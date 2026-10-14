import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Package, ArrowLeftRight, Bell, Shield, 
  LogOut, SlidersHorizontal, Camera, Calendar, CheckCircle2,
  X, Filter, ChevronDown, Check, Search, Users, Compass, HelpCircle
} from 'lucide-react';
import { api } from './services/api';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import AuditLogs from './pages/AuditLogs';
import Employees from './pages/Employees';
import Login from './pages/Login';
import WelcomeModal from './components/onboarding/WelcomeModal';
import TourSpotlightTooltip from './components/onboarding/TourSpotlightTooltip';
import TourCompletionModal from './components/onboarding/TourCompletionModal';
import { TOUR_CHAPTERS, TOUR_STEPS } from './config/tourConfig';
import './styles/ibanko.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [alertBadgeCount, setAlertBadgeCount] = useState(0);

  // Avatar Upload state
  const [avatarImage, setAvatarImage] = useState(null);
  const fileInputRef = useRef(null);

  // Expandable Topbar Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Notification Modal/Dropdown state
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    // Load persisted avatar if any
    const savedAvatar = localStorage.getItem('user_custom_avatar');
    if (savedAvatar) {
      setAvatarImage(savedAvatar);
    }
  }, []);

  // When search opens, focus the input automatically
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [searchOpen]);

  // Live quick search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await api.getProducts(`?search=${encodeURIComponent(searchQuery.trim())}`);
        const list = res?.results || (Array.isArray(res) ? res : []);
        setSearchResults(list.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);


  // Onboarding & Tour State
  const [onboardingState, setOnboardingState] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTourStepIdx, setCurrentTourStepIdx] = useState(0);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);

  const checkAuth = async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
      loadAlertCount();
      loadOnboarding(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  const loadOnboarding = async (user) => {
    try {
      const data = await api.getOnboardingStatus();
      setOnboardingState(data);
      // Trigger welcome modal on first login if not seen and not started
      if (!data.welcome_seen && data.tour_status === 'NOT_STARTED') {
        setWelcomeOpen(true);
      }
    } catch (err) {
      console.error("Failed to load onboarding status", err);
    }
  };

  // Filter tour steps based on user role
  const getFilteredTourSteps = () => {
    const role = currentUser?.role || 'OPERATOR';
    const isSuper = currentUser?.is_superuser;
    return TOUR_STEPS.filter(step => {
      if (step.roleRequirement === 'ALL') return true;
      if (step.roleRequirement === 'ADMIN') return role === 'ADMIN' || isSuper;
      if (step.roleRequirement === 'MANAGER') return role === 'ADMIN' || role === 'MANAGER' || isSuper;
      if (step.roleRequirement === 'OPERATOR') return role !== 'VIEWER';
      return true;
    });
  };

  const activeTourSteps = currentUser ? getFilteredTourSteps() : [];

  // Automatically sync tab with current step's tab
  const goToTourStep = (targetIdx) => {
    if (targetIdx < 0 || targetIdx >= activeTourSteps.length) return;
    const nextStep = activeTourSteps[targetIdx];
    setCurrentTourStepIdx(targetIdx);
    if (nextStep.tab && activeTab !== nextStep.tab) {
      setActiveTab(nextStep.tab);
    }
    // Save progress to backend
    api.saveTourProgress(nextStep.chapter, targetIdx).catch(console.error);
  };

  const handleStartTour = async () => {
    setWelcomeOpen(false);
    try {
      const updated = await api.startTour();
      setOnboardingState(updated);
      setIsTourActive(true);
      setCurrentTourStepIdx(0);
      const firstStep = activeTourSteps[0];
      if (firstStep?.tab) {
        setActiveTab(firstStep.tab);
      }
    } catch (err) {
      console.error(err);
      setIsTourActive(true);
      setCurrentTourStepIdx(0);
    }
  };

  const handleSkipTour = async () => {
    setWelcomeOpen(false);
    setIsTourActive(false);
    try {
      const updated = await api.skipTour();
      setOnboardingState(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinishTour = async () => {
    setIsTourActive(false);
    setCompletionOpen(true);
    try {
      const updated = await api.finishTour();
      setOnboardingState(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestartTour = async () => {
    setCompletionOpen(false);
    try {
      const updated = await api.restartTour();
      setOnboardingState(updated);
      setIsTourActive(true);
      setCurrentTourStepIdx(0);
      const firstStep = activeTourSteps[0];
      if (firstStep?.tab) {
        setActiveTab(firstStep.tab);
      }
    } catch (err) {
      console.error(err);
      setIsTourActive(true);
      setCurrentTourStepIdx(0);
    }
  };

  const handleNextTourStep = () => {
    if (currentTourStepIdx < activeTourSteps.length - 1) {
      goToTourStep(currentTourStepIdx + 1);
    } else {
      handleFinishTour();
    }
  };

  const handlePrevTourStep = () => {
    if (currentTourStepIdx > 0) {
      goToTourStep(currentTourStepIdx - 1);
    }
  };

  const handleToggleChecklistItem = async (itemId) => {
    try {
      const updated = await api.completeChecklistItem(itemId);
      setOnboardingState(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissChecklist = async () => {
    try {
      const updated = await api.dismissChecklist();
      setOnboardingState(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAlertCount = async () => {
    try {
      const res = await api.getAlerts();
      const list = res?.results || (Array.isArray(res) ? res : []);
      const active = list.filter(a => a.status === 'ACTIVE');
      setAlertBadgeCount(active.length);
      setRecentAlerts(active.slice(0, 6));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifModal(prev => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      setAlertBadgeCount(0);
      setRecentAlerts([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationItemClick = async (alertItem) => {
    try {
      if (alertItem.status === 'ACTIVE') {
        await api.acknowledgeAlert(alertItem.id);
        setAlertBadgeCount(prev => Math.max(0, prev - 1));
        setRecentAlerts(prev => prev.filter(item => item.id !== alertItem.id));
      }
    } catch (err) {
      console.error(err);
    }
    setShowNotifModal(false);
    setActiveTab('alerts');
  };


  // Fluid Sign Out animation state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogin = async (username, password) => {
    const res = await api.login(username, password);
    if (res.token) {
      localStorage.setItem('auth_token', res.token);
    }
    setCurrentUser(res.user);
    setActiveTab('dashboard');
    loadAlertCount();
    loadOnboarding(res.user);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    // Allow the fluid liquid animation to sweep from left to right smoothly
    setTimeout(async () => {
      try {
        await api.logout();
      } catch (e) {
        console.error(e);
      } finally {
        localStorage.removeItem('auth_token');
        setCurrentUser(null);
        setOnboardingState(null);
        setIsTourActive(false);
        setIsLoggingOut(false);
      }
    }, 620);
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImage(reader.result);
        localStorage.setItem('user_custom_avatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Format current date: e.g. "Tuesday, 14 Oct 2026"
  const formattedTodayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  if (loadingAuth) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Initializing Enterprise Session...
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="ibanko-shell">
      {/* Mobile Drawer Backdrop */}
      <div 
        className={`sidebar-backdrop ${mobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <div className="ibanko-frame">
        {/* Fixed Non-Fluctuating Sidebar */}
        <aside className={`ibanko-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="brand-icon-box">
                <Package size={18} />
              </div>
              <span className="brand-text">Minu Marketing</span>
            </div>

            {/* Mobile-only Close Drawer Button */}
            <button 
              className="sidebar-close-btn"
              onClick={() => setMobileSidebarOpen(false)}
              title="Close Menu"
              aria-label="Close Menu"
            >
              <X size={18} />
            </button>
          </div>


          {/* User Profile Card with Photo Upload Capability */}
          <div className="user-avatar-card">
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleAvatarFileChange}
            />
            <div 
              className="avatar-circle-wrapper"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload profile photo"
            >
              {avatarImage ? (
                <img 
                  src={avatarImage} 
                  alt="Profile" 
                  className="avatar-circle" 
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="avatar-circle">
                  {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="avatar-camera-badge">
                <Camera size={11} />
              </div>
            </div>
            <div className="user-avatar-name">{currentUser.first_name || currentUser.username}</div>
            <div className="user-avatar-role">Role: {currentUser.role || 'Admin'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', marginTop: '2px', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              Change Avatar
            </div>
          </div>

          <div className="sidebar-section-title">Overview</div>
          <nav className="sidebar-menu">
            <div 
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </div>

            <div 
              className={`sidebar-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => { setActiveTab('products'); setMobileSidebarOpen(false); }}
            >
              <Package size={18} />
              <span>Products Catalog</span>
            </div>

            <div 
              className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => { setActiveTab('transactions'); setMobileSidebarOpen(false); }}
            >
              <ArrowLeftRight size={18} />
              <span>Stock Ledger</span>
            </div>

            <div 
              className={`sidebar-item ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => { setActiveTab('alerts'); setMobileSidebarOpen(false); }}
            >
              <Bell size={18} />
              <span>Alert Settings</span>
              {alertBadgeCount > 0 && (
                <span className="alert-count">{alertBadgeCount}</span>
              )}
            </div>

            {(currentUser.role === 'ADMIN' || currentUser.is_superuser) && (
              <>
                <div 
                  className={`sidebar-item ${activeTab === 'employees' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('employees'); setMobileSidebarOpen(false); }}
                >
                  <Users size={18} />
                  <span>Employees</span>
                </div>

                <div 
                  className={`sidebar-item ${activeTab === 'audit' ? 'active' : ''}`}
                  data-tour="nav-audit-logs"
                  onClick={() => { setActiveTab('audit'); setMobileSidebarOpen(false); }}
                >
                  <Shield size={18} />
                  <span>Audit Logs</span>
                </div>
              </>
            )}
          </nav>

          {/* Fixed Sign Out Button At Absolute Bottom */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)', flexShrink: 0 }}>
            <div 
              className={`sidebar-item signout-fluid-btn ${isLoggingOut ? 'logging-out' : ''}`} 
              onClick={handleLogout}
              title="Sign Out from System"
            >
              <div className="signout-content">
                <LogOut size={18} />
                <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="ibanko-main">
          <header className="ibanko-topbar">
            <div className="topbar-left-cluster">
              {/* Mobile Hamburger Drawer Toggle */}
              <button 
                className="mobile-nav-toggle"
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                title="Open Navigation Menu"
                aria-label="Open Navigation Menu"
              >
                <Package size={18} />
              </button>

              <div className="topbar-title-block">
                <div className="topbar-greeting">
                  Hello, {currentUser.first_name || currentUser.username} <span className="waving-hand">👋</span>
                </div>
                <div className="topbar-subtitle">
                  <span className="topbar-date-pill">
                    <Calendar size={12} color="var(--accent-blue)" />
                    <span>{formattedTodayDate}</span>
                  </span>
                  <span className="topbar-divider">&bull;</span>
                  <span className="topbar-subtitle-text">Enterprise Supply Chain Management</span>
                </div>
              </div>
            </div>


            <div className="topbar-right-controls">
              {/* Product Tour Trigger Button */}
              <button 
                className="btn-pill btn-pill-soft"
                onClick={handleRestartTour}
                title="Take Interactive Product Tour"
                style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Compass size={15} color="var(--accent-blue)" />
                <span>Product Tour</span>
              </button>

              {/* Smooth Expandable Search Bar (Right to Left Transition) */}
              <div className={`topbar-search-wrapper ${searchOpen ? 'open' : ''}`} data-tour="topbar-search">
                <div 
                  className="icon-btn-round search-trigger-btn" 
                  title={searchOpen ? "Close Search" : "Search Catalog & Items"}
                  onClick={() => setSearchOpen(!searchOpen)}
                >
                  {searchOpen ? <X size={17} /> : <Search size={18} />}
                </div>

                <div className="topbar-search-bar-inner">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="topbar-search-input-field"
                    placeholder="Search products, SKUs, inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setSearchOpen(false);
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        setActiveTab('products');
                        setSearchOpen(false);
                      }
                    }}
                  />
                  {searchQuery && (
                    <button 
                      className="topbar-search-clear" 
                      onClick={() => setSearchQuery('')}
                      title="Clear"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Instant Search Results Dropdown */}
                {searchOpen && searchQuery.trim() && (
                  <div className="topbar-search-results-dropdown">
                    <div className="search-results-header">
                      <span>Quick Search Results</span>
                      {searchLoading && <span style={{ fontSize: '0.72rem', color: 'var(--accent-blue)' }}>Searching...</span>}
                    </div>

                    {searchResults.length === 0 && !searchLoading ? (
                      <div className="search-results-empty">
                        No products match "{searchQuery}"
                      </div>
                    ) : (
                      searchResults.map((prod) => (
                        <div 
                          key={prod.id} 
                          className="search-result-row"
                          onClick={() => {
                            setActiveTab('products');
                            setSearchOpen(false);
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div className="search-result-name">{prod.name}</div>
                            <div className="search-result-sku font-mono">{prod.sku} &bull; {prod.category || 'General'}</div>
                          </div>
                          <div className="search-result-stock font-mono">
                            {prod.current_stock} <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>units</span>
                          </div>
                        </div>
                      ))
                    )}

                    <div 
                      className="search-results-footer"
                      onClick={() => {
                        setActiveTab('products');
                        setSearchOpen(false);
                      }}
                    >
                      View all in Products Catalog &rarr;
                    </div>
                  </div>
                )}
              </div>

              {/* Working Notifications Bell with Modal/Dropdown */}
              <div style={{ position: 'relative' }}>
                <div 
                  className="icon-btn-round" 
                  title="Notifications Feed"
                  onClick={handleOpenNotifications}
                  style={{ position: 'relative', backgroundColor: showNotifModal ? '#E2E8F0' : '#FFFFFF' }}
                >
                  <Bell size={18} />
                  {alertBadgeCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#EF4444',
                      borderRadius: '50%',
                      border: '2px solid #FFFFFF'
                    }} />
                  )}
                </div>

                {showNotifModal && (
                  <div style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    width: '320px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.14)',
                    border: '1px solid var(--border-light)',
                    zIndex: 100
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.94rem' }}>Stock Notifications ({alertBadgeCount})</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {alertBadgeCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', padding: '2px 6px' }}
                            title="Mark all notifications as read"
                          >
                            Mark all as read
                          </button>
                        )}
                        <button 
                          onClick={() => setShowNotifModal(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                      {recentAlerts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                          <CheckCircle2 size={24} color="#10B981" style={{ margin: '0 auto 6px', display: 'block' }} />
                          All notifications read. Zero breaches.
                        </div>
                      ) : (
                        recentAlerts.map(a => (
                          <div 
                            key={a.id}
                            onClick={() => handleNotificationItemClick(a)}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: a.severity === 'OUT_OF_STOCK' ? '#FEE2E2' : '#FEF3C7',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              border: a.severity === 'OUT_OF_STOCK' ? '1px solid #FECACA' : '1px solid #FDE68A',
                              transition: 'transform 0.15s ease'
                            }}
                            title="Click to view and acknowledge alert"
                          >
                            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: a.severity === 'OUT_OF_STOCK' ? '#991B1B' : '#92400E' }}>
                              {a.severity === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Low Stock Warning'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#1F2937', marginTop: '2px' }}>
                              {a.product_name} &bull; {a.current_stock} units left
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {alertBadgeCount > 0 && (
                        <button 
                          className="btn-pill btn-pill-soft"
                          style={{ flex: 1, fontSize: '0.78rem', padding: '8px' }}
                          onClick={handleMarkAllRead}
                        >
                          Mark as Read
                        </button>
                      )}
                      <button 
                        className="btn-pill btn-pill-dark"
                        style={{ flex: 1, fontSize: '0.78rem', padding: '8px' }}
                        onClick={() => { setShowNotifModal(false); setActiveTab('alerts'); }}
                      >
                        Alert Settings &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <section key={activeTab} className="view-content-body">
            {activeTab === 'dashboard' && (
              <Dashboard 
                onNavigate={(tab) => setActiveTab(tab)}
                onboardingState={onboardingState}
                onToggleChecklistItem={handleToggleChecklistItem}
                onDismissChecklist={handleDismissChecklist}
                onReplayTour={handleRestartTour}
              />
            )}
            {activeTab === 'products' && <Products user={currentUser} />}
            {activeTab === 'transactions' && <Transactions user={currentUser} />}
            {activeTab === 'alerts' && <Alerts user={currentUser} />}
            {activeTab === 'employees' && <Employees user={currentUser} />}
            {activeTab === 'audit' && <AuditLogs />}
          </section>
        </main>
      </div>

      {/* Onboarding Modals & Spotlight Tooltip */}
      {welcomeOpen && (
        <WelcomeModal 
          user={currentUser} 
          onStartTour={handleStartTour} 
          onSkipTour={handleSkipTour} 
        />
      )}

      {isTourActive && activeTourSteps[currentTourStepIdx] && (
        <TourSpotlightTooltip 
          step={activeTourSteps[currentTourStepIdx]}
          stepIndex={currentTourStepIdx}
          totalSteps={activeTourSteps.length}
          chapterInfo={TOUR_CHAPTERS.find(c => c.id === activeTourSteps[currentTourStepIdx].chapter)}
          onNext={handleNextTourStep}
          onPrev={handlePrevTourStep}
          onSkip={handleSkipTour}
          onFinish={handleFinishTour}
        />
      )}

      {completionOpen && (
        <TourCompletionModal 
          user={currentUser}
          completedStepsCount={activeTourSteps.length}
          totalStepsCount={activeTourSteps.length}
          onFinish={() => setCompletionOpen(false)}
          onRestart={handleRestartTour}
          onOpenChecklist={() => {
            setCompletionOpen(false);
            setActiveTab('dashboard');
          }}
        />
      )}
    </div>
  );
}

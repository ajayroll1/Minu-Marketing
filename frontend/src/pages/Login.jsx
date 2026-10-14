import React, { useState } from 'react';
import { 
  Package, Lock, User, AlertCircle, ArrowRight, 
  ShieldCheck, Check, Sparkles, TrendingUp, Layers, 
  CheckCircle2, KeyRound, UserPlus, Mail, ArrowLeft, Send
} from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  // Mode: 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD'
  const [mode, setMode] = useState('LOGIN');

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin12345!');
  const [activeRole, setActiveRole] = useState('ADMIN');

  // Forgot password form state
  const [resetData, setResetData] = useState({
    email: '',
    otp: '',
    new_password: ''
  });

  // OTP dispatch status
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState(null);

  // Common UI states
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetAllMessages = () => {
    setError(null);
    setSuccess(null);
    setOtpSuccessMsg(null);
    setOtpSent(false);
  };

  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    resetAllMessages();
  };

  // 1. Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLoginSuccess(username, password);
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Dispatch OTP (For Password Reset)
  const handleRequestOTP = async (targetEmail, purpose = 'RESET') => {
    if (!targetEmail) {
      setError('Please enter a valid email address to receive the verification OTP.');
      return;
    }
    setError(null);
    setSendingOtp(true);
    try {
      const res = await api.sendOTP(targetEmail, purpose);
      setOtpSent(true);
      setOtpSuccessMsg(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  // 4. Submit Forgot Password Reset with OTP
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.resetPassword(resetData);
      setSuccess(res.message);
      setTimeout(() => {
        setMode('LOGIN');
        setUsername(resetData.email);
        setPassword(resetData.new_password);
        resetAllMessages();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user, pass, role) => {
    setUsername(user);
    setPassword(pass);
    setActiveRole(role);
  };

  return (
    <div className="ibanko-shell login-shell">
      <div className="ibanko-frame login-frame">
        {/* Left Hero Card - Minu Marketing Dark Theme */}
        <div className="login-hero-card">
          <div>
            {/* Brand Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                backgroundColor: '#FFFFFF',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#11141C'
              }}>
                <Package size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.3px', color: '#FFFFFF' }}>Minu Marketing</div>
                <div style={{ fontSize: '0.74rem', color: '#8E9BAE', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Enterprise Suite</div>
              </div>
            </div>

            {/* Value Proposition */}
            <h2 style={{ fontSize: '1.95rem', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.6px', marginBottom: '16px', color: '#FFFFFF' }}>
              Real-Time Stock Telemetry & Automated Replenishment
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '32px', maxWidth: '380px' }}>
              Track inventory valuations in Indian Rupees (₹), control custom alert triggers, and dispatch automated requisition reports.
            </p>

            {/* Feature Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#DEF7EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#03543F' }}>
                  <TrendingUp size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#FFFFFF' }}>₹1,43,899.00 Live Valuation</div>
                  <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Cost-basis ledger synchronization</div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991B1B' }}>
                  <AlertCircle size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#FFFFFF' }}>Automated SMTP Alerts & OTP</div>
                  <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Gmail SMTP verified security token delivery</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#34D399" />
            <span>Role-Based Enterprise Access Control (RBAC) &bull; Django 5.1</span>
          </div>
        </div>

        {/* Right Form Container - Dynamic Login / Signup / Forgot Password */}
        <div className="login-form-card">
          {/* Mobile-only Minu Marketing Brand Header */}
          <div className="login-mobile-brand-header">
            <div style={{
              width: '36px',
              height: '36px',
              backgroundColor: '#11141C',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.3px', color: '#11141C' }}>
                Minu Marketing
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
                Enterprise Suite
              </div>
            </div>
          </div>
          {/* Status Banners */}
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              fontSize: '0.86rem',
              borderRadius: '12px',
              border: '1px solid #FECACA',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#DEF7EC',
              color: '#03543F',
              fontSize: '0.86rem',
              borderRadius: '12px',
              border: '1px solid #BCF0DA',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          {otpSuccessMsg && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#EEF2FF',
              color: '#3730A3',
              fontSize: '0.82rem',
              borderRadius: '10px',
              border: '1px solid #C7D2FE',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Mail size={15} /> {otpSuccessMsg}
            </div>
          )}

          {/* ========================================================
              VIEW 1: SIGN IN MODE
             ======================================================== */}
          {mode === 'LOGIN' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="badge-pill badge-mint" style={{ marginBottom: '10px' }}>
                  Secure Session Gateway
                </span>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
                  Welcome back <span className="waving-hand">👋</span>
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Sign in to manage inventory, catalog SKUs, and stock movements.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    Username or Email
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    placeholder="Enter your username"
                    style={{ borderRadius: '12px', padding: '11px 16px', fontSize: '0.9rem' }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={() => handleSwitchMode('FORGOT_PASSWORD')}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input 
                    type="password" 
                    className="form-control" 
                    required
                    placeholder="Enter your password"
                    style={{ borderRadius: '12px', padding: '11px 16px', fontSize: '0.9rem', marginTop: '6px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-pill btn-pill-dark" 
                  style={{ width: '100%', padding: '13px', fontSize: '0.92rem', borderRadius: '12px', marginTop: '14px' }}
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : (
                    <>Sign In to Workspace <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              {/* Quick Demo Role Selector Pills */}
              <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '8px' }}>
                  Quick Demo Role Selector:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[
                    { label: 'Admin', user: 'admin', pass: 'Admin12345!', role: 'ADMIN' },
                    { label: 'Manager', user: 'manager', pass: 'Manager12345!', role: 'MANAGER' },
                    { label: 'Operator', user: 'operator', pass: 'Operator12345!', role: 'OPERATOR' },
                    { label: 'Viewer', user: 'viewer', pass: 'Viewer12345!', role: 'VIEWER' },
                  ].map((r, i) => (
                    <button 
                      key={i}
                      type="button" 
                      className={`btn-pill ${activeRole === r.role ? 'btn-pill-dark' : 'btn-pill-soft'}`}
                      style={{ padding: '7px 8px', fontSize: '0.74rem', borderRadius: '9999px' }}
                      onClick={() => handleQuickFill(r.user, r.pass, r.role)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 2: FORGOT PASSWORD (RESET VIA EMAIL OTP)
             ======================================================== */}
          {mode === 'FORGOT_PASSWORD' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => handleSwitchMode('LOGIN')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
                <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Reset Password
                </h1>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Verify your registered email with OTP to set a new password.
                </p>
              </div>

              <form onSubmit={handleResetSubmit}>
                <div style={{ padding: '10px 14px', backgroundColor: '#EFF6FF', color: '#1E40AF', borderRadius: '10px', border: '1px solid #BFDBFE', fontSize: '0.82rem', marginBottom: '16px' }}>
                  Agar aapka account registered hai, toh Send OTP par click karne par aapke inbox/spam folder mein verification code bhej diya jayega.
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Registered Email</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="email" 
                      className="form-control" 
                      required
                      placeholder="Enter account email"
                      style={{ borderRadius: '10px', padding: '10px 14px', fontSize: '0.9rem' }}
                      value={resetData.email}
                      onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                    />
                    <button 
                      type="button" 
                      className="btn-pill btn-pill-dark" 
                      style={{ padding: '8px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap', borderRadius: '10px' }}
                      onClick={() => handleRequestOTP(resetData.email, 'RESET')}
                      disabled={sendingOtp}
                    >
                      {sendingOtp ? 'Sending...' : (otpSent ? 'Resend' : 'Send OTP')}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>6-Digit OTP Code</label>
                  <input 
                    type="text" 
                    className="form-control font-mono" 
                    required
                    maxLength="6"
                    placeholder="Enter 6-digit code"
                    style={{ borderRadius: '10px', padding: '10px 14px', fontSize: '1rem', letterSpacing: '4px', textAlign: 'center' }}
                    value={resetData.otp}
                    onChange={(e) => setResetData({ ...resetData, otp: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '22px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    required
                    placeholder="Enter new password"
                    style={{ borderRadius: '10px', padding: '10px 14px', fontSize: '0.9rem' }}
                    value={resetData.new_password}
                    onChange={(e) => setResetData({ ...resetData, new_password: e.target.value })}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-pill btn-pill-dark" 
                  style={{ width: '100%', padding: '12px', fontSize: '0.9rem', borderRadius: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Verify OTP & Reset Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

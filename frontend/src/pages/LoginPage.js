// src/pages/LoginPage.js — Premium Login (no demo credentials)
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const TENANT_OPTIONS = [
  { value: 'HOSP_A', label: 'City Central Hospital',   icon: '🏥', plan: 'Enterprise' },
  { value: 'HOSP_B', label: 'Community Healthcare',    icon: '🏨', plan: 'Premium'    },
  { value: 'HOSP_C', label: 'Memorial Medical Center', icon: '🏛️', plan: 'Basic'      },
];

const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm]     = useState({ username: '', password: '', tenantId: 'HOSP_A' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);
  useEffect(() => { if (isAuthenticated) navigate('/dashboard', { replace: true }); }, [isAuthenticated, navigate]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(p => ({ ...p, [e.target.name]: '' }));
    if (serverError) setServerError('');
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.password)        e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(form.username, form.password, form.tenantId);
      if (result.success) navigate('/dashboard');
      else setServerError(result.message || 'Invalid credentials. Please try again.');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`reg-root ${mounted ? 'mounted' : ''}`}>
      {/* Animated Background */}
      <div className="reg-bg">
        <div className="reg-orb reg-orb-1" />
        <div className="reg-orb reg-orb-2" />
        <div className="reg-orb reg-orb-3" />
        <div className="reg-grid" />
      </div>

      <div className="reg-layout">

        {/* ── Left Panel ── */}
        <div className="reg-left">
          <div className="reg-left-inner">

            <div className="reg-brand">
              <div className="reg-brand-icon">M</div>
              <div>
                <div className="reg-brand-name">MedNex</div>
                <div className="reg-brand-sub">Enterprise HMS</div>
              </div>
            </div>

            <div className="reg-hero">
              <h1>Welcome<br />Back to<br /><span className="reg-highlight">MedNex</span></h1>
              <p>Your secure multi-tenant hospital management platform. Sign in to continue managing patient care.</p>
            </div>

            <div className="login-feature-list">
              {[
                { icon: '🏥', title: 'Multi-Tenant System',        sub: 'Isolated per hospital' },
                { icon: '📋', title: 'Electronic Medical Records',  sub: '50+ field EMR forms' },
                { icon: '📅', title: 'Smart Scheduling',           sub: 'Conflict detection' },
                { icon: '📊', title: 'Real-Time Analytics',        sub: 'Bed occupancy & trends' },
                { icon: '🔒', title: 'HIPAA / GDPR Compliant',     sub: 'Full audit trail' },
              ].map(f => (
                <div key={f.title} className="login-feature-item">
                  <div className="lfi-icon">{f.icon}</div>
                  <div>
                    <div className="lfi-title">{f.title}</div>
                    <div className="lfi-sub">{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="login-week-tags">
              {['Week 1: Architecture', 'Week 2: EMR', 'Week 3: Scheduling', 'Week 4: Analytics'].map(w => (
                <span key={w} className="login-week-tag">{w}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="reg-right">
          <div className="reg-form-box login-form-box">

            <div className="reg-form-header">
              <h2>🔐 Sign In</h2>
              <p>Access your hospital management portal</p>
            </div>

            {serverError && (
              <div className="reg-error-alert">
                <span>⚠️</span> {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Tenant Selector */}
              <div className="reg-field-group">
                <label className="reg-label">Select Hospital</label>
                <div className="login-tenant-cards">
                  {TENANT_OPTIONS.map(t => (
                    <div
                      key={t.value}
                      className={`login-tenant-card ${form.tenantId === t.value ? 'selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, tenantId: t.value }))}
                    >
                      <span className="ltc-icon">{t.icon}</span>
                      <div className="ltc-info">
                        <div className="ltc-name">{t.label}</div>
                        <div className="ltc-plan">{t.plan}</div>
                      </div>
                      {form.tenantId === t.value && <span className="ltc-check">✓</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Username */}
              <div className="reg-field-group">
                <label className="reg-label">Username <span className="req">*</span></label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon">@</span>
                  <input
                    className={`reg-input has-icon ${errors.username ? 'input-err' : ''}`}
                    name="username" type="text"
                    placeholder="Enter your username"
                    value={form.username} onChange={handleChange}
                    autoComplete="username" autoFocus
                  />
                </div>
                {errors.username && <div className="reg-field-error">⚠ {errors.username}</div>}
              </div>

              {/* Password */}
              <div className="reg-field-group">
                <label className="reg-label">Password <span className="req">*</span></label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon">🔒</span>
                  <input
                    className={`reg-input has-icon has-toggle ${errors.password ? 'input-err' : ''}`}
                    name="password" type={showPwd ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password} onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button type="button" className="reg-eye-btn" onClick={() => setShowPwd(v => !v)}>
                    <EyeIcon open={showPwd} />
                  </button>
                </div>
                {errors.password && <div className="reg-field-error">⚠ {errors.password}</div>}
              </div>

              <button
                type="submit"
                className="reg-btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                disabled={loading}
              >
                {loading ? (
                  <><div className="reg-spinner" /> Signing in…</>
                ) : (
                  <>Sign In to MedNex →</>
                )}
              </button>
            </form>

            <div className="login-divider" />

            <div className="reg-signin-link">
              Don't have an account? <Link to="/register">Create one here →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

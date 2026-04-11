// src/pages/RegisterPage.js — Premium 3-Step Registration Wizard
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const TENANT_OPTIONS = [
  { value: 'HOSP_A', label: 'City Central Hospital',   icon: '🏥', plan: 'Enterprise', beds: 500 },
  { value: 'HOSP_B', label: 'Community Healthcare',    icon: '🏨', plan: 'Premium',    beds: 200 },
  { value: 'HOSP_C', label: 'Memorial Medical Center', icon: '🏛️', plan: 'Basic',      beds: 100 },
];

const ROLE_OPTIONS = [
  { value: 'DOCTOR',       label: 'Doctor',         icon: '👨‍⚕️', desc: 'View & manage patient records' },
  { value: 'NURSE',        label: 'Nurse',          icon: '👩‍⚕️', desc: 'Patient care & vitals tracking' },
  { value: 'RECEPTIONIST', label: 'Receptionist',   icon: '💁',  desc: 'Appointments & front desk' },
  { value: 'PHARMACIST',   label: 'Pharmacist',     icon: '💊',  desc: 'Prescriptions & medication' },
  { value: 'LAB_TECH',     label: 'Lab Technician', icon: '🔬',  desc: 'Lab tests & diagnostics' },
  { value: 'ACCOUNTANT',   label: 'Accountant',     icon: '📊',  desc: 'Billing & finance' },
];

const DEPARTMENTS = [
  'Administration','Cardiology','Pediatrics','Orthopedics','Neurology',
  'Oncology','Radiology','Pharmacy','Laboratory','Emergency','ICU','Surgery','OPD',
];

const STEPS = [
  { label: 'Organization', icon: '🏥', desc: 'Choose hospital & role' },
  { label: 'Personal Info', icon: '👤', desc: 'Your details' },
  { label: 'Account Setup', icon: '🔐', desc: 'Credentials' },
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep]       = useState(1);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors]   = useState({});
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const [form, setForm] = useState({
    tenantId: '', roleName: '',
    firstName: '', lastName: '', email: '', phone: '',
    department: '', designation: '',
    username: '', password: '', confirmPassword: '',
  });

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
    if (serverError) setServerError('');
  };

  const handleChange = e => set(e.target.name, e.target.value);

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.tenantId) e.tenantId = 'Please select a hospital';
      if (!form.roleName) e.roleName = 'Please select your role';
    }
    if (s === 2) {
      if (!form.firstName.trim()) e.firstName = 'First name is required';
      if (!form.lastName.trim())  e.lastName  = 'Last name is required';
      if (!form.email.trim())     e.email     = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
      if (form.phone && !/^[+\d\s\-()]{7,15}$/.test(form.phone)) e.phone = 'Invalid phone number';
    }
    if (s === 3) {
      if (!form.username.trim())  e.username = 'Username is required';
      else if (form.username.length < 3) e.username = 'Minimum 3 characters';
      else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Only letters, numbers, underscore';
      if (!form.password)          e.password = 'Password is required';
      else if (form.password.length < 8) e.password = 'Minimum 8 characters';
      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
        e.password = 'Must include uppercase, lowercase & number';
      if (!form.confirmPassword)   e.confirmPassword = 'Please confirm your password';
      else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) setStep(s => s + 1); };
  const prev = () => { setStep(s => s - 1); setErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate(3)) return;
    setLoading(true);
    setServerError('');
    try {
      const result = await register(form);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 2200);
      } else {
        setServerError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const pwStrength = () => {
    const pw = form.password;
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)              s++;
    if (/[A-Z]/.test(pw))           s++;
    if (/[a-z]/.test(pw))           s++;
    if (/\d/.test(pw))              s++;
    if (/[^A-Za-z\d]/.test(pw))    s++;
    return s;
  };
  const strength = pwStrength();
  const strengthMeta = [
    null,
    { label: 'Weak',      color: '#f43f5e' },
    { label: 'Fair',      color: '#f97316' },
    { label: 'Good',      color: '#eab308' },
    { label: 'Strong',    color: '#22c55e' },
    { label: 'Very Strong', color: '#10b981' },
  ];

  // ── Success Screen ──────────────────────────────────────────
  if (success) return (
    <div className={`reg-root ${mounted ? 'mounted' : ''}`}>
      <div className="reg-bg">
        <div className="reg-orb reg-orb-1" /><div className="reg-orb reg-orb-2" /><div className="reg-orb reg-orb-3" />
        <div className="reg-grid" />
      </div>
      <div className="success-center">
        <div className="success-ring">
          <div className="success-checkmark">✓</div>
        </div>
        <h2 className="success-title">Account Created!</h2>
        <p className="success-sub">Welcome to MedNex. Redirecting to your dashboard…</p>
        <div className="success-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );

  // ── Main Register Page ──────────────────────────────────────
  return (
    <div className={`reg-root ${mounted ? 'mounted' : ''}`}>
      {/* Animated BG */}
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

            {/* Brand */}
            <div className="reg-brand">
              <div className="reg-brand-icon">M</div>
              <div>
                <div className="reg-brand-name">MedNex</div>
                <div className="reg-brand-sub">Enterprise HMS</div>
              </div>
            </div>

            {/* Hero */}
            <div className="reg-hero">
              <h1>Join the Future<br />of <span className="reg-highlight">Healthcare</span></h1>
              <p>Create your account and start managing patient care with confidence, compliance, and clarity.</p>
            </div>

            {/* Step Tracker */}
            <div className="reg-step-track">
              {STEPS.map((s, i) => {
                const n = i + 1;
                const isActive = n === step;
                const isDone   = n < step;
                return (
                  <div key={s.label} className={`rst-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                    <div className="rst-connector" />
                    <div className="rst-circle">
                      {isDone ? '✓' : <span>{s.icon}</span>}
                    </div>
                    <div className="rst-text">
                      <div className="rst-label">{s.label}</div>
                      <div className="rst-desc">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="reg-progress-wrap">
              <div className="reg-progress-label">
                <span>Step {step} of {STEPS.length}</span>
                <span>{Math.round((step / STEPS.length) * 100)}% complete</span>
              </div>
              <div className="reg-progress-bar">
                <div className="reg-progress-fill" style={{ width: `${(step / STEPS.length) * 100}%` }} />
              </div>
            </div>

            {/* Feature List */}
            <div className="reg-features">
              {['🔒 HIPAA & GDPR compliant', '🏥 Multi-tenant architecture', '📊 Real-time analytics', '📋 Electronic Medical Records'].map(f => (
                <div key={f} className="reg-feature">{f}</div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Panel (Form) ── */}
        <div className="reg-right">
          <div className="reg-form-box">

            {/* Mobile Step Indicator */}
            <div className="reg-mobile-steps">
              {STEPS.map((s, i) => (
                <div key={i} className={`rms-dot ${i + 1 <= step ? 'active' : ''}`} />
              ))}
            </div>

            <div className="reg-form-header">
              <div className="rfh-step-badge">Step {step} / {STEPS.length}</div>
              <h2>{STEPS[step - 1].icon} {STEPS[step - 1].label}</h2>
              <p>{STEPS[step - 1].desc}</p>
            </div>

            {serverError && (
              <div className="reg-error-alert">
                <span>⚠️</span> {serverError}
              </div>
            )}

            {/* ── STEP 1: Organization & Role ── */}
            {step === 1 && (
              <div className="reg-step-body">

                <div className="reg-field-group">
                  <label className="reg-label">Select Your Hospital</label>
                  <div className="hosp-cards">
                    {TENANT_OPTIONS.map(t => (
                      <div
                        key={t.value}
                        className={`hosp-card ${form.tenantId === t.value ? 'selected' : ''}`}
                        onClick={() => set('tenantId', t.value)}
                      >
                        <div className="hc-top">
                          <span className="hc-icon">{t.icon}</span>
                          {form.tenantId === t.value && <span className="hc-check">✓</span>}
                        </div>
                        <div className="hc-name">{t.label}</div>
                        <div className="hc-meta">
                          <span className="hc-plan">{t.plan}</span>
                          <span className="hc-beds">{t.beds} beds</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.tenantId && <div className="reg-field-error">⚠ {errors.tenantId}</div>}
                </div>

                <div className="reg-field-group">
                  <label className="reg-label">Your Role</label>
                  <div className="role-cards">
                    {ROLE_OPTIONS.map(r => (
                      <div
                        key={r.value}
                        className={`role-card ${form.roleName === r.value ? 'selected' : ''}`}
                        onClick={() => set('roleName', r.value)}
                      >
                        <span className="rc-icon">{r.icon}</span>
                        <div className="rc-info">
                          <div className="rc-name">{r.label}</div>
                          <div className="rc-desc">{r.desc}</div>
                        </div>
                        {form.roleName === r.value && <span className="rc-check">✓</span>}
                      </div>
                    ))}
                  </div>
                  {errors.roleName && <div className="reg-field-error">⚠ {errors.roleName}</div>}
                </div>

                <button className="reg-btn-primary" onClick={next}>
                  Continue <span>→</span>
                </button>
              </div>
            )}

            {/* ── STEP 2: Personal Info ── */}
            {step === 2 && (
              <div className="reg-step-body">

                <div className="reg-row-2">
                  <div className="reg-field-group">
                    <label className="reg-label">First Name <span className="req">*</span></label>
                    <input
                      className={`reg-input ${errors.firstName ? 'input-err' : ''}`}
                      name="firstName" type="text" placeholder="John"
                      value={form.firstName} onChange={handleChange} autoFocus
                    />
                    {errors.firstName && <div className="reg-field-error">⚠ {errors.firstName}</div>}
                  </div>
                  <div className="reg-field-group">
                    <label className="reg-label">Last Name <span className="req">*</span></label>
                    <input
                      className={`reg-input ${errors.lastName ? 'input-err' : ''}`}
                      name="lastName" type="text" placeholder="Doe"
                      value={form.lastName} onChange={handleChange}
                    />
                    {errors.lastName && <div className="reg-field-error">⚠ {errors.lastName}</div>}
                  </div>
                </div>

                <div className="reg-field-group">
                  <label className="reg-label">Email Address <span className="req">*</span></label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon">✉</span>
                    <input
                      className={`reg-input has-icon ${errors.email ? 'input-err' : ''}`}
                      name="email" type="email" placeholder="john.doe@hospital.com"
                      value={form.email} onChange={handleChange}
                    />
                  </div>
                  {errors.email && <div className="reg-field-error">⚠ {errors.email}</div>}
                </div>

                <div className="reg-field-group">
                  <label className="reg-label">Phone Number <span className="opt">(optional)</span></label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon">📞</span>
                    <input
                      className={`reg-input has-icon ${errors.phone ? 'input-err' : ''}`}
                      name="phone" type="tel" placeholder="+91 98765 43210"
                      value={form.phone} onChange={handleChange}
                    />
                  </div>
                  {errors.phone && <div className="reg-field-error">⚠ {errors.phone}</div>}
                </div>

                <div className="reg-row-2">
                  <div className="reg-field-group">
                    <label className="reg-label">Department <span className="opt">(optional)</span></label>
                    <select className="reg-input reg-select" name="department" value={form.department} onChange={handleChange}>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="reg-field-group">
                    <label className="reg-label">Designation <span className="opt">(optional)</span></label>
                    <input
                      className="reg-input"
                      name="designation" type="text" placeholder="e.g. Senior Nurse"
                      value={form.designation} onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="reg-btn-row">
                  <button className="reg-btn-back" onClick={prev}>← Back</button>
                  <button className="reg-btn-primary" onClick={next}>Continue →</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Account Setup ── */}
            {step === 3 && (
              <form onSubmit={handleSubmit} noValidate>
                <div className="reg-step-body">

                  {/* Summary Card */}
                  <div className="reg-summary-card">
                    <div className="rsc-avatar">
                      {form.firstName ? form.firstName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="rsc-info">
                      <div className="rsc-name">{form.firstName} {form.lastName}</div>
                      <div className="rsc-meta">
                        <span>{ROLE_OPTIONS.find(r => r.value === form.roleName)?.icon} {form.roleName}</span>
                        <span>·</span>
                        <span>{TENANT_OPTIONS.find(t => t.value === form.tenantId)?.label}</span>
                      </div>
                    </div>
                    <button type="button" className="rsc-edit" onClick={() => setStep(1)}>Edit</button>
                  </div>

                  <div className="reg-field-group">
                    <label className="reg-label">Username <span className="req">*</span></label>
                    <div className="reg-input-wrap">
                      <span className="reg-input-icon">@</span>
                      <input
                        className={`reg-input has-icon ${errors.username ? 'input-err' : ''}`}
                        name="username" type="text" placeholder="Choose a unique username"
                        value={form.username} onChange={handleChange} autoFocus
                        autoComplete="username"
                      />
                    </div>
                    {errors.username
                      ? <div className="reg-field-error">⚠ {errors.username}</div>
                      : <div className="reg-field-hint">Letters, numbers, underscore only</div>
                    }
                  </div>

                  <div className="reg-field-group">
                    <label className="reg-label">Password <span className="req">*</span></label>
                    <div className="reg-input-wrap">
                      <span className="reg-input-icon">🔒</span>
                      <input
                        className={`reg-input has-icon has-toggle ${errors.password ? 'input-err' : ''}`}
                        name="password" type={showPw ? 'text' : 'password'}
                        placeholder="Min. 8 chars with upper, lower & number"
                        value={form.password} onChange={handleChange}
                        autoComplete="new-password"
                      />
                      <button type="button" className="reg-eye-btn" onClick={() => setShowPw(v => !v)}>
                        <EyeIcon open={showPw} />
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {form.password && (
                      <div className="pw-strength-wrap">
                        <div className="pw-strength-bars">
                          {[1,2,3,4,5].map(i => (
                            <div
                              key={i}
                              className="pw-bar-seg"
                              style={{ background: i <= strength ? strengthMeta[strength]?.color : 'rgba(255,255,255,0.06)' }}
                            />
                          ))}
                        </div>
                        <span className="pw-strength-label" style={{ color: strengthMeta[strength]?.color }}>
                          {strengthMeta[strength]?.label}
                        </span>
                      </div>
                    )}

                    {errors.password && <div className="reg-field-error">⚠ {errors.password}</div>}

                    {/* Password Requirements */}
                    <div className="pw-requirements">
                      {[
                        { label: 'At least 8 characters',   pass: form.password.length >= 8 },
                        { label: 'Uppercase letter (A-Z)',   pass: /[A-Z]/.test(form.password) },
                        { label: 'Lowercase letter (a-z)',   pass: /[a-z]/.test(form.password) },
                        { label: 'Number (0-9)',             pass: /\d/.test(form.password) },
                      ].map(r => (
                        <div key={r.label} className={`pw-req ${r.pass ? 'pass' : ''}`}>
                          <span className="pw-req-dot">{r.pass ? '✓' : '○'}</span>
                          {r.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="reg-field-group">
                    <label className="reg-label">Confirm Password <span className="req">*</span></label>
                    <div className="reg-input-wrap">
                      <span className="reg-input-icon">🔑</span>
                      <input
                        className={`reg-input has-icon has-toggle ${errors.confirmPassword ? 'input-err' : ''}`}
                        name="confirmPassword" type={showCpw ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={form.confirmPassword} onChange={handleChange}
                        autoComplete="new-password"
                      />
                      <button type="button" className="reg-eye-btn" onClick={() => setShowCpw(v => !v)}>
                        <EyeIcon open={showCpw} />
                      </button>
                    </div>
                    {form.confirmPassword && form.password === form.confirmPassword && (
                      <div className="pw-match">✓ Passwords match</div>
                    )}
                    {errors.confirmPassword && <div className="reg-field-error">⚠ {errors.confirmPassword}</div>}
                  </div>

                  <div className="reg-btn-row">
                    <button type="button" className="reg-btn-back" onClick={prev}>← Back</button>
                    <button type="submit" className="reg-btn-primary reg-btn-submit" disabled={loading}>
                      {loading ? (
                        <><div className="reg-spinner" /> Creating Account…</>
                      ) : (
                        <>Create Account ✓</>
                      )}
                    </button>
                  </div>

                  <p className="reg-terms">
                    By creating an account, you agree to our Terms of Service and Privacy Policy. All data is handled in compliance with HIPAA & GDPR.
                  </p>
                </div>
              </form>
            )}

            <div className="reg-signin-link">
              Already have an account? <Link to="/login">Sign in here →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

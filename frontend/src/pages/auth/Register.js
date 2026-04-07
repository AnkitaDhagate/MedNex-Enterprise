import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Register.css';

const ROLES = [
  { value: 'ADMIN', label: '🛡️ Admin' },
  { value: 'DOCTOR', label: '🩺 Doctor' },
  { value: 'NURSE', label: '💉 Nurse' },
  { value: 'RECEPTIONIST', label: '🗂️ Receptionist' },
  { value: 'PHARMACIST', label: '💊 Pharmacist' },
  { value: 'LAB_TECH', label: '🔬 Lab Technician' },
];

export default function Register() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    tenantId: 'tenant_a',
    role: 'RECEPTIONIST',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First and last name are required.'); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address.'); return false;
    }
    if (form.username.length < 4) {
      toast.error('Username must be at least 4 characters.'); return false;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.'); return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await authAPI.register(payload);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Background orbs */}
      <div className="login-bg">
        <div className="bg-orb orb1"></div>
        <div className="bg-orb orb2"></div>
        <div className="bg-orb orb3"></div>
      </div>

      {/* Left Branding Panel */}
      <div className="login-left">
        <div className="login-branding">
          <div className="brand-logo">
            <div className="brand-icon">M</div>
            <div>
              <div className="brand-name">MedNex</div>
              <div className="brand-tagline">Enterprise Hospital Management</div>
            </div>
          </div>

          <div className="hospital-visual">
            <img
              src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&q=80"
              alt="Hospital"
              className="hospital-img"
            />
            <div className="img-overlay"></div>
          </div>

          <div className="brand-stats">
            <div className="stat-item">
              <span className="stat-num">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">HIPAA</span>
              <span className="stat-label">Compliant</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">AES-128</span>
              <span className="stat-label">Encrypted</span>
            </div>
          </div>

          <p className="brand-desc">
            Join MedNex — the secure multi-tenant hospital management platform
            trusted by healthcare professionals worldwide.
          </p>
        </div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="login-right register-right">
        <div className="login-card register-card fade-in">
          <div className="login-header">
            <h1>Create Account</h1>
            <p>Register to access your hospital dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form register-form">
            {/* Name row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="you@hospital.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Username */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="form-control"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            {/* Tenant & Role row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hospital / Tenant</label>
                <select
                  name="tenantId"
                  className="form-control"
                  value={form.tenantId}
                  onChange={handleChange}
                >
                  <option value="tenant_a">🏥 City Hospital</option>
                  <option value="tenant_b">🏨 Metro Clinic</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  name="role"
                  className="form-control"
                  value={form.role}
                  onChange={handleChange}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-toggle">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="form-control"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg login-btn"
              disabled={loading}
            >
              {loading ? <span className="spinner"></span> : null}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="auth-switch">
            <span>Already have an account?</span>
            <Link to="/login" className="auth-switch-link">Sign In</Link>
          </div>

          <div className="login-footer">
            <span>Protected by AES-128 encryption</span>
            <span className="dot-sep">•</span>
            <span>HIPAA / GDPR Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import './Login.css';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '', tenantId: 'tenant_a' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome to MedNex HMS!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-bg">
        <div className="bg-orb orb1"></div>
        <div className="bg-orb orb2"></div>
        <div className="bg-orb orb3"></div>
      </div>

      {/* Left Panel — Branding */}
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
            Secure multi-tenant hospital management platform with real-time scheduling,
            EMR, and GDPR-compliant patient data management.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="login-right">
        <div className="login-card fade-in">
          <div className="login-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your hospital dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Tenant / Hospital</label>
              <select
                className="form-control"
                value={form.tenantId}
                onChange={e => setForm({ ...form, tenantId: e.target.value })}
              >
                <option value="tenant_a">🏥 City Hospital (Tenant A)</option>
                <option value="tenant_b">🏨 Metro Clinic (Tenant B)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg login-btn" disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              {loading ? 'Signing in...' : 'Sign In to MedNex'}
            </button>
          </form>

          {/* ── Register link ── */}
          <div className="auth-switch">
            <span>Don't have an account?</span>
            <Link to="/register" className="auth-switch-link">Create Account</Link>
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

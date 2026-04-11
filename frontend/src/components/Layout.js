// src/components/Layout.js — Premium Medical HMS Layout
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const NAV = [
  { to: '/dashboard',       icon: '🏠', label: 'Dashboard',       accent: '#00d4ff' },
  { to: '/patients',        icon: '👥', label: 'Patients',         accent: '#00e5a0' },
  { to: '/appointments',    icon: '📅', label: 'Appointments',     accent: '#f59e0b' },
  { to: '/medical-records', icon: '📋', label: 'Medical Records',  accent: '#a78bfa' },
  { to: '/analytics',       icon: '📊', label: 'Analytics',        accent: '#f43f5e' },
  { to: '/audit',           icon: '🔐', label: 'Audit Logs',       accent: '#00d4ff' },
];

const TENANT_LABELS = {
  'HOSP_A': 'City Central Hospital',
  'HOSP_B': 'Community Healthcare',
  'HOSP_C': 'Memorial Medical Center',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, tenant, switchTenant } = useAuth();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const pageTitle = NAV.find(n => location.pathname.startsWith(n.to))?.label || 'MedNex';
  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username || 'User';
  const userInitial = (user?.firstName || user?.username || 'U').charAt(0).toUpperCase();
  const userRole = user?.roles?.[0] || user?.role || 'User';

  return (
    <div className={`layout ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <span>M</span>
            <div className="logo-pulse" />
          </div>
          {!collapsed && (
            <div className="sb-logo-text">
              <span className="sb-brand">MedNex</span>
              <span className="sb-sub">Enterprise HMS</span>
            </div>
          )}
          <button className="sb-collapse-btn" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Tenant Selector */}
        {!collapsed && (
          <div className="sb-tenant">
            <div className="sb-tenant-label">Active Tenant</div>
            <select className="sb-tenant-select" value={tenant} onChange={e => switchTenant(e.target.value)}>
              <option value="HOSP_A">🏥 City Central Hospital</option>
              <option value="HOSP_B">🏨 Community Healthcare</option>
              <option value="HOSP_C">🏛️ Memorial Medical Center</option>
            </select>
          </div>
        )}

        {/* Nav */}
        <nav className="sb-nav">
          {!collapsed && <div className="sb-nav-section">Main Navigation</div>}
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sb-nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
              style={({ isActive }) => isActive ? { '--item-accent': item.accent } : {}}
            >
              <span className="sb-nav-icon">{item.icon}</span>
              {!collapsed && <span className="sb-nav-label">{item.label}</span>}
              {!collapsed && <span className="sb-nav-arrow">›</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">{userInitial}</div>
            {!collapsed && (
              <div className="sb-user-info">
                <div className="sb-user-name">{userName}</div>
                <div className="sb-user-role">{userRole.replace('ROLE_', '')}</div>
              </div>
            )}
          </div>
          <button className="sb-logout" onClick={handleLogout} title="Logout">
            {collapsed ? '↩' : '↩ Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="main-area">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <span className="topbar-brand">MedNex</span>
              <span className="topbar-sep">›</span>
              <span className="topbar-page">{pageTitle}</span>
            </div>
            <h1 className="topbar-title">{pageTitle}</h1>
          </div>
          <div className="topbar-right">
            <div className="topbar-tenant-badge">
              🏥 {TENANT_LABELS[tenant] || tenant}
            </div>
            <div className="topbar-time">
              <div className="topbar-time-date">
                {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="topbar-time-clock">
                {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
            <div className="topbar-status">
              <span className="status-dot live" />
              <span>Live</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

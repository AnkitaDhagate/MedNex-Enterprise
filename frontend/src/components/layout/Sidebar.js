import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const NAV = [
  { to: '/dashboard',        icon: '⬛', label: 'Dashboard' },
  { to: '/patients',         icon: '👤', label: 'Patients' },
  { to: '/appointments',     icon: '📅', label: 'Appointments' },
  { to: '/medical-records',  icon: '🏥', label: 'Medical Records' },
  { to: '/analytics',        icon: '📊', label: 'Analytics' },
  { to: '/audit',            icon: '🔒', label: 'Audit Logs' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout, tenant, switchTenant } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <span>M</span>
        </div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-name">MedNex</span>
            <span className="logo-sub">Enterprise HMS</span>
          </div>
        )}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Tenant Badge */}
      {!collapsed && (
        <div className="tenant-selector">
          <label>Tenant</label>
          <select value={tenant} onChange={e => switchTenant(e.target.value)}>
            <option value="tenant_a">Tenant A — City Hospital</option>
            <option value="tenant_b">Tenant B — Metro Clinic</option>
          </select>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
            {!collapsed && <span className="nav-arrow">›</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="user-details">
              <span className="user-name">{user?.username || 'Admin'}</span>
              <span className="user-role">{user?.role || 'Administrator'}</span>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          {collapsed ? '⇦' : '⇦ Logout'}
        </button>
      </div>
    </aside>
  );
}

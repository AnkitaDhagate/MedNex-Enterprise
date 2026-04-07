import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css';

const PAGE_TITLES = {
  '/dashboard':       'Dashboard',
  '/patients':        'Patient Management',
  '/appointments':    'Appointment Scheduling',
  '/medical-records': 'Medical Records',
  '/analytics':       'Analytics & Reports',
  '/audit':           'Audit Logs',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = Object.entries(PAGE_TITLES).find(([k]) => location.pathname.startsWith(k))?.[1] || 'MedNex';

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="page-title">{title}</h2>
            <div className="breadcrumb">
              <span>MedNex</span>
              <span className="sep">›</span>
              <span>{title}</span>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-time">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="status-dot" title="System Online">
              <span className="dot"></span> Live
            </div>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

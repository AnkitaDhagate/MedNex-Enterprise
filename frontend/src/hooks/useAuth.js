import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant]   = useState(localStorage.getItem('mednex_tenant') || 'tenant_a');

  useEffect(() => {
    const token = localStorage.getItem('mednex_token');
    if (token) {
      authAPI.me().then(r => setUser(r.data)).catch(() => localStorage.clear()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    const { token, ...userData } = res.data;
    localStorage.setItem('mednex_token', token);
    localStorage.setItem('mednex_tenant', credentials.tenantId || 'tenant_a');
    setTenant(credentials.tenantId || 'tenant_a');
    setUser(userData);
    return res.data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch (_) {}
    localStorage.clear();
    setUser(null);
  };

  const switchTenant = (t) => {
    localStorage.setItem('mednex_tenant', t);
    setTenant(t);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, tenant, login, logout, switchTenant }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

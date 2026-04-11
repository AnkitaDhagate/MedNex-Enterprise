// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, tokenHelper } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenant, setTenant] = useState(localStorage.getItem('mednex_tenant') || 'HOSP_A');

  useEffect(() => {
    const token = tokenHelper.getToken();
    const storedUser = tokenHelper.getUser();
    if (token && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
      // Restore tenant from user object if available
      if (storedUser.tenantId) {
        setTenant(storedUser.tenantId);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password, tenantId) => {
    try {
      const result = await authAPI.login(username, password, tenantId);
      if (result.success && result.data) {
        const { token, refreshToken, user: userData } = result.data;
        tokenHelper.save(token, refreshToken, userData);
        localStorage.setItem('mednex_tenant', tenantId || 'HOSP_A');
        setTenant(tenantId || 'HOSP_A');
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      }
      return { success: false, message: result.message || 'Login failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Login failed. Please try again.';
      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (formData) => {
    try {
      const result = await authAPI.register(formData);
      if (result.success && result.data) {
        const { token, refreshToken, user: userData } = result.data;
        tokenHelper.save(token, refreshToken, userData);
        localStorage.setItem('mednex_tenant', formData.tenantId || 'HOSP_A');
        setTenant(formData.tenantId || 'HOSP_A');
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      }
      return { success: false, message: result.message || 'Registration failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Registration failed.';
      return { success: false, message };
    }
  }, []);

  /**
   * FIX 4: Original code called authAPI.logout() which does NOT exist in api.js.
   * This caused an unhandled TypeError on logout.
   * Fixed: simply clear local storage and reset state (backend is stateless JWT).
   */
  const logout = useCallback(() => {
    tokenHelper.clear();
    localStorage.removeItem('mednex_tenant');
    setUser(null);
    setIsAuthenticated(false);
    setTenant('HOSP_A');
  }, []);

  const switchTenant = useCallback((newTenant) => {
    localStorage.setItem('mednex_tenant', newTenant);
    setTenant(newTenant);
    window.location.reload();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      tenant,
      login,
      register,
      logout,
      switchTenant,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

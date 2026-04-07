import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';

import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout        from './components/layout/Layout';
import Login         from './pages/auth/Login';
import Register      from './pages/auth/Register';       // ← NEW
import Dashboard     from './pages/dashboard/Dashboard';
import Patients      from './pages/patients/Patients';
import PatientDetail from './pages/patients/PatientDetail';
import Appointments  from './pages/appointments/Appointments';
import MedicalRecords from './pages/medical-records/MedicalRecords';
import Analytics     from './pages/analytics/Analytics';
import Audit         from './pages/audit/Audit';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'var(--navy)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'3px solid rgba(0,180,216,0.3)', borderTopColor:'var(--teal)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}></div>
        <div style={{ color:'var(--text-muted)', fontSize:14 }}>Loading MedNex…</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />   {/* ← NEW */}

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"        element={<Dashboard />} />
            <Route path="patients"         element={<Patients />} />
            <Route path="patients/:id"     element={<PatientDetail />} />
            <Route path="appointments"     element={<Appointments />} />
            <Route path="medical-records"  element={<MedicalRecords />} />
            <Route path="analytics"        element={<Analytics />} />
            <Route path="audit"            element={<Audit />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

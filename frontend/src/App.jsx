import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Report from './pages/Report';
import AdminLogin from './pages/AdminLogin';
import AdminHome from './pages/AdminHome';
import AdminDashboard from './pages/AdminDashboard';
import FilteredComplaints from './pages/FilteredComplaints';
import ComplaintDetail from './pages/ComplaintDetail';
import CctvDemo from './pages/CctvDemo';
import AiTest from './pages/AiTest';
import { ThemeProvider } from './context/ThemeContext';


function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-main)' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<Report />} />
            
            {/* Admin Authentication Route */}
            <Route path="/admin" element={<AdminLogin />} />
            
            {/* Protected Admin Routes */}
            <Route
              path="/admin/home"
              element={
                <ProtectedAdminRoute>
                  <AdminHome />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/pending"
              element={
                <ProtectedAdminRoute>
                  <FilteredComplaints mode="pending" />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/resolved"
              element={
                <ProtectedAdminRoute>
                  <FilteredComplaints mode="resolved" />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/rejected"
              element={
                <ProtectedAdminRoute>
                  <FilteredComplaints mode="rejected" />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/complaints/:id"
              element={
                <ProtectedAdminRoute>
                  <ComplaintDetail />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/cctv-demo"
              element={
                <ProtectedAdminRoute>
                  <CctvDemo />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/ai-test"
              element={
                <ProtectedAdminRoute>
                  <AiTest />
                </ProtectedAdminRoute>
              }
            />


            {/* Fallback to Home for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

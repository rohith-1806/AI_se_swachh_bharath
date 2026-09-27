import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, PlusCircle, LayoutDashboard, Camera, Sun, Moon, LogOut, Home as HomeIcon, Clock, CheckCircle2, XCircle, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminAuthenticated = Boolean(localStorage.getItem('adminToken'));

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setMobileMenuOpen(false);
    navigate('/admin');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background 0.3s ease, border-color 0.3s ease'
    }}>
      {/* Subtle tricolour accent line at top */}
      <div className="tricolour-stripe" />

      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Brand Logo & Title */}
        <Link to={isAdminRoute && isAdminAuthenticated ? "/admin/home" : "/"} onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #FF9933, #138808)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(230, 81, 0, 0.3)'
          }}>
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              AI SE SWACHH BHARAT
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isAdminRoute && isAdminAuthenticated ? "Municipal Admin Portal" : "AI-POWERED MUNICIPAL CIVIC CLEANLINESS PLATFORM"}
            </div>
          </div>

        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-menu-desktop" style={{ alignItems: 'center', gap: '12px' }}>
          {isAdminRoute && isAdminAuthenticated ? (
            <>
              <Link
                to="/admin/home"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  borderColor: location.pathname === '/admin/home' ? 'var(--primary)' : 'var(--border-color)',
                  color: location.pathname === '/admin/home' ? 'var(--primary)' : 'var(--text-main)'
                }}
              >
                <HomeIcon size={14} /> Home
              </Link>

              <Link
                to="/admin/dashboard"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  borderColor: location.pathname === '/admin/dashboard' ? 'var(--primary)' : 'var(--border-color)',
                  color: location.pathname === '/admin/dashboard' ? 'var(--primary)' : 'var(--text-main)'
                }}
              >
                <LayoutDashboard size={14} /> Dashboard
              </Link>

              <Link
                to="/admin/pending"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  borderColor: location.pathname === '/admin/pending' ? 'var(--warning)' : 'var(--border-color)',
                  color: location.pathname === '/admin/pending' ? 'var(--warning)' : 'var(--text-main)'
                }}
              >
                <Clock size={14} /> Pending
              </Link>

              <Link
                to="/admin/resolved"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  borderColor: location.pathname === '/admin/resolved' ? 'var(--primary)' : 'var(--border-color)',
                  color: location.pathname === '/admin/resolved' ? 'var(--primary)' : 'var(--text-main)'
                }}
              >
                <CheckCircle2 size={14} /> Resolved
              </Link>

              <Link
                to="/admin/rejected"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  borderColor: location.pathname === '/admin/rejected' ? 'var(--danger)' : 'var(--border-color)',
                  color: location.pathname === '/admin/rejected' ? 'var(--danger)' : 'var(--text-main)'
                }}
              >
                <XCircle size={14} /> Rejected
              </Link>

              <Link
                to="/admin/cctv-demo"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  borderColor: location.pathname === '/admin/cctv-demo' ? 'var(--chakra-blue)' : 'var(--border-color)',
                  color: location.pathname === '/admin/cctv-demo' ? 'var(--chakra-blue)' : 'var(--text-main)'
                }}
              >
                <Camera size={14} /> CCTV
              </Link>

              <Link
                to="/admin/ai-test"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  borderColor: location.pathname === '/admin/ai-test' ? 'var(--saffron)' : 'var(--border-color)',
                  color: location.pathname === '/admin/ai-test' ? 'var(--saffron)' : 'var(--text-main)'
                }}
              >
                AI Model Test
              </Link>


              <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="btn btn-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  borderColor: location.pathname === '/' ? 'var(--primary)' : 'var(--border-color)',
                  color: location.pathname === '/' ? 'var(--primary)' : 'var(--text-main)'
                }}
              >
                Home
              </Link>

              <Link to="/report" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.9rem' }}>
                <PlusCircle size={18} />
                Report Garbage
              </Link>
            </>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn-icon"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} color="#FF9933" /> : <Moon size={18} color="#1A237E" />}
          </button>
        </nav>

        {/* Mobile Menu & Theme Toggle Header Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="nav-menu-mobile-btn">
          <button
            onClick={toggleTheme}
            className="btn-icon"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} color="#FF9933" /> : <Moon size={18} color="#1A237E" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-icon"
            aria-label="Open Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {isAdminRoute && isAdminAuthenticated ? (
            <>
              <Link to="/admin/home" onClick={closeMenu} className="btn btn-secondary btn-mobile-full">
                <HomeIcon size={16} /> Admin Home
              </Link>
              <Link to="/admin/dashboard" onClick={closeMenu} className="btn btn-secondary btn-mobile-full">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/admin/pending" onClick={closeMenu} className="btn btn-secondary btn-mobile-full" style={{ color: 'var(--warning)' }}>
                <Clock size={16} /> Pending Complaints
              </Link>
              <Link to="/admin/resolved" onClick={closeMenu} className="btn btn-secondary btn-mobile-full" style={{ color: 'var(--primary)' }}>
                <CheckCircle2 size={16} /> Resolved Complaints
              </Link>
              <Link to="/admin/rejected" onClick={closeMenu} className="btn btn-secondary btn-mobile-full" style={{ color: 'var(--danger)' }}>
                <XCircle size={16} /> Rejected Complaints
              </Link>
              <Link to="/admin/cctv-demo" onClick={closeMenu} className="btn btn-secondary btn-mobile-full">
                <Camera size={16} /> CCTV Simulator
              </Link>
              <Link to="/admin/ai-test" onClick={closeMenu} className="btn btn-secondary btn-mobile-full">
                AI Model Test Ground
              </Link>

              <button onClick={handleLogout} className="btn btn-danger btn-mobile-full">
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/" onClick={closeMenu} className="btn btn-secondary btn-mobile-full">
                Home
              </Link>
              <Link to="/report" onClick={closeMenu} className="btn btn-primary btn-mobile-full">
                <PlusCircle size={18} /> Report Garbage
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, XCircle, LayoutDashboard, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function AdminHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.getComplaints();
      if (res.success) {
        setComplaints(res.complaints || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin home stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const pendingCount = complaints.filter(
    c => c.status === 'NEW' || c.status === 'CLEANING_TEAM_ASSIGNED' || c.status === 'CLEANING_IN_PROGRESS'
  ).length;

  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;
  const rejectedCount = complaints.filter(c => c.status === 'REJECTED').length;
  const totalCount = complaints.length;

  return (
    <div className="container" style={{ padding: '36px 20px', maxWidth: '1100px' }}>
      {/* Admin Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="tricolour-badge" style={{ marginBottom: '10px' }}>
            <ShieldCheck size={16} /> Municipal Command Center
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Welcome, Administrator
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            AI Se Swachh Bharat — Administration Overview & Navigation
          </p>

        </div>

        <button className="btn btn-secondary" onClick={fetchStats} disabled={loading} style={{ padding: '10px 16px' }}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Live Counts
        </button>
      </div>

      {/* Summary Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Action
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
            {loading ? '...' : pendingCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Resolved Issues
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {loading ? '...' : resolvedCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Rejected Submissions
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>
            {loading ? '...' : rejectedCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--chakra-blue)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Recorded
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            {loading ? '...' : totalCount}
          </div>
        </div>
      </div>

      {/* Main Admin Navigation Actions Grid */}
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-main)' }}>
        Quick Navigation & Incident Categorization
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {/* 1. View Pending Complaints */}
        <Link to="/admin/pending" style={{ textDecoration: 'none' }}>
          <div className="glass-panel" style={{ padding: '28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--warning)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={24} />
                </div>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)' }}>
                  {loading ? '...' : pendingCount}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
                View Pending Complaints
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Inspect reports awaiting municipal team assignment or active cleanup in progress.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)', fontWeight: 700, fontSize: '0.9rem', marginTop: '20px' }}>
              Open Pending View <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        {/* 2. View Resolved Complaints */}
        <Link to="/admin/resolved" style={{ textDecoration: 'none' }}>
          <div className="glass-panel" style={{ padding: '28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--primary)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--india-green-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={24} />
                </div>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {loading ? '...' : resolvedCount}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
                View Resolved Complaints
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Browse verified and successfully cleaned garbage locations across the corporation.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', marginTop: '20px' }}>
              Open Resolved View <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        {/* 3. View Rejected Complaints */}
        <Link to="/admin/rejected" style={{ textDecoration: 'none' }}>
          <div className="glass-panel" style={{ padding: '28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--danger)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={24} />
                </div>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)' }}>
                  {loading ? '...' : rejectedCount}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
                View Rejected Complaints
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Review reports rejected due to lack of waste accumulation or invalid submissions.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontWeight: 700, fontSize: '0.9rem', marginTop: '20px' }}>
              Open Rejected View <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        {/* 4. Open Full Dashboard */}
        <Link to="/admin/dashboard" style={{ textDecoration: 'none' }}>
          <div className="glass-panel" style={{ padding: '28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--chakra-blue)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.15)', color: 'var(--chakra-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LayoutDashboard size={24} />
                </div>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--chakra-blue)' }}>
                  {loading ? '...' : totalCount}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
                Open Main Dashboard
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Access the complete real-time municipal command center dashboard feed and filters.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--chakra-blue)', fontWeight: 700, fontSize: '0.9rem', marginTop: '20px' }}>
              Open Dashboard <ArrowRight size={16} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Search, Filter, RefreshCw, Eye, Truck, Camera, User, MapPin, ExternalLink, CheckCircle2, Send, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.getComplaints({
        search,
        source: sourceFilter || undefined,
        status: statusFilter || undefined
      });
      if (res.success) {
        setComplaints(res.complaints || []);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [sourceFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const handleAssignTeam = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.assignCleaningTeam(id);
      if (res.success) {
        fetchComplaints();
      }
    } catch (err) {
      alert('Failed to assign cleaning team');
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramStatus(null);
    try {
      const res = await api.testTelegram();
      setTestingTelegram(false);
      if (res.success) {
        setTelegramStatus({ type: 'SUCCESS', message: res.message });
      } else {
        setTelegramStatus({ type: 'ERROR', message: res.message });
      }
    } catch (err) {
      setTestingTelegram(false);
      const msg = err.response?.data?.message || 'Telegram connection test failed.';
      setTelegramStatus({ type: 'ERROR', message: msg });
    }
  };

  // Compute Metrics
  const totalCount = complaints.length;
  const newCount = complaints.filter(c => c.status === 'NEW').length;
  const assignedCount = complaints.filter(c => c.status === 'CLEANING_TEAM_ASSIGNED' || c.status === 'CLEANING_IN_PROGRESS').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;
  const cctvCount = complaints.filter(c => c.source === 'CCTV').length;
  const userCount = complaints.filter(c => c.source === 'USER').length;

  return (
    <div className="container" style={{ padding: '30px 20px' }}>

      {/* Title & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #FF9933, #138808)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Municipal Cleanliness Command Center
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            AI Se Swachh Bharat — Real-time Incident & Response Dashboard
          </p>

        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleTestTelegram} disabled={testingTelegram} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <Send size={14} color="var(--primary)" /> {testingTelegram ? 'Testing Telegram...' : 'Test Telegram Alert'}
          </button>
          <button className="btn btn-secondary" onClick={fetchComplaints} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Telegram Test Status Alert Banner */}
      {telegramStatus && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: telegramStatus.type === 'SUCCESS' ? 'var(--india-green-bg)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${telegramStatus.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: telegramStatus.type === 'SUCCESS' ? 'var(--primary)' : 'var(--danger)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {telegramStatus.type === 'SUCCESS' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{telegramStatus.message}</span>
          </div>
          <button onClick={() => setTelegramStatus(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'New Incidents', count: newCount, color: 'var(--danger)' },
          { label: 'Cleaning Assigned', count: assignedCount, color: 'var(--warning)' },
          { label: 'Resolved Complaints', count: resolvedCount, color: 'var(--primary)' },
          { label: 'CCTV AI Incidents', count: cctvCount, color: 'var(--chakra-blue)' },
          { label: 'Citizen Reports', count: userCount, color: 'var(--saffron)' },
          { label: 'Total Tracked', count: totalCount, color: 'var(--text-main)' }
        ].map((metric, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {metric.label}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: metric.color, marginTop: '4px' }}>
              {metric.count}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by ID, Address, or Reporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            <Search size={16} />
          </button>
        </form>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select className="form-select" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All Sources</option>
            <option value="USER">User Citizen Reports</option>
            <option value="CCTV">CCTV Cameras</option>
          </select>

          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CLEANING_TEAM_ASSIGNED">Cleaning Assigned</option>
            <option value="CLEANING_IN_PROGRESS">Cleaning In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Complaints Data Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'var(--bg-surface-hover)' }}>
              <th style={{ padding: '16px' }}>Incident ID</th>
              <th style={{ padding: '16px' }}>Source</th>
              <th style={{ padding: '16px' }}>Reporter / Camera</th>
              <th style={{ padding: '16px' }}>Location</th>
              <th style={{ padding: '16px' }}>Waste Type & Severity</th>
              <th style={{ padding: '16px' }}>Cleanliness %</th>
              <th style={{ padding: '16px' }}>AI Conf.</th>
              <th style={{ padding: '16px' }}>Reported Time</th>
              <th style={{ padding: '16px' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>

            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading municipal incident feed...
                </td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No complaints found matching current criteria.
                </td>
              </tr>
            ) : (
              complaints.map((c) => {
                const mapsUrl = `https://www.google.com/maps?q=${c.latitude},${c.longitude}`;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {c.id}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {c.source === 'CCTV' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--chakra-blue)', fontWeight: 600 }}>
                          <Camera size={14} /> CCTV
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--saffron)', fontWeight: 600 }}>
                          <User size={14} /> USER
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {c.source === 'CCTV' ? (c.cameraName || c.cameraId || 'CCTV Camera') : (c.reporterName || 'Citizen')}
                      </div>
                      {c.source === 'USER' && c.reporterPhone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          Phone: {c.reporterPhone}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', maxWidth: '200px' }}>
                      <div style={{ color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.address}
                      </div>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                      >
                        <MapPin size={10} /> View Location <ExternalLink size={10} />
                      </a>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.wasteType || 'Mixed Waste'}</div>
                      <div style={{ fontSize: '0.75rem', color: c.severity === 'CRITICAL' ? 'var(--danger)' : c.severity === 'HIGH' ? 'var(--warning)' : 'var(--text-muted)' }}>
                        Severity: {c.severity || 'MEDIUM'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700, color: (c.cleanlinessScore || 20) > 60 ? 'var(--primary)' : 'var(--warning)' }}>
                      {c.cleanlinessScore !== undefined ? `${c.cleanlinessScore}%` : 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                      {c.aiConfidence ? `${intVal(c.aiConfidence)}%` : 'N/A'}
                    </td>

                    <td style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {formatTime(c.createdAt)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {c.status === 'NEW' && (
                          <button
                            className="btn btn-action"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            onClick={(e) => handleAssignTeam(c.id, e)}
                          >
                            <Truck size={12} /> Send Cleaning Team
                          </button>
                        )}
                        <Link to={`/admin/complaints/${c.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                          <Eye size={12} /> Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function intVal(val) {
  if (typeof val === 'number') return Math.round(val * (val <= 1 ? 100 : 1));
  return val;
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return isoStr;
  }
}

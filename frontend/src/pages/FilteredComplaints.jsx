import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, RefreshCw, Eye, Truck, Camera, User, MapPin, ExternalLink, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function FilteredComplaints({ mode }) {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const config = {
    pending: {
      title: 'Pending Complaints',
      subtitle: 'Complaints awaiting municipal sanitation response or active cleanup in progress',
      badgeColor: 'var(--warning)',
      icon: Clock,
      validStatuses: ['NEW', 'CLEANING_TEAM_ASSIGNED', 'CLEANING_IN_PROGRESS']
    },
    resolved: {
      title: 'Resolved Complaints',
      subtitle: 'Complaints successfully verified and cleaned by municipal teams',
      badgeColor: 'var(--primary)',
      icon: CheckCircle2,
      validStatuses: ['RESOLVED']
    },
    rejected: {
      title: 'Rejected Complaints',
      subtitle: 'Submissions rejected due to invalid media or lack of waste persistence',
      badgeColor: 'var(--danger)',
      icon: XCircle,
      validStatuses: ['REJECTED']
    }
  }[mode] || {
    title: 'Complaints',
    subtitle: 'Municipal Complaints Feed',
    badgeColor: 'var(--primary)',
    icon: Clock,
    validStatuses: []
  };

  const IconHeader = config.icon;

  const fetchFilteredComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.getComplaints({ search });
      if (res.success) {
        const raw = res.complaints || [];
        const filtered = raw.filter(c => config.validStatuses.includes(c.status));
        setComplaints(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch filtered complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredComplaints();
  }, [mode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFilteredComplaints();
  };

  const handleAssignTeam = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.assignCleaningTeam(id);
      if (res.success) {
        fetchFilteredComplaints();
      }
    } catch (err) {
      alert('Failed to assign cleaning team');
    }
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/home')} style={{ marginBottom: '12px', padding: '6px 12px', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back to Admin Home
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: config.badgeColor, padding: '6px', borderRadius: '8px', color: '#fff', display: 'flex' }}>
              <IconHeader size={20} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {config.title}
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {config.subtitle}
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchFilteredComplaints} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
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

        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Count: <span style={{ color: config.badgeColor, fontWeight: 800 }}>{complaints.length}</span>
        </div>
      </div>

      {/* Complaints Data Table */}
      <div className="glass-panel responsive-table-wrapper">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'var(--bg-surface-hover)' }}>
              <th style={{ padding: '16px' }}>Incident ID</th>
              <th style={{ padding: '16px' }}>Source</th>
              <th style={{ padding: '16px' }}>Reporter / Camera</th>
              <th style={{ padding: '16px' }}>Location</th>
              <th style={{ padding: '16px' }}>Waste Type & Severity</th>
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
                  Loading {config.title.toLowerCase()}...
                </td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No {config.title.toLowerCase()} found matching current criteria.
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

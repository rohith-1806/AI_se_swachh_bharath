import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, ExternalLink, Truck, CheckCircle2, XCircle, ShieldCheck, User, Phone, Camera, Calendar, Film, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getComplaintById(id);
      if (res.success) {
        setComplaint(res.complaint);
      }
    } catch (err) {
      console.error('Failed to load complaint details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await api.updateComplaintStatus(id, newStatus);
      if (res.success) {
        setComplaint(res.complaint);
      }
    } catch (err) {
      alert('Failed to update complaint status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignTeam = async () => {
    setUpdating(true);
    try {
      const res = await api.assignCleaningTeam(id);
      if (res.success) {
        setComplaint(res.complaint);
      }
    } catch (err) {
      alert('Failed to assign sanitation team');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading incident details...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Incident Document Not Found</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')} style={{ marginTop: '16px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`;
  const isUser = complaint.source === 'USER';
  const isVideo = complaint.mediaType === 'VIDEO';

  return (
    <div className="container" style={{ padding: '30px 20px', maxWidth: '1020px' }}>
      <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Left Column: Visual Evidence & Media */}
        <div>
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isVideo ? <Film size={18} color="var(--primary)" /> : <ImageIcon size={18} color="var(--primary)" />}
              Evidence & AI Frames
            </h3>

            {/* Video Player or Main Media */}
            {isVideo && complaint.mediaUrl ? (
              <div style={{ background: '#000', borderRadius: '10px', overflow: 'hidden', textAlign: 'center', marginBottom: '16px' }}>
                <video src={complaint.mediaUrl} controls style={{ width: '100%', maxHeight: '300px' }} />
                <div style={{ padding: '6px', fontSize: '0.75rem', color: '#aaa', background: '#111' }}>Original Uploaded Video</div>
              </div>
            ) : null}

            {/* AI Evidence Frame #1 and Frame #2 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: complaint.evidenceFrame2Url ? '1fr 1fr' : '1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {isVideo ? 'Evidence Frame #1' : 'AI Annotated Evidence'}
                </div>
                <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                  <img
                    src={complaint.evidenceFrame1Url || complaint.evidenceFrameUrl || complaint.mediaUrl}
                    alt="Evidence Frame 1"
                    style={{ width: '100%', height: '160px', objectFit: 'contain' }}
                  />
                </div>
              </div>

              {complaint.evidenceFrame2Url && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                    Evidence Frame #2
                  </div>
                  <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                    <img
                      src={complaint.evidenceFrame2Url}
                      alt="Evidence Frame 2"
                      style={{ width: '100%', height: '160px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Diagnostics Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI Classification</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {complaint.aiClassification || 'GARBAGE'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cleanliness Score</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: (complaint.cleanlinessScore || 20) > 60 ? 'var(--primary)' : 'var(--danger)' }}>
                  {complaint.cleanlinessScore !== undefined ? `${complaint.cleanlinessScore}%` : 'N/A'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI Confidence</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--warning)' }}>
                  {complaint.aiConfidence ? `${Math.round(complaint.aiConfidence * 100)}%` : 'N/A'}
                </div>
              </div>
            </div>

            {isVideo && (
              <div style={{
                marginTop: '12px',
                background: 'var(--bg-primary)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Sampled Frames: <strong>{complaint.sampledFramesCount || 'N/A'}</strong></span>
                <span>Positive Persistence Frames: <strong>{complaint.positiveFramesCount || 'N/A'}</strong></span>
              </div>
            )}
          </div>

          {/* Action Control Box */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
              Municipal Action Response
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {complaint.status === 'NEW' && (
                <button
                  className="btn btn-action"
                  disabled={updating}
                  onClick={handleAssignTeam}
                  style={{ padding: '14px', fontSize: '1rem' }}
                >
                  <Truck size={18} /> Send Cleaning Team
                </button>
              )}

              {complaint.status === 'CLEANING_TEAM_ASSIGNED' && (
                <button
                  className="btn btn-secondary"
                  disabled={updating}
                  onClick={() => handleStatusUpdate('CLEANING_IN_PROGRESS')}
                  style={{ padding: '14px', fontSize: '1rem' }}
                >
                  <Truck size={18} /> Mark Cleaning In Progress
                </button>
              )}

              {complaint.status !== 'RESOLVED' && (
                <button
                  className="btn btn-green"
                  disabled={updating}
                  onClick={() => handleStatusUpdate('RESOLVED')}
                >
                  <CheckCircle2 size={18} /> Mark Complaint Resolved
                </button>
              )}

              {complaint.status !== 'REJECTED' && (
                <button
                  className="btn btn-danger"
                  disabled={updating}
                  onClick={() => handleStatusUpdate('REJECTED')}
                  style={{ opacity: 0.8 }}
                >
                  <XCircle size={18} /> Reject Report
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Incident Details */}
        <div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{complaint.id}</span>
              <StatusBadge status={complaint.status} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Source Type</label>
                <div style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: isUser ? 'var(--saffron)' : 'var(--chakra-blue)' }}>
                  {isUser ? <User size={16} /> : <Camera size={16} />}
                  {isUser ? 'Citizen Report (USER)' : `CCTV Camera (${complaint.cameraName || complaint.cameraId})`}
                </div>
              </div>

              {isUser && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reporter Name</label>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{complaint.reporterName}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reporter Phone</label>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{complaint.reporterPhone}</div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Description</label>
                <div style={{ color: 'var(--text-main)', background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem' }}>
                  {complaint.description || 'No description provided'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Incident Location</label>
                <div style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '4px' }}>{complaint.address}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  GPS Coordinates: {complaint.latitude}, {complaint.longitude}
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <MapPin size={14} color="var(--primary)" /> View Location on Google Maps <ExternalLink size={12} />
                </a>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Reported Time:</span>
                  <span style={{ color: 'var(--text-main)' }}>{new Date(complaint.createdAt).toLocaleString()}</span>
                </div>
                {complaint.assignedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <span>Cleaning Team Assigned:</span>
                    <span style={{ color: 'var(--warning)' }}>{new Date(complaint.assignedAt).toLocaleString()}</span>
                  </div>
                )}
                {complaint.resolvedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <span>Resolved At:</span>
                    <span style={{ color: 'var(--primary)' }}>{new Date(complaint.resolvedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Camera, Video, Play, Loader2, CheckCircle2, AlertTriangle, Send, MapPin, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export default function CctvDemo() {
  const [cameras, setCameras] = useState([]);
  const [selectedCam, setSelectedCam] = useState('CAM-001');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadCams() {
      try {
        const res = await api.getCameras();
        if (res.success) {
          setCameras(res.cameras || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCams();
  }, []);

  const handleVideoSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleProcessVideo = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a CCTV test video file.');
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('cameraId', selectedCam);

    try {
      const res = await api.processCctvVideo(formData);
      setLoading(false);
      if (res.success) {
        setResult(res.result);
      }
    } catch (err) {
      setLoading(false);
      alert('Failed to process CCTV video stream.');
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '900px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '12px',
          background: 'rgba(37, 99, 235, 0.15)',
          color: 'var(--chakra-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <Camera size={30} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>CCTV Stream Processor & Simulator</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Test AI waste persistence detection on simulated CCTV video feeds. Automatically sends Telegram notifications for verified garbage incidents.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <form onSubmit={handleProcessVideo}>
          <div className="form-group">
            <label className="form-label">Select Municipal CCTV Camera Point</label>
            <select
              className="form-select"
              value={selectedCam}
              onChange={(e) => setSelectedCam(e.target.value)}
            >
              {cameras.length > 0 ? (
                cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.id} — {cam.name} ({cam.location})
                  </option>
                ))
              ) : (
                <>
                  <option value="CAM-001">CAM-001 — Kukatpally Main Junction Camera</option>
                  <option value="CAM-002">CAM-002 — Hi-Tech City Flyover Camera</option>
                </>
              )}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label">CCTV Test Footage (MP4 / MOV Video)</label>
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              background: 'var(--input-bg)',
              position: 'relative'
            }}>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />

              {previewUrl ? (
                <div>
                  <video src={previewUrl} controls style={{ maxHeight: '240px', borderRadius: '8px', maxWidth: '100%' }} />
                  <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--chakra-blue)', fontWeight: 600 }}>
                    Footage Selected: {file?.name}
                  </div>
                </div>
              ) : (
                <div>
                  <Video size={36} color="var(--chakra-blue)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Upload Test CCTV Video Stream</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    AI will sample frames and run multi-frame persistence checks.
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-action"
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '12px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={18} className="spin" /> Processing CCTV Stream & Running AI Persistence Check...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={18} /> Execute CCTV AI Analysis
              </span>
            )}
          </button>
        </form>
      </div>

      {/* CCTV Processing Results Display */}
      {result && (
        <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            {result.complaintCreated ? (
              <div style={{ background: 'var(--india-green-bg)', color: 'var(--primary)', padding: '8px', borderRadius: '50%' }}>
                <CheckCircle2 size={24} />
              </div>
            ) : (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', padding: '8px', borderRadius: '50%' }}>
                <AlertTriangle size={24} />
              </div>
            )}
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {result.complaintCreated ? 'Garbage Incident Created & Alerted' : 'CCTV Detection Result'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{result.message}</p>
            </div>
          </div>

          {result.complaintCreated && result.complaint && (
            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Generated ID:</span>{' '}
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{result.complaint.id}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Camera ID:</span>{' '}
                  <span style={{ fontWeight: 700, color: 'var(--chakra-blue)' }}>{result.complaint.cameraId}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>AI Confidence:</span>{' '}
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{Math.round(result.complaint.aiConfidence * 100)}%</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Telegram Alert:</span>{' '}
                  <span style={{ fontWeight: 700, color: result.telegramSent ? 'var(--primary)' : 'var(--warning)' }}>
                    {result.telegramSent ? 'Sent to Admin Chat' : 'Skipped / Simulated'}
                  </span>
                </div>
              </div>

              {result.complaint.latitude && result.complaint.longitude && (
                <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                  <a
                    href={`https://www.google.com/maps?q=${result.complaint.latitude},${result.complaint.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                  >
                    <MapPin size={12} /> View Location on Google Maps <ExternalLink size={10} />
                  </a>
                </div>
              )}

              {result.complaint.evidenceFrameUrl && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Extracted Detection Frame:</div>
                  <img src={result.complaint.evidenceFrameUrl} alt="CCTV Evidence Frame" style={{ maxHeight: '200px', borderRadius: '6px' }} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

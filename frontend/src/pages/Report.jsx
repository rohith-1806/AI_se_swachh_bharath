import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, MapPin, CheckCircle2, AlertTriangle, Loader2, Image as ImageIcon, Video, Plus, X, User, Phone, FileText, Info, Film } from 'lucide-react';
import { api } from '../services/api';

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mediaTypeParam = searchParams.get('type');

  // Multi-image state (1 to 3 images) or single video state
  const [mode, setMode] = useState(mediaTypeParam === 'video' ? 'video' : 'images');
  const [files, setFiles] = useState([]); // Array of File objects for images
  const [videoFile, setVideoFile] = useState(null);

  // Stable Preview URLs managed via useEffect to prevent flickering and memory leaks
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);

  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [description, setDescription] = useState('');

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  const [loading, setLoading] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  // Effect: Manage Photo Object URLs stably
  useEffect(() => {
    if (!files || files.length === 0) {
      setPhotoPreviewUrls([]);
      return;
    }
    const urls = files.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  // Effect: Manage Video Object URL stably (fixes flickering at root cause)
  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  const handleAddPhotos = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected || selected.length === 0) return;

    // Filter valid image files
    const validImages = selected.filter(file => file.type.startsWith('image/'));
    
    if (validImages.length === 0) {
      alert('Please select valid image files (JPG, PNG, WEBP).');
      return;
    }

    const availableSlots = 3 - files.length;
    if (availableSlots <= 0) {
      alert('You can upload a maximum of 3 photos.');
      return;
    }

    const nextFiles = [...files, ...validImages.slice(0, availableSlots)];
    setFiles(nextFiles);
  };

  const handleRemovePhoto = (index) => {
    const nextFiles = files.filter((_, i) => i !== index);
    setFiles(nextFiles);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4, MOV, WEBM).');
      return;
    }
    setVideoFile(file);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setGettingLocation(true);
    setLocationStatus('Acquiring browser GPS location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setAddress(`GPS Lat: ${lat}, Lng: ${lng}`);
        setLocationStatus('Location captured successfully!');
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        setLocationStatus('Unable to retrieve browser location automatically. Please type location details below.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // Prevent duplicate requests

    if (mode === 'images' && files.length === 0) {
      alert('Please upload 1 to 3 photos of the affected area.');
      return;
    }

    if (mode === 'video' && !videoFile) {
      alert('Please select a video file of the affected area.');
      return;
    }

    setLoading(true);
    const formData = new FormData();

    if (mode === 'images') {
      files.forEach((file) => {
        formData.append('media', file);
      });
    } else {
      formData.append('media', videoFile);
    }

    formData.append('reporterName', reporterName);
    formData.append('reporterPhone', reporterPhone);
    formData.append('description', description);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('address', address);

    try {
      const res = await api.submitComplaint(formData);
      setLoading(false);

      if (res.success) {
        setResultModal({
          type: 'SUCCESS',
          title: 'Significant Garbage Accumulation Detected',
          message: res.message || 'Your complaint is being submitted. Our cleaning team has been notified.',
          complaintId: res.complaintId,
          cleanlinessScore: res.cleanlinessScore !== undefined ? res.cleanlinessScore : res.complaint?.cleanlinessScore
        });
      } else {
        const isClean = res.aiClassification === 'CLEAN' || (res.cleanlinessScore !== undefined && res.cleanlinessScore >= 70);
        setResultModal({
          type: 'REJECTED',
          title: isClean ? 'Clean Area Verified' : 'No Significant Garbage Detected',
          message: res.message || 'We could not detect significant garbage accumulation in the uploaded media.',
          cleanlinessScore: res.cleanlinessScore,
          aiClassification: res.aiClassification
        });
      }
    } catch (err) {
      setLoading(false);
      const errRes = err.response?.data;
      setResultModal({
        type: 'REJECTED',
        title: 'Report Processing Notice',
        message: errRes?.message || 'We couldn\'t analyze this video. Please try a clearer or shorter video.'
      });
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '820px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
          Report Garbage Accumulation
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Help make your city cleaner. Submit 1 to 3 photos or a video to notify municipal response teams.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        {/* Toggle Mode: Multi-Photos vs Video */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '28px',
          background: 'var(--input-bg)',
          padding: '6px',
          borderRadius: '10px'
        }}>
          <button
            type="button"
            className="btn"
            disabled={loading}
            onClick={() => setMode('images')}
            style={{
              flex: 1,
              justifyContent: 'center',
              background: mode === 'images' ? 'var(--primary)' : 'transparent',
              color: mode === 'images' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              borderRadius: '8px'
            }}
          >
            <ImageIcon size={18} /> Upload Photos (1–3)
          </button>

          <button
            type="button"
            className="btn"
            disabled={loading}
            onClick={() => setMode('video')}
            style={{
              flex: 1,
              justifyContent: 'center',
              background: mode === 'video' ? 'var(--primary)' : 'transparent',
              color: mode === 'video' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              borderRadius: '8px'
            }}
          >
            <Video size={18} /> Upload Video
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* STEP 1: Media Selection */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: 'var(--saffron)',
                  color: '#fff',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800
                }}>1</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {mode === 'images' ? 'Upload Photos (1 to 3 Images)' : 'Upload Video File'}
                </h3>
              </div>
              {mode === 'images' && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {files.length} / 3 Selected
                </span>
              )}
            </div>

            {mode === 'images' ? (
              <div>
                {/* Photo Previews Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  {photoPreviewUrls.map((url, idx) => (
                    <div key={idx} style={{
                      position: 'relative',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '2px solid var(--primary)',
                      height: '140px'
                    }}>
                      <img
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleRemovePhoto(idx)}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={14} />
                      </button>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        padding: '4px 6px',
                        textAlign: 'center'
                      }}>
                        Photo #{idx + 1}
                      </div>
                    </div>
                  ))}

                  {/* Add Photo Tile */}
                  {files.length < 3 && (
                    <label style={{
                      border: '2px dashed var(--primary)',
                      borderRadius: '10px',
                      height: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--input-bg)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'transform 0.2s ease',
                      gap: '8px'
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={loading}
                        onChange={handleAddPhotos}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        background: 'var(--primary)',
                        color: '#fff',
                        borderRadius: '50%',
                        padding: '8px'
                      }}>
                        <Plus size={20} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                        Add Photo
                      </span>
                    </label>
                  )}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  You can upload up to 3 photos for multi-angle evidence.
                </div>
              </div>
            ) : (
              /* Single Video Input with Stable Preview */
              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                background: 'var(--input-bg)',
                cursor: loading ? 'default' : 'pointer',
                position: 'relative'
              }}>
                {!videoFile && (
                  <input
                    type="file"
                    accept="video/*"
                    disabled={loading}
                    onChange={handleVideoChange}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  />
                )}

                {videoFile && videoPreviewUrl ? (
                  <div>
                    {/* STABLE VIDEO PREVIEW CONTAINER - DOES NOT REMOUNT ON TYPING */}
                    <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                      <video
                        key={videoPreviewUrl}
                        src={videoPreviewUrl}
                        controls
                        style={{ maxHeight: '240px', borderRadius: '8px', maxWidth: '100%', display: 'block' }}
                      />
                    </div>
                    
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                        Selected Video: <strong>{videoFile.name}</strong>
                      </span>
                      {!loading && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setVideoFile(null)}
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Remove Video
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: 'var(--primary)', marginBottom: '12px' }}>
                      <Video size={40} style={{ margin: '0 auto' }} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      Click or Drag Video File Here
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Supports MP4, MOV, WEBM (Server frame sampling will select 2 best evidence frames)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: Add Location */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{
                background: 'var(--chakra-blue)',
                color: '#fff',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 800
              }}>2</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Add Your Location
              </h3>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleGetCurrentLocation}
                disabled={gettingLocation || loading}
                style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
              >
                {gettingLocation ? <Loader2 size={18} className="spin" /> : <MapPin size={18} color="var(--primary)" />}
                Use My Current Location
              </button>
            </div>

            {locationStatus && (
              <div style={{
                fontSize: '0.85rem',
                color: locationStatus.includes('successfully') ? 'var(--primary)' : 'var(--text-muted)',
                marginBottom: '10px'
              }}>
                {locationStatus}
              </div>
            )}

            {(latitude && longitude) && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                Captured Coordinates: {latitude}, {longitude}
              </div>
            )}

            <input
              type="text"
              className="form-input"
              disabled={loading}
              placeholder="Enter Street / Landmark / Area details"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* STEP 3: Tell Us About the Problem */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{
                background: 'var(--primary)',
                color: '#fff',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 800
              }}>3</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Tell Us About the Problem
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your name"
                  required
                  disabled={loading}
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="10-digit mobile number"
                  required
                  disabled={loading}
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                disabled={loading}
                placeholder="Describe the garbage issue or landmark details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* STEP 4: Submit Complaint */}
          <div>
            {loading && mode === 'video' && (
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Film size={16} /> Server Processing AI Video Pipeline...
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: 'var(--text-muted)' }}>
                  <div>✓ Extracting video frames</div>
                  <div>✓ Running PyTorch garbage analysis</div>
                  <div>✓ Multi-frame persistence check</div>
                  <div>✓ Selecting 2 best evidence frames</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <Loader2 size={20} className="spin" /> Analyzing your uploaded media...
                </span>
              ) : (
                'Submit Complaint'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Result / Confirmation Modal */}
      {resultModal && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '32px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: resultModal.type === 'SUCCESS' ? 'var(--india-green-bg)' : 'rgba(239, 68, 68, 0.15)',
              color: resultModal.type === 'SUCCESS' ? 'var(--primary)' : 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              {resultModal.type === 'SUCCESS' ? <CheckCircle2 size={40} /> : <AlertTriangle size={40} />}
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
              {resultModal.title}
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '24px', lineHeight: 1.6 }}>
              {resultModal.message}
            </p>

            {resultModal.cleanlinessScore !== undefined && resultModal.cleanlinessScore !== null && (
              <div style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <Info size={18} color="var(--primary)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Evaluated Cleanliness Score: <strong>{resultModal.cleanlinessScore}%</strong>
                </span>
              </div>
            )}

            {resultModal.complaintId && (
              <div style={{
                background: 'var(--bg-primary)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--primary)',
                fontWeight: 700,
                marginBottom: '24px'
              }}>
                Complaint Reference ID: {resultModal.complaintId}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                setResultModal(null);
                if (resultModal.type === 'SUCCESS') navigate('/');
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

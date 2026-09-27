import React, { useState, useEffect } from 'react';
import { Upload, Cpu, CheckCircle2, AlertTriangle, Loader2, BarChart2, Shield, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function AiTest() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const fetchMetrics = async () => {
    try {
      const res = await api.getAiMetrics();
      if (res.success) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error("Failed to load AI evaluation metrics:", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setAiResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setAiResult(null);

    const formData = new FormData();
    const isVideo = selectedFile.type.startsWith('video/') || selectedFile.name.endsWith('.mp4');

    if (isVideo) {
      formData.append('video', selectedFile);
    } else {
      formData.append('image', selectedFile);
    }

    try {
      const res = isVideo ? await api.analyzeVideo(formData) : await api.analyzeImage(formData);
      if (res.success) {
        setAiResult(res.aiResult);
      } else {
        alert(res.message || 'AI Analysis failed.');
      }
    } catch (err) {
      alert('Error running AI inference model: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1000px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Cpu size={32} color="var(--primary)" /> Trained AI Model Testing Ground
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Demonstrates real-time model inference using PyTorch MobileNetV2 fine-tuned on public Garbage vs Clean place datasets.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

        {/* Column 1: Test Image / Video Upload & Inference */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
            Upload Media for Live Model Test
          </h3>

          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            background: 'var(--input-bg)',
            position: 'relative',
            marginBottom: '20px'
          }}>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
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
                {selectedFile?.type?.startsWith('video/') ? (
                  <video src={previewUrl} controls style={{ maxHeight: '200px', borderRadius: '8px', maxWidth: '100%' }} />
                ) : (
                  <img src={previewUrl} alt="Test Preview" style={{ maxHeight: '200px', borderRadius: '8px', maxWidth: '100%' }} />
                )}
                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                  File: {selectedFile.name} (Click to change)
                </div>
              </div>
            ) : (
              <div>
                <Upload size={36} color="var(--primary)" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                  Click to select Test Image or Video
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Supports JPG, PNG, WEBP, MP4
                </div>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            disabled={!selectedFile || loading}
            onClick={handleAnalyze}
            style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={18} className="spin" /> Executing PyTorch Model Inference...
              </span>
            ) : (
              'Run AI Model Analysis'
            )}
          </button>
        </div>

        {/* Column 2: Live AI Model Output */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={20} color="var(--saffron)" /> Model Inference Output
          </h3>

          {aiResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: aiResult.accepted ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${aiResult.accepted ? 'var(--primary)' : 'var(--danger)'}`,
                padding: '16px',
                borderRadius: '10px'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>AI Classification</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: aiResult.accepted ? 'var(--primary)' : 'var(--danger)' }}>
                  {aiResult.classification}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '4px' }}>
                  {aiResult.userMessage}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cleanliness Score</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: aiResult.cleanliness_score >= 70 ? 'var(--primary)' : 'var(--warning)' }}>
                    {aiResult.cleanliness_score}%
                  </div>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Garbage Detected</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: aiResult.garbage_detected ? 'var(--danger)' : 'var(--primary)' }}>
                    {aiResult.garbage_detected ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--chakra-blue)' }}>
                    {Math.round(aiResult.confidence * 100)}%
                  </div>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detected Waste Type</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {aiResult.wasteType || 'N/A'}
                  </div>
                </div>
              </div>

              {aiResult.evidencePath && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Annotated Evidence Result:</div>
                  <img
                    src={aiResult.evidencePath.includes('uploads') ? `/api/uploads/${aiResult.evidencePath.split('uploads')[1].replace(/\\/g, '/')}` : previewUrl}
                    alt="Evidence"
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px', background: '#000' }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              Select a test image/video and click "Run AI Model Analysis" to see live predictions.
            </div>
          )}
        </div>
      </div>

      {/* Model Performance & Evaluation Metrics Section */}
      <div className="glass-panel" style={{ padding: '28px', marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={22} color="var(--primary)" /> Trained Model Evaluation Metrics (Unseen Test Set)
          </h3>
          <button className="btn btn-secondary" onClick={fetchMetrics} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh Metrics
          </button>
        </div>

        {metrics && metrics.accuracy !== undefined ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Accuracy</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {(metrics.accuracy * 100).toFixed(1)}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Precision</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--saffron)' }}>
                  {(metrics.precision * 100).toFixed(1)}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recall</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--chakra-blue)' }}>
                  {(metrics.recall * 100).toFixed(1)}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>F1-Score</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)' }}>
                  {(metrics.f1_score * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Model Architecture Details
                </h4>
                <ul style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  <li><strong>Architecture:</strong> {metrics.model_name || 'MobileNetV2 Transfer Learning'}</li>
                  <li><strong>Test Dataset Source:</strong> {metrics.test_csv_source || 'dataset/test.csv'}</li>
                  <li><strong>Evaluated Test Samples:</strong> {metrics.total_test_samples || 36} unseen images</li>
                  <li><strong>Training Output:</strong> <code>backend/ai/model/garbage_clean_model.pth</code></li>
                </ul>
              </div>

              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Confusion Matrix
                </h4>
                <img
                  src="/api/ai/evaluation/confusion_matrix.png"
                  alt="Confusion Matrix"
                  style={{ maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Model evaluation metrics are loading or pending evaluation. Run <code>python backend/ai/train.py</code> to regenerate metrics.
          </div>
        )}
      </div>
    </div>
  );
}

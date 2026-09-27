import React from 'react';
import { ShieldCheck, MapPin, CheckCircle2, HeartHandshake } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      background: 'var(--bg-surface)',
      padding: '40px 0 24px 0',
      marginTop: '60px',
      transition: 'background 0.3s ease, border-color 0.3s ease'
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginBottom: '30px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #FF9933, #138808)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={20} color="#ffffff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>AI Se Swachh Bharat</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              A unified civic cleanliness platform empowering citizens and municipal teams to maintain clean, hygienic public spaces across India.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '12px', fontSize: '0.95rem', fontWeight: 700 }}>Civic Reporting Guide</h4>
            <ul style={{ listStyle: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={14} color="var(--primary)" /> Capture clear photo or video evidence
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} color="var(--saffron)" /> Enable location or manually enter location
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HeartHandshake size={14} color="var(--secondary)" /> Municipal sanitation team takes cleaning action
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '12px', fontSize: '0.95rem', fontWeight: 700 }}>Cleaning Workflow</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              REPORT &rarr; VERIFY &rarr; ASSIGN &rarr; CLEAN &rarr; RESOLVE
            </p>
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              AI verification works in the background to ensure genuine municipal routing.
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.8rem'
        }}>
          &copy; {new Date().getFullYear()} AI Se Swachh Bharat. Empowering Clean Cities & Communities Across India.
        </div>

      </div>
    </footer>
  );
}

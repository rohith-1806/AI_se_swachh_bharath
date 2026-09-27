import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Video, MapPin, Send, CheckCircle2, ShieldCheck, ArrowRight, HeartHandshake } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section style={{
        padding: '70px 0 50px 0',
        textAlign: 'center',
        background: 'radial-gradient(circle at top, rgba(230, 81, 0, 0.08) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 80%)',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          {/* Subtle Indian Civic Badge */}
          <div className="tricolour-badge" style={{ marginBottom: '24px' }}>
            <ShieldCheck size={16} /> Swachh Bharat Civic Cleanliness Initiative
          </div>

          {/* Primary Heading */}
          <h1 className="hero-title" style={{ fontSize: '3.2rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px', letterSpacing: '-1px', color: 'var(--text-main)' }}>
            Let's Make Swachh Bharat Together
          </h1>

          {/* Primary Message */}
          <h2 className="hero-subtitle" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px' }}>
            Upload a photo and help your municipality take action.
          </h2>

          {/* Supporting Text */}
          <p className="hero-text" style={{ fontSize: '1.15rem', color: 'var(--text-muted)', marginBottom: '36px', lineHeight: 1.6, maxWidth: '780px', margin: '0 auto 36px auto' }}>
            Report significant garbage accumulation in your area. Our AI verifies the complaint and helps route genuine issues for cleaning action.
          </p>


          {/* Action CTAs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <Link to="/report" className="btn btn-primary btn-mobile-full" style={{ padding: '14px 32px', fontSize: '1.05rem' }}>
              <Camera size={20} />
              Upload a Photo & Report
            </Link>
            <Link to="/report?type=video" className="btn btn-secondary btn-mobile-full" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              <Video size={20} color="var(--primary)" />
              Upload Video
            </Link>
          </div>

          {/* Background AI Trust Statement */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: '10px 20px',
            borderRadius: '40px',
            fontSize: '0.875rem',
            color: 'var(--text-muted)'
          }}>
            <CheckCircle2 size={16} color="var(--primary)" />
            <span>AI-powered verification helps identify genuine garbage accumulation and reduce false complaints.</span>
          </div>
        </div>
      </section>

      {/* 4-Step Simple Civic Response Flow */}
      <section style={{ padding: '50px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-main)' }}>
              How It Works
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              You report it. AI verifies it. Your municipality takes action.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              {
                stepNum: '1',
                icon: Camera,
                title: 'Take / Upload a Photo',
                desc: 'Upload a photo or video showing garbage accumulation on roads or public spaces.',
                color: 'var(--saffron)'
              },
              {
                stepNum: '2',
                icon: MapPin,
                title: 'Add Location',
                desc: 'Use your current GPS location or specify the landmark location.',
                color: 'var(--chakra-blue)'
              },
              {
                stepNum: '3',
                icon: Send,
                title: 'Submit Complaint',
                desc: 'Enter your contact details and submit. Our backend AI verifies the report.',
                color: 'var(--primary)'
              },
              {
                stepNum: '4',
                icon: CheckCircle2,
                title: 'Municipal Cleaning Action',
                desc: 'Municipal cleaning teams are dispatched to clean the reported area.',
                color: 'var(--primary)'
              },
            ].map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <div key={idx} className="glass-card" style={{ padding: '28px', position: 'relative' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: step.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent size={22} />
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dim)', opacity: 0.6 }}>
                      0{step.stepNum}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Citizen Promise Banner */}
      <section style={{ padding: '40px 0 60px 0' }}>
        <div className="container">
          <div className="glass-panel" style={{
            padding: '36px',
            background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-card) 100%)',
            borderLeft: '4px solid var(--saffron)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'var(--saffron-bg)',
                color: 'var(--saffron)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <HeartHandshake size={28} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Clean Cities Start With Active Citizens
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Every verified report helps local municipal corporations assign sanitation resources efficiently and maintain hygienic surroundings.
                </p>
              </div>
              <Link to="/report" className="btn btn-green" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
                Report Garbage Now <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

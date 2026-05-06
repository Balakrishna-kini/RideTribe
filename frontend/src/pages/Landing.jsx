import React from 'react'
import { Link } from 'react-router-dom'
import { FiMapPin, FiUsers, FiShield, FiNavigation, FiCamera, FiArrowRight, FiChevronRight } from 'react-icons/fi'
import Logo from '../components/Logo'
import Navbar from '../components/Navbar'

const features = [
  { icon: FiMapPin, title: 'Plan Routes', desc: 'Create and share scenic riding routes with turn-by-turn navigation.' },
  { icon: FiUsers, title: 'Ride Together', desc: 'Find riders in your area. Join group rides and build your tribe.' },
  { icon: FiNavigation, title: 'Live Tracking', desc: 'Real-time GPS tracking keeps your group connected on every ride.' },
  { icon: FiShield, title: 'Ride Safe', desc: 'Lag detection alerts if any rider falls behind the group.' },
  { icon: FiCamera, title: 'Ride Memories', desc: 'Capture and share photos from your adventures with the crew.' },
]

const stats = [
  { value: '50K+', label: 'Active Riders' },
  { value: '12K+', label: 'Rides Completed' },
  { value: '500+', label: 'Routes Mapped' },
  { value: '100+', label: 'Cities' },
]

const Landing = () => {
  return (
    <div className="landing-page">
      <Navbar onToggleSidebar={() => {}} />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-effects">
          <div className="hero-glow hero-glow-1"></div>
          <div className="hero-glow hero-glow-2"></div>
          <div className="hero-grid"></div>
        </div>
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center min-vh-100">
            <div className="col-lg-7">
              <div className="hero-content animate-fadeInUp">
                <span className="hero-badge">
                  <span className="badge-dot"></span>
                  Now in 100+ cities across India
                </span>
                <h1 className="hero-title">
                  Connect. Navigate.
                  <br />
                  <span className="text-accent">Ride Smarter.</span>
                </h1>
                <p className="hero-subtitle">
                  The ultimate platform for motorcycle enthusiasts. Plan rides, track your crew in real-time, and build unforgettable memories on the road.
                </p>
                <div className="hero-cta">
                  <Link to="/signup" className="btn btn-primary btn-lg px-4 me-3">
                    Get Started Free <FiArrowRight className="ms-2" />
                  </Link>
                  <Link to="/discover" className="btn btn-outline-primary btn-lg px-4">
                    Explore Rides
                  </Link>
                </div>
                <div className="hero-stats">
                  {stats.map((stat, i) => (
                    <div key={i} className="hero-stat">
                      <div className="hero-stat-value">{stat.value}</div>
                      <div className="hero-stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-block">
              <div className="hero-visual animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                <div className="hero-phone">
                  <div className="phone-screen">
                    <div className="phone-header">
                      <Logo size="small" />
                    </div>
                    <div className="phone-map">
                      <div className="map-route"></div>
                      <div className="map-marker map-marker-1">
                        <FiMapPin />
                      </div>
                      <div className="map-marker map-marker-2">
                        <FiMapPin />
                      </div>
                      <div className="rider-dot rider-dot-1"></div>
                      <div className="rider-dot rider-dot-2"></div>
                      <div className="rider-dot rider-dot-3"></div>
                    </div>
                    <div className="phone-bottom-bar">
                      <span>Live Tracking</span>
                      <span className="live-badge">● LIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Everything you need for the perfect ride</h2>
            <p className="section-subtitle">From planning to execution, RiderTribe has you covered</p>
          </div>
          <div className="row g-4">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div className="col-md-6 col-lg-4" key={i}>
                  <div className="feature-card animate-fadeInUp" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="feature-icon">
                      <Icon size={24} />
                    </div>
                    <h3 className="feature-title">{f.title}</h3>
                    <p className="feature-desc">{f.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container text-center">
          <div className="cta-card">
            <Logo size="large" />
            <h2 className="cta-title mt-4">Ready to join the tribe?</h2>
            <p className="cta-subtitle">
              Start your journey today. Free forever for riders.
            </p>
            <Link to="/signup" className="btn btn-primary btn-lg px-5 mt-3">
              Create Account <FiChevronRight className="ms-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-4">
              <Logo size="small" />
            </div>
            <div className="col-md-4 text-center">
              <p className="footer-text">© 2026 RiderTribe. All rights reserved.</p>
            </div>
            <div className="col-md-4 text-end">
              <div className="footer-links">
                <Link to="#">Privacy</Link>
                <Link to="#">Terms</Link>
                <Link to="#">Contact</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .landing-page {
          overflow-x: hidden;
        }
        /* Hero */
        .hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding-top: var(--navbar-height);
        }
        .hero-bg-effects {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .hero-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
        }
        .hero-glow-1 {
          width: 600px;
          height: 600px;
          background: rgba(255,107,0,0.12);
          top: -200px;
          right: -100px;
        }
        .hero-glow-2 {
          width: 400px;
          height: 400px;
          background: rgba(255,107,0,0.06);
          bottom: -100px;
          left: -100px;
        }
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,107,0,0.1);
          border: 1px solid rgba(255,107,0,0.2);
          border-radius: 50px;
          padding: 6px 16px;
          font-size: 0.8rem;
          color: var(--primary);
          margin-bottom: 1.5rem;
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
          animation: pulse 2s infinite;
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }
        .hero-subtitle {
          font-size: 1.15rem;
          color: var(--text-secondary);
          max-width: 540px;
          margin-bottom: 2rem;
          line-height: 1.7;
        }
        .hero-cta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 3rem;
        }
        .hero-stats {
          display: flex;
          gap: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-color);
        }
        .hero-stat-value {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary);
        }
        .hero-stat-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        /* Hero Phone Mockup */
        .hero-visual {
          display: flex;
          justify-content: center;
        }
        .hero-phone {
          width: 280px;
          height: 500px;
          background: var(--bg-surface);
          border: 2px solid var(--border-light);
          border-radius: 32px;
          padding: 16px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 40px rgba(255,107,0,0.1);
          position: relative;
        }
        .phone-screen {
          width: 100%;
          height: 100%;
          border-radius: 20px;
          background: var(--bg-dark);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .phone-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .phone-map {
          flex: 1;
          background: #1a1a2e;
          position: relative;
          overflow: hidden;
        }
        .map-route {
          position: absolute;
          top: 30%;
          left: 15%;
          width: 70%;
          height: 40%;
          border: 2px dashed var(--primary);
          border-radius: 40% 60% 50% 30%;
          opacity: 0.6;
          animation: glow 3s infinite;
        }
        .map-marker {
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 12px;
        }
        .map-marker-1 { top: 25%; left: 15%; }
        .map-marker-2 { bottom: 25%; right: 15%; }
        .rider-dot {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 8px var(--success);
          animation: pulse 2s infinite;
        }
        .rider-dot-1 { top: 40%; left: 35%; }
        .rider-dot-2 { top: 50%; left: 50%; animation-delay: 0.5s; }
        .rider-dot-3 { top: 55%; left: 45%; animation-delay: 1s; }
        .phone-bottom-bar {
          padding: 10px 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .live-badge {
          color: var(--success);
          font-weight: 700;
          animation: pulse 2s infinite;
        }

        /* Features */
        .features-section {
          padding: 6rem 0;
          background: var(--bg-surface);
        }
        .section-badge {
          display: inline-block;
          background: rgba(255,107,0,0.1);
          color: var(--primary);
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 4px 14px;
          border-radius: 50px;
          margin-bottom: 1rem;
        }
        .section-title {
          font-size: 2.25rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }
        .section-subtitle {
          color: var(--text-secondary);
          font-size: 1.05rem;
        }
        .feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 2rem;
          height: 100%;
          transition: all var(--transition-normal);
        }
        .feature-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-glow);
          transform: translateY(-4px);
        }
        .feature-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          background: rgba(255,107,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          margin-bottom: 1.25rem;
        }
        .feature-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .feature-desc {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.6;
        }

        /* CTA */
        .cta-section {
          padding: 6rem 0;
        }
        .cta-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 4rem;
          position: relative;
          overflow: hidden;
        }
        .cta-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 400px;
          height: 400px;
          background: rgba(255,107,0,0.06);
          border-radius: 50%;
          filter: blur(80px);
        }
        .cta-title {
          font-size: 2rem;
          font-weight: 800;
        }
        .cta-subtitle {
          color: var(--text-secondary);
          font-size: 1.05rem;
        }

        /* Footer */
        .landing-footer {
          padding: 2rem 0;
          border-top: 1px solid var(--border-color);
        }
        .footer-text {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin: 0;
        }
        .footer-links {
          display: flex;
          gap: 1.5rem;
          justify-content: flex-end;
        }
        .footer-links a {
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .footer-links a:hover {
          color: var(--primary);
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
          .hero-stats { gap: 1.2rem; flex-wrap: wrap; }
          .hero-stat-value { font-size: 1.2rem; }
          .cta-card { padding: 2rem; }
          .section-title { font-size: 1.75rem; }
          .footer-links { justify-content: center; margin-top: 1rem; }
        }
      `}</style>
    </div>
  )
}

export default Landing

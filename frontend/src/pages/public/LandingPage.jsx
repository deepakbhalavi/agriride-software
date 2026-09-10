import React from 'react'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#16a34a,#22c55e)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌾</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>AgriRide</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/how-it-works" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>How It Works</Link>
          <Link to="/login"    className="btn btn-secondary btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div>
          <div className="hero-badge">🚜 MCA Research Project · Demo Dataset</div>
          <h1>Smart Shared Transport<br />for Farmers</h1>
          <p>
            Stop paying full vehicle costs alone. AgriRide matches farmers
            going to the same market and creates a shared trip — cutting costs,
            reducing vehicles on roads, and ensuring timely delivery.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">🌾 Register as Farmer</Link>
            <Link to="/how-it-works" className="btn btn-secondary btn-lg">Learn How It Works</Link>
          </div>

          {/* Mini Stats */}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
            {[
              { label: 'Cost Reduction', value: '~40%', icon: '💰' },
              { label: 'Fewer Vehicles', value: '~60%', icon: '🚛' },
              { label: 'Matching Algorithm', value: 'Rule-Based', icon: '🧮' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-light)', fontFamily: 'var(--font-display)' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label} (Demo Data)</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Overview */}
      <section style={{ padding: '80px var(--space-xl)', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="hero-badge" style={{ marginBottom: 16 }}>Core Workflow</div>
          <h2 style={{ marginBottom: 48 }}>From Booking to Delivered</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
            {[
              { step: '01', title: 'Create Booking', desc: 'Submit produce type, quantity, pickup location & time window', icon: '📋' },
              { step: '02', title: 'Smart Matching', desc: 'Rule-based engine groups compatible farmers by destination, proximity & time', icon: '🔍' },
              { step: '03', title: 'Shared Trip', desc: 'Optimal vehicle selected, route optimized, cost divided fairly', icon: '🗺️' },
              { step: '04', title: 'Driver Pickup', desc: 'Driver accepts, follows optimized route, collects all produce', icon: '🚛' },
              { step: '05', title: 'Delivered', desc: 'Produce reaches market. Each farmer pays only their fair share.', icon: '✅' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div style={{ textAlign: 'center', width: 140, padding: '0 8px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-primary-faint)', border: '2px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 12px' }}>{s.icon}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 700, letterSpacing: 1 }}>STEP {s.step}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0' }}>{s.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                </div>
                {i < 4 && <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', flexShrink: 0 }}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <div className="feature-grid">
        {[
          { icon: '🧮', title: 'Rule-Based Matching', desc: 'Transparent algorithm checks destination, proximity, time windows, and capacity. No black-box ML.' },
          { icon: '📍', title: 'Haversine Distance', desc: 'Geographic distance calculated using the Haversine formula. Nearest-neighbor route optimization.' },
          { icon: '💰', title: 'Proportional Cost Sharing', desc: 'Farmer cost = (Farmer qty / Total qty) × Total trip cost. Fully transparent calculation.' },
          { icon: '🚛', title: 'Vehicle Capacity Check', desc: 'Total load must not exceed vehicle capacity. No overloaded trips — ever.' },
          { icon: '👨‍💼', title: 'Driver Acceptance', desc: 'Drivers view trip details, total load, route, and estimated earnings before accepting.' },
          { icon: '⚙️', title: 'Admin Configuration', desc: 'All matching weights, thresholds, and cost parameters are configurable by admin.' },
        ].map(f => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3 style={{ marginBottom: 8 }}>{f.title}</h3>
            <p style={{ fontSize: '0.875rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Roles */}
      <section style={{ padding: '80px var(--space-xl)', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 48 }}>Three Roles, One Platform</h2>
          <div className="grid-3" style={{ gap: 24 }}>
            {[
              { role: 'Farmer', icon: '🌾', color: '#16a34a', desc: 'Create bookings, find shared trips, track your produce, make payments', link: '/register' },
              { role: 'Driver', icon: '🚛', color: '#3b82f6', desc: 'Register vehicle, view available shared trips, accept and complete trips', link: '/register' },
              { role: 'Admin',  icon: '👔', color: '#ef4444', desc: 'Monitor platform, configure matching engine, manage users, view research metrics', link: '/login' },
            ].map(r => (
              <div key={r.role} className="card" style={{ textAlign: 'center', borderColor: `${r.color}33` }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{r.icon}</div>
                <h3 style={{ color: r.color, marginBottom: 8 }}>{r.role}</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: 16 }}>{r.desc}</p>
                <Link to={r.link} className="btn btn-secondary btn-sm">
                  {r.role === 'Admin' ? 'Admin Login' : `Join as ${r.role}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px var(--space-xl)', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#16a34a,#22c55e)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌾</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>AgriRide</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          MCA Research Project · Smart Shared Transportation Scheduling for Farmers
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
          All demo data is simulated for research demonstration purposes only.
        </p>
      </footer>
    </div>
  )
}

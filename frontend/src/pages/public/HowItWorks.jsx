import React from 'react'
import { Link } from 'react-router-dom'

export default function HowItWorks() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-xl)' }}>
        <Link to="/" style={{ color: 'var(--color-primary-light)', fontSize: '0.875rem' }}>← Back to Home</Link>
        <h1 style={{ marginTop: 24, marginBottom: 8 }}>How AgriRide Works</h1>
        <p style={{ marginBottom: 48, color: 'var(--text-muted)' }}>
          A transparent, rule-based system for shared agricultural transportation.
        </p>

        {/* Matching Algorithm */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16, color: 'var(--color-primary-light)' }}>🧮 Matching Algorithm</h2>
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            ℹ️ This system uses a <strong>rule-based algorithm</strong>, not machine learning.
            All matching criteria are transparent and explainable.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { step: '1', title: 'Destination Compatibility (30%)', desc: 'Checks if farmers are going to the same market or within the configured destination radius.' },
              { step: '2', title: 'Geographic Proximity (25%)', desc: 'Uses Haversine formula to calculate distance between pickup points. Must be within max_pickup_distance_km.' },
              { step: '3', title: 'Time Window Overlap (20%)', desc: 'Checks that all pickup time windows have sufficient overlap (≥ min_time_overlap_min).' },
              { step: '4', title: 'Capacity Check (25%)', desc: 'Total quantity must not exceed available vehicle capacity. Overloaded trips are rejected.' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--bg-elevated)', borderRadius: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-primary-light)', flexShrink: 0 }}>{s.step}</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Formula */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16, color: 'var(--color-accent)' }}>💰 Cost Calculation</h2>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20, fontFamily: 'monospace', marginBottom: 16 }}>
            <div style={{ color: 'var(--color-primary-light)' }}>Total Cost = Base Vehicle Cost + (Distance × Cost/km) + Handling Cost</div>
            <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>Example: ₹500 + (40km × ₹20) + ₹200 = ₹1,500</div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20, fontFamily: 'monospace' }}>
            <div style={{ color: 'var(--color-accent)' }}>Farmer Share = (Farmer Quantity / Total Quantity) × Total Cost</div>
            <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>Farmer A (300/750): 40% → ₹960</div>
            <div style={{ color: 'var(--text-muted)' }}>Farmer B (200/750): 27% → ₹640</div>
            <div style={{ color: 'var(--text-muted)' }}>Farmer C (250/750): 33% → ₹800</div>
          </div>
        </div>

        {/* Route Optimization */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16, color: 'var(--color-info)' }}>🗺️ Route Optimization</h2>
          <div className="alert alert-warning" style={{ marginBottom: 12 }}>
            ⚠️ Current implementation uses <strong>Nearest-Neighbor Heuristic (Baseline)</strong>.
            The architecture is designed to support OR-Tools VRPTW in future versions.
          </div>
          <p>The nearest-neighbor algorithm starts from the vehicle's current location and repeatedly selects the closest unvisited pickup point. This provides a reasonable route but does not guarantee global optimality.</p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/register" className="btn btn-primary btn-lg" style={{ marginRight: 16 }}>Get Started</Link>
          <Link to="/login"    className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { tripAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import TripStatusStepper from '../../components/TripStatusStepper'

export default function TripTracking() {
  const [trips, setTrips]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tripAPI.getAll().then(r => {
      const active = r.data.filter(t =>
        ['DRIVER_ACCEPTED', 'PICKUP_IN_PROGRESS', 'IN_TRANSIT'].includes(t.status)
      )
      setTrips(active)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip Tracking</h1>
          <p className="page-subtitle">Track your active shared trips in real-time</p>
        </div>
      </div>
      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        📍 <strong>DEMO MODE</strong> — Real-time GPS tracking would be integrated in production with a map provider.
        Status updates are reflected as the driver updates the trip progress.
      </div>
      {!trips.length ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <h3>No active trips</h3>
          <p>Your trips will appear here once a driver has accepted and started the journey.</p>
        </div>
      ) : (
        trips.map(t => (
          <div key={t.id} className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Trip #{t.id} → {t.destination_name}</h3>
              <StatusBadge status={t.status} />
            </div>
            <TripStatusStepper status={t.status} />
            <div style={{ marginTop: 20, padding: 20, background: 'var(--bg-elevated)', borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem' }}>🗺️</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 8 }}>
                [DEMO MODE – Map visualization would appear here with live GPS tracking]
              </div>
              <div style={{ marginTop: 12 }}>
                <span className="badge badge-assigned animate-pulse">📍 Live location updates via Map API</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              <div><div className="stat-label">Total Load</div><div style={{ fontWeight: 600 }}>{t.total_load_kg} kg</div></div>
              <div><div className="stat-label">Distance</div><div style={{ fontWeight: 600 }}>{t.total_distance_km} km</div></div>
              <div><div className="stat-label">Date</div><div style={{ fontWeight: 600 }}>{t.scheduled_date}</div></div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

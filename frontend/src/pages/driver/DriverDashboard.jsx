import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { driverAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'

export default function DriverDashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    driverAPI.getDashboard()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /><p>Loading...</p></div>

  const CARDS = [
    { label: 'Available Trips',   value: stats?.available_trips ?? 0,  icon: '📦', color: '#f59e0b' },
    { label: 'Active Trips',      value: stats?.accepted_trips ?? 0,   icon: '🚛', color: '#3b82f6' },
    { label: 'Completed Trips',   value: stats?.completed_trips ?? 0,  icon: '✅', color: '#10b981' },
    { label: "Today's Load",      value: `${stats?.today_load_kg ?? 0} kg`, icon: '⚖️', color: '#8b5cf6' },
    { label: 'Total Earnings',    value: `₹${stats?.total_earnings ?? 0}`, icon: '💰', color: '#f59e0b' },
    { label: 'Rating',            value: `⭐ ${stats?.rating ?? 5.0}`,  icon: '⭐', color: '#fbbf24' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver Dashboard</h1>
          <p className="page-subtitle">
            Status: {stats?.is_available
              ? <span style={{ color: 'var(--color-success)' }}>🟢 Available</span>
              : <span style={{ color: 'var(--color-danger)' }}>🔴 Unavailable</span>}
          </p>
        </div>
        <Link to="/driver/trips" className="btn btn-primary btn-lg">📦 View Available Trips</Link>
      </div>

      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {CARDS.map(c => (
          <div key={c.label} className="stat-card" style={{ '--stat-accent': c.color, '--stat-bg': `${c.color}20` }}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Link to="/driver/trips"    className="btn btn-primary">📦 Available Trips</Link>
        <Link to="/driver/vehicle"  className="btn btn-secondary">🚛 My Vehicle</Link>
        <Link to="/driver/earnings" className="btn btn-secondary">💰 Earnings</Link>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Trips</h3>
          <Link to="/driver/history" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        {!stats?.recent_trips?.length ? (
          <div className="empty-state">
            <div className="empty-icon">🚛</div>
            <h3>No trips yet</h3>
            <p>Check available trips and start accepting shared transportation requests.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Destination</th>
                  <th>Load</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_trips.map(t => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    <td>📍 {t.destination}</td>
                    <td>{t.load_kg} kg</td>
                    <td>{t.date}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
                      {t.cost ? `₹${t.cost}` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

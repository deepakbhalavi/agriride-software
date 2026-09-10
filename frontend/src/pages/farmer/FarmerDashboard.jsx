import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { farmerAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'

export default function FarmerDashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    farmerAPI.getDashboard()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p>Loading dashboard...</p>
    </div>
  )

  const CARDS = [
    { label: 'Total Bookings',     value: stats?.total_bookings ?? 0,   icon: '📋', color: '#3b82f6',  accent: '#1e3a8a' },
    { label: 'Active Bookings',    value: stats?.active_bookings ?? 0,  icon: '🔄', color: '#f59e0b',  accent: '#78350f' },
    { label: 'Matched Trips',      value: stats?.matched_bookings ?? 0, icon: '✅', color: '#8b5cf6',  accent: '#4c1d95' },
    { label: 'Completed Trips',    value: stats?.completed_bookings ?? 0,icon: '✔️', color: '#10b981', accent: '#064e3b' },
    { label: 'Total Cost Paid',    value: `₹${stats?.total_cost_paid ?? 0}`, icon: '💰', color: '#f59e0b', accent: '#78350f' },
    { label: 'Notifications',      value: stats?.unread_notifications ?? 0, icon: '🔔', color: '#ef4444', accent: '#7f1d1d' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Farmer Dashboard</h1>
          <p className="page-subtitle">Manage your transportation bookings and track your produce</p>
        </div>
        <Link to="/farmer/create-booking" className="btn btn-primary btn-lg">
          ➕ New Booking
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {CARDS.map(c => (
          <div key={c.label} className="stat-card" style={{ '--stat-accent': c.color, '--stat-bg': `${c.color}20` }}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/farmer/create-booking" className="btn btn-primary">➕ Create Booking</Link>
          <Link to="/farmer/find-transport" className="btn btn-secondary">🔍 Find Shared Transport</Link>
          <Link to="/farmer/bookings"       className="btn btn-secondary">📋 My Bookings</Link>
          <Link to="/farmer/payment"        className="btn btn-secondary">💳 Payments</Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Bookings</h3>
          <Link to="/farmer/bookings" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        {!stats?.recent_bookings?.length ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No bookings yet</h3>
            <p>Create your first transportation booking to get started.</p>
            <Link to="/farmer/create-booking" className="btn btn-primary">Create Booking</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Produce</th>
                  <th>Quantity</th>
                  <th>Destination</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{b.id}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>🌿 {b.produce}</td>
                    <td>{b.quantity} kg</td>
                    <td>📍 {b.destination}</td>
                    <td>{b.date}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
                      {b.allocated_cost ? `₹${b.allocated_cost}` : '–'}
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

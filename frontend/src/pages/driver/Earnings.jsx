import React, { useState, useEffect } from 'react'
import { tripAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'

export default function Earnings() {
  const [trips, setTrips]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tripAPI.getAll().then(r => {
      const myTrips = r.data.filter(t => ['DELIVERED', 'IN_TRANSIT', 'PICKUP_IN_PROGRESS', 'DRIVER_ACCEPTED'].includes(t.status))
      setTrips(myTrips)
    }).finally(() => setLoading(false))
  }, [])

  const completed = trips.filter(t => t.status === 'DELIVERED')
  const totalEarned = completed.reduce((s, t) => s + (t.total_cost || 0), 0)
  const avgPerTrip  = completed.length ? totalEarned / completed.length : 0

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Earnings</h1>
      </div>

      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total Earned',    value: `₹${Math.round(totalEarned)}`,   icon: '💰', color: '#10b981' },
          { label: 'Trips Completed', value: completed.length,                icon: '✅', color: '#3b82f6' },
          { label: 'Avg per Trip',    value: `₹${Math.round(avgPerTrip)}`,    icon: '📊', color: '#8b5cf6' },
          { label: 'Pending Trips',   value: trips.length - completed.length, icon: '🔄', color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ '--stat-accent': c.color, '--stat-bg': `${c.color}20` }}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Earnings History</h3>
        {!trips.length ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No earnings yet</h3>
            <p>Accept and complete trips to see your earnings here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Destination</th>
                  <th>Load</th>
                  <th>Distance</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(t => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    <td>{t.destination_name}</td>
                    <td>{t.total_load_kg} kg</td>
                    <td>{t.total_distance_km} km</td>
                    <td>{t.scheduled_date}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td style={{ fontWeight: 700, color: t.status === 'DELIVERED' ? 'var(--color-success)' : 'var(--text-muted)' }}>
                      ₹{t.total_cost}
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

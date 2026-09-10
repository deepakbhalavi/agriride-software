import React, { useState, useEffect } from 'react'
import { bookingAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'

export default function FarmerHistory() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    bookingAPI.getMy().then(r => {
      const done = r.data.filter(b => ['DELIVERED', 'CANCELLED'].includes(b.status))
      setBookings(done)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  const totalSaved = bookings
    .filter(b => b.status === 'DELIVERED' && b.allocated_cost)
    .reduce((s, b) => s + (b.allocated_cost * 0.4), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Booking History</h1>
          <p className="page-subtitle">{bookings.length} completed/cancelled bookings</p>
        </div>
      </div>

      {bookings.filter(b => b.status === 'DELIVERED').length > 0 && (
        <div className="card" style={{ marginBottom: 24, background: 'rgba(22,163,74,0.08)', borderColor: 'rgba(22,163,74,0.3)' }}>
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <div className="stat-label">Completed Trips</div>
              <div className="stat-value">{bookings.filter(b => b.status === 'DELIVERED').length}</div>
            </div>
            <div>
              <div className="stat-label">Estimated Savings (Demo)</div>
              <div className="stat-value" style={{ color: 'var(--color-success)' }}>₹{Math.round(totalSaved)}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
            * Savings estimated at ~40% compared to individual booking. Demo value only.
          </div>
        </div>
      )}

      {!bookings.length ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No history yet</h3>
          <p>Completed and cancelled bookings will appear here.</p>
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
                <th>Cost Paid</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{b.id}</td>
                  <td>🌿 {b.produce_type}</td>
                  <td>{b.quantity_kg} kg</td>
                  <td>{b.destination_name}</td>
                  <td>{b.preferred_date}</td>
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
  )
}

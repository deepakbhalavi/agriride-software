import React, { useState, useEffect } from 'react'
import { bookingAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('ALL')

  useEffect(() => {
    bookingAPI.getAll().then(r => setBookings(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter)

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Bookings</h1>
          <p className="page-subtitle">{bookings.length} total bookings</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['ALL', 'REQUESTED', 'MATCHED', 'DRIVER_ASSIGNED', 'DELIVERED', 'CANCELLED'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Farmer</th>
              <th>Produce</th>
              <th>Qty (kg)</th>
              <th>Pickup Location</th>
              <th>Destination</th>
              <th>Date</th>
              <th>Time Window</th>
              <th>Status</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id}>
                <td>#{b.id}</td>
                <td>F#{b.farmer_id}</td>
                <td>🌿 {b.produce_type}</td>
                <td>{b.quantity_kg}</td>
                <td>{b.pickup_location_name}</td>
                <td>{b.destination_name}</td>
                <td>{b.preferred_date}</td>
                <td style={{ fontSize: '0.8rem' }}>{b.earliest_pickup_time}–{b.latest_pickup_time}</td>
                <td><StatusBadge status={b.status} /></td>
                <td style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
                  {b.allocated_cost ? `₹${b.allocated_cost}` : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

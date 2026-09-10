import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bookingAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [cancelling, setCancelling] = useState(null)
  const navigate = useNavigate()

  const load = () => {
    bookingAPI.getMy()
      .then(r => setBookings(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    setCancelling(id)
    try {
      await bookingAPI.cancel(id)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Cannot cancel this booking')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /><p>Loading bookings...</p></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">{bookings.length} booking{bookings.length !== 1 ? 's' : ''} total</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/farmer/find-transport" className="btn btn-accent">🔍 Find Shared Transport</Link>
          <Link to="/farmer/create-booking" className="btn btn-primary">➕ New Booking</Link>
        </div>
      </div>

      {!bookings.length ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No bookings yet</h3>
          <p>Create your first transportation booking to get started with AgriRide.</p>
          <Link to="/farmer/create-booking" className="btn btn-primary">Create First Booking</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bookings.map(b => (
            <div key={b.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.875rem' }}>#{b.id}</span>
                    <h3 style={{ margin: 0 }}>🌿 {b.produce_type}</h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                    <Info icon="⚖️" label="Quantity"    value={`${b.quantity_kg} kg`} />
                    <Info icon="📍" label="Pickup"      value={b.pickup_location_name} />
                    <Info icon="🏪" label="Destination" value={b.destination_name} />
                    <Info icon="📅" label="Date"        value={b.preferred_date} />
                    <Info icon="⏰" label="Time Window" value={`${b.earliest_pickup_time} – ${b.latest_pickup_time}`} />
                    {b.allocated_cost && <Info icon="💰" label="My Cost" value={`₹${b.allocated_cost}`} highlight />}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {b.status === 'MATCHED' || b.status === 'DRIVER_ASSIGNED' || b.status === 'DRIVER_ACCEPTED' ? (
                    <Link to="/farmer/find-transport" className="btn btn-secondary btn-sm">👁 View Trip</Link>
                  ) : null}
                  {b.allocated_cost && b.status !== 'CANCELLED' ? (
                    <Link to="/farmer/payment" className="btn btn-accent btn-sm">💳 Pay ₹{b.allocated_cost}</Link>
                  ) : null}
                  {b.status === 'REQUESTED' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(b.id)}
                      disabled={cancelling === b.id}
                    >
                      {cancelling === b.id ? '...' : '❌ Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Info({ icon, label, value, highlight }) {
  return (
    <div>
      <div className="stat-label">{icon} {label}</div>
      <div style={{ fontWeight: 500, color: highlight ? 'var(--color-primary-light)' : 'var(--text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tripAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import TripStatusStepper from '../../components/TripStatusStepper'
import RouteVisualization from '../../components/RouteVisualization'

export default function DriverTripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing]   = useState(false)

  const load = () => tripAPI.getById(id).then(r => setTrip(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [id])

  const handleAccept = async () => {
    setActing(true)
    try {
      await tripAPI.accept(id)
      load()
    } finally {
      setActing(false)
    }
  }

  const handleStatus = async (s) => {
    setActing(true)
    try {
      await tripAPI.updateStatus(id, s)
      load()
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>
  if (!trip) return <div className="empty-state"><h3>Trip not found</h3></div>

  const isPending  = trip.status === 'DRIVER_ASSIGNED' || trip.status === 'MATCHED'
  const isAccepted = trip.status === 'DRIVER_ACCEPTED'
  const isPickup   = trip.status === 'PICKUP_IN_PROGRESS'
  const isTransit  = trip.status === 'IN_TRANSIT'

  return (
    <div>
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/driver/trips')}>← Back</button>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Trip #{trip.id}</h1>
          <StatusBadge status={trip.status} />
        </div>
      </div>

      <TripStatusStepper status={trip.status} />

      <div className="divider" />

      <div className="grid-2" style={{ gap: 24, marginTop: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Trip Summary */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Trip Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: '📍', label: 'Destination',  value: trip.destination_name },
                { icon: '⚖️', label: 'Total Load',   value: `${trip.total_load_kg} kg` },
                { icon: '📏', label: 'Distance',     value: `${trip.total_distance_km} km` },
                { icon: '📅', label: 'Date',         value: trip.scheduled_date },
                { icon: '⏰', label: 'Start Time',   value: trip.estimated_start_time },
                { icon: '💰', label: 'Earnings',     value: `₹${trip.total_cost}` },
                { icon: '🎯', label: 'Match Score',  value: `${trip.compatibility_score}%` },
              ].map(item => (
                <div key={item.label}>
                  <div className="stat-label">{item.icon} {item.label}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Farmers */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Farmers & Pickup Points ({trip.bookings?.length})</h3>
            {trip.bookings?.map((b, i) => (
              <div key={b.booking_id} style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 12, marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>👤 {b.farmer_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  📍 {b.pickup_location} · 🌿 {b.quantity_kg}kg {b.produce_type}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  ⏰ {b.earliest_time} – {b.latest_time} · Pickup #{b.pickup_order}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Route */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>🗺️ Optimized Route</h3>
            <div className="alert alert-info" style={{ marginBottom: 12, fontSize: '0.78rem' }}>
              Baseline Route Optimization – Nearest Neighbor Algorithm
            </div>
            <RouteVisualization pickupSequence={trip.pickup_sequence} destination={trip.destination_name} />
          </div>

          {/* Cost */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>💰 Cost Breakdown</h3>
            <div className="cost-table">
              <div className="cost-row"><span className="cost-label">Base Cost</span><span className="cost-value">₹{trip.base_cost}</span></div>
              <div className="cost-row"><span className="cost-label">Distance Cost</span><span className="cost-value">₹{trip.distance_cost}</span></div>
              <div className="cost-row"><span className="cost-label">Handling</span><span className="cost-value">₹{trip.handling_cost}</span></div>
              <div className="cost-row total"><span>Your Earnings</span><span style={{ color: 'var(--color-success)' }}>₹{trip.total_cost}</span></div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isPending && (
                <>
                  <button id="driver-accept-btn" className="btn btn-primary btn-lg" onClick={handleAccept} disabled={acting}>
                    {acting ? 'Accepting...' : '✅ ACCEPT TRIP'}
                  </button>
                  <button className="btn btn-danger" onClick={() => tripAPI.reject(id).then(() => navigate('/driver/trips'))}>
                    ❌ Reject Trip
                  </button>
                </>
              )}
              {isAccepted && (
                <button className="btn btn-primary btn-lg" onClick={() => handleStatus('PICKUP_IN_PROGRESS')} disabled={acting}>
                  📍 Start Pickup
                </button>
              )}
              {isPickup && (
                <button className="btn btn-primary btn-lg" onClick={() => handleStatus('IN_TRANSIT')} disabled={acting}>
                  🚚 All Collected – In Transit
                </button>
              )}
              {isTransit && (
                <button className="btn btn-accent btn-lg" onClick={() => handleStatus('DELIVERED')} disabled={acting}>
                  ✅ Mark Delivered
                </button>
              )}
              {['DELIVERED', 'CANCELLED'].includes(trip.status) && (
                <div className="alert alert-success">Trip has been {trip.status.toLowerCase()}.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

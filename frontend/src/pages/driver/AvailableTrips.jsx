import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tripAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'

export default function AvailableTrips() {
  const [trips, setTrips]     = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing]   = useState(null)
  const [error, setError]     = useState('')

  const load = () => {
    tripAPI.getAll().then(r => {
      const available = r.data.filter(t =>
        t.status === 'MATCHED' || t.status === 'DRIVER_ASSIGNED' || t.status === 'DRIVER_ACCEPTED' || t.status === 'PICKUP_IN_PROGRESS' || t.status === 'IN_TRANSIT'
      )
      setTrips(available)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAccept = async (id) => {
    setActing(id)
    setError('')
    try {
      await tripAPI.accept(id)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept trip')
    } finally {
      setActing(null)
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this trip?')) return
    setActing(id)
    try {
      await tripAPI.reject(id)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject trip')
    } finally {
      setActing(null)
    }
  }

  const updateStatus = async (id, status) => {
    setActing(id)
    try {
      await tripAPI.updateStatus(id, status)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status')
    } finally {
      setActing(null)
    }
  }

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Shared Trip Requests</h1>
          <p className="page-subtitle">{trips.length} trip(s) available</p>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {!trips.length ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No trips available</h3>
          <p>Shared trip requests will appear here once the matching engine groups farmer bookings.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {trips.map(t => (
            <TripCard key={t.id} trip={t} acting={acting}
              onAccept={handleAccept}
              onReject={handleReject}
              onUpdateStatus={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TripCard({ trip: t, acting, onAccept, onReject, onUpdateStatus }) {
  const isPending  = t.status === 'DRIVER_ASSIGNED' || t.status === 'MATCHED'
  const isAccepted = t.status === 'DRIVER_ACCEPTED'
  const isPickup   = t.status === 'PICKUP_IN_PROGRESS'
  const isTransit  = t.status === 'IN_TRANSIT'

  return (
    <div className="card" style={{ borderColor: isPending ? 'rgba(245,158,11,0.4)' : isAccepted || isPickup || isTransit ? 'rgba(22,163,74,0.4)' : 'var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0 }}>Shared Trip #{t.id}</h3>
            <StatusBadge status={t.status} />
            {isPending && <span className="badge badge-assigned animate-pulse">NEW REQUEST</span>}
          </div>
          <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>📍 Destination: {t.destination_name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
            ₹{t.total_cost}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated earnings</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Info icon="⚖️" label="Total Load"    value={`${t.total_load_kg} kg`} />
        <Info icon="📏" label="Distance"      value={`${t.total_distance_km} km`} />
        <Info icon="📅" label="Date"          value={t.scheduled_date} />
        <Info icon="⏰" label="Start Time"    value={t.estimated_start_time} />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to={`/driver/trip/${t.id}`} className="btn btn-secondary btn-sm">👁 View Details & Route</Link>

        {isPending && (
          <>
            <button id={`accept-btn-${t.id}`} className="btn btn-primary" onClick={() => onAccept(t.id)} disabled={acting === t.id}>
              {acting === t.id ? '...' : '✅ Accept Trip'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => onReject(t.id)} disabled={acting === t.id}>
              ❌ Reject
            </button>
          </>
        )}

        {isAccepted && (
          <button className="btn btn-primary" onClick={() => onUpdateStatus(t.id, 'PICKUP_IN_PROGRESS')} disabled={acting === t.id}>
            📍 Start Pickup
          </button>
        )}
        {isPickup && (
          <button className="btn btn-primary" onClick={() => onUpdateStatus(t.id, 'IN_TRANSIT')} disabled={acting === t.id}>
            🚚 All Collected – Start Transit
          </button>
        )}
        {isTransit && (
          <button className="btn btn-accent" onClick={() => onUpdateStatus(t.id, 'DELIVERED')} disabled={acting === t.id}>
            ✅ Mark Delivered
          </button>
        )}
      </div>
    </div>
  )
}

function Info({ icon, label, value }) {
  return (
    <div>
      <div className="stat-label">{icon} {label}</div>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { tripAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import TripStatusStepper from '../../components/TripStatusStepper'
import RouteVisualization from '../../components/RouteVisualization'

export default function SharedTripDetails() {
  const [trips, setTrips]   = useState([])
  const [selected, setSel]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    tripAPI.getAll().then(r => setTrips(r.data)).finally(() => setLoading(false))
  }, [])

  const loadDetail = (id) => {
    setSel(id)
    tripAPI.getById(id).then(r => setDetail(r.data))
  }

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Shared Trip Details</h1>
          <p className="page-subtitle">View your active and past shared trips</p>
        </div>
      </div>

      {!trips.length ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <h3>No shared trips yet</h3>
          <p>Go to "Find Shared Transport" to run the matching engine.</p>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: 24 }}>
          <div>
            {trips.map(t => (
              <div key={t.id} className="card" style={{ marginBottom: 12, cursor: 'pointer', borderColor: selected === t.id ? 'var(--color-primary)' : 'var(--border-color)' }}
                onClick={() => loadDetail(t.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Trip #{t.id}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>📍 {t.destination_name}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className="tag">⚖️ {t.total_load_kg} kg</span>
                  {t.total_cost && <span className="tag">💰 ₹{t.total_cost}</span>}
                  {t.scheduled_date && <span className="tag">📅 {t.scheduled_date}</span>}
                </div>
              </div>
            ))}
          </div>

          <div>
            {detail ? (
              <div className="card">
                <h3 style={{ marginBottom: 16 }}>Trip #{detail.id} Details</h3>
                <TripStatusStepper status={detail.status} />
                <div className="divider" />
                {detail.driver && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="section-label">Driver Info</div>
                    <div style={{ fontWeight: 600 }}>🚛 {detail.driver.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📞 {detail.driver.phone} · ⭐ {detail.driver.rating}</div>
                  </div>
                )}
                {detail.vehicle && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="section-label">Vehicle</div>
                    <div style={{ fontWeight: 600 }}>🚗 {detail.vehicle.make_model || detail.vehicle.type}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📄 {detail.vehicle.registration}</div>
                  </div>
                )}
                <div className="section-label">Pickup Route</div>
                <RouteVisualization pickupSequence={detail.pickup_sequence} destination={detail.destination_name} />
                <div className="divider" />
                <div className="section-label">Cost Breakdown</div>
                <div className="cost-table">
                  <div className="cost-row"><span className="cost-label">Base Cost</span><span className="cost-value">₹{detail.base_cost}</span></div>
                  <div className="cost-row"><span className="cost-label">Distance ({detail.total_distance_km} km)</span><span className="cost-value">₹{detail.distance_cost}</span></div>
                  <div className="cost-row"><span className="cost-label">Handling</span><span className="cost-value">₹{detail.handling_cost}</span></div>
                  <div className="cost-row total"><span>Total</span><span>₹{detail.total_cost}</span></div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text-muted)' }}>
                ← Select a trip to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

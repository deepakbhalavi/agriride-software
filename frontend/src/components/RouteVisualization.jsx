import React from 'react'

export default function RouteVisualization({ pickupSequence, destination }) {
  const points = pickupSequence || []
  return (
    <div className="route-viz">
      {points.map((pt, i) => (
        <div key={i} className="route-point">
          <div className="route-dot">{i + 1}</div>
          <div className="route-info">
            <div className="location-name">📍 {pt.location_name || pt.pickup_location}</div>
            <div className="route-detail">
              {pt.produce_type && <span>🌿 {pt.quantity_kg}kg {pt.produce_type}</span>}
              {pt.earliest_time && <span> · ⏰ {pt.earliest_time}–{pt.latest_time}</span>}
              {pt.distance_from_prev_km > 0 && <span> · 📏 +{pt.distance_from_prev_km} km</span>}
            </div>
          </div>
        </div>
      ))}
      {destination && (
        <div className="route-point">
          <div className="route-dot destination">🏪</div>
          <div className="route-info">
            <div className="location-name" style={{ color: 'var(--color-accent)' }}>
              {destination}
            </div>
            <div className="route-detail">Destination Market</div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { tripAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import { Link } from 'react-router-dom'

export default function AdminTrips() {
  const [trips, setTrips]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tripAPI.getAll().then(r => setTrips(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Shared Trips Monitor</h1>
        <p className="page-subtitle">{trips.length} total shared trips</p>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Destination</th>
              <th>Total Load (kg)</th>
              <th>Distance (km)</th>
              <th>Total Cost</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Date</th>
              <th>Status</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(t => (
              <tr key={t.id}>
                <td>#{t.id}</td>
                <td>📍 {t.destination_name}</td>
                <td>{t.total_load_kg}</td>
                <td>{t.total_distance_km}</td>
                <td style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>₹{t.total_cost}</td>
                <td>V#{t.vehicle_id || '–'}</td>
                <td>D#{t.driver_id || '–'}</td>
                <td>{t.scheduled_date}</td>
                <td><StatusBadge status={t.status} /></td>
                <td style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{t.compatibility_score ? `${t.compatibility_score}%` : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { tripAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'

export default function DriverHistory() {
  const [trips, setTrips]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tripAPI.getAll().then(r => {
      const done = r.data.filter(t => ['DELIVERED', 'CANCELLED'].includes(t.status))
      setTrips(done)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Trip History</h1>
        <p className="page-subtitle">{trips.length} completed trips</p>
      </div>
      {!trips.length ? (
        <div className="empty-state"><div className="empty-icon">📅</div><h3>No history yet</h3></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>#</th><th>Destination</th><th>Load</th><th>Farmers</th><th>Date</th><th>Status</th><th>Earned</th></tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td>{t.destination_name}</td>
                  <td>{t.total_load_kg} kg</td>
                  <td>–</td>
                  <td>{t.scheduled_date}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>₹{t.total_cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

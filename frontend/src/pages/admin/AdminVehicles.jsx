import React, { useState, useEffect } from 'react'
import { vehicleAPI } from '../../api'

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    vehicleAPI.getAll().then(r => setVehicles(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Vehicles</h1>
        <p className="page-subtitle">{vehicles.length} registered vehicles</p>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>ID</th><th>Registration</th><th>Type</th><th>Make/Model</th><th>Capacity (kg)</th><th>Year</th><th>Status</th></tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.id}>
                <td>#{v.id}</td>
                <td style={{ fontWeight: 600 }}>{v.registration_number}</td>
                <td>{v.vehicle_type?.replace('_', ' ')}</td>
                <td>{v.make_model || '–'}</td>
                <td style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>{v.capacity_kg} kg</td>
                <td>{v.year || '–'}</td>
                <td><span className={`badge ${v.is_available ? 'badge-accepted' : 'badge-cancelled'}`}>{v.is_available ? 'Available' : 'In Use'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

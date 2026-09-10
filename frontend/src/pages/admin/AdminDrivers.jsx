import React, { useState, useEffect } from 'react'
import { driverAPI } from '../../api'

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    driverAPI.getAll().then(r => setDrivers(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Drivers</h1>
        <p className="page-subtitle">{drivers.length} registered drivers</p>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>License</th><th>Experience</th><th>Rating</th><th>Status</th><th>Location</th></tr>
          </thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.id}>
                <td>#{d.id}</td>
                <td style={{ fontWeight: 600 }}>🚛 {d.full_name}</td>
                <td>{d.email}</td>
                <td>{d.license_no || '–'}</td>
                <td>{d.experience ? `${d.experience} yrs` : '–'}</td>
                <td>⭐ {d.rating}</td>
                <td><span className={`badge ${d.is_available ? 'badge-accepted' : 'badge-cancelled'}`}>{d.is_available ? 'Available' : 'Busy'}</span></td>
                <td>{d.location_name || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { farmerAPI } from '../../api'

export default function AdminFarmers() {
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    farmerAPI.getAll().then(r => setFarmers(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Farmers</h1>
        <p className="page-subtitle">{farmers.length} registered farmers</p>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Farm</th><th>Location</th><th>City</th><th>Coordinates</th></tr>
          </thead>
          <tbody>
            {farmers.map(f => (
              <tr key={f.id}>
                <td>#{f.id}</td>
                <td style={{ fontWeight: 600 }}>🌾 {f.full_name}</td>
                <td>{f.email}</td>
                <td>{f.farm_name || '–'}</td>
                <td>{f.location_name || '–'}</td>
                <td>{f.city || '–'}</td>
                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {f.latitude ? `${f.latitude.toFixed(4)}, ${f.longitude.toFixed(4)}` : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

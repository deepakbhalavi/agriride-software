import React, { useState, useEffect } from 'react'
import { vehicleAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'

const VEHICLE_TYPES = ['MINI_TRUCK', 'PICKUP_TRUCK', 'TEMPO', 'TRACTOR', 'LARGE_TRUCK']

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ registration_number: '', vehicle_type: 'PICKUP_TRUCK', capacity_kg: '', make_model: '', year: '' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const load = () => vehicleAPI.getMy().then(r => setVehicles(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await vehicleAPI.add({ ...form, capacity_kg: parseFloat(form.capacity_kg), year: form.year ? parseInt(form.year) : null })
      setShowAdd(false)
      setForm({ registration_number: '', vehicle_type: 'PICKUP_TRUCK', capacity_kg: '', make_model: '', year: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add vehicle')
    } finally {
      setSaving(false)
    }
  }

  const toggleAvail = async (v) => {
    await vehicleAPI.update(v.id, { is_available: !v.is_available })
    load()
  }

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Management</h1>
          <p className="page-subtitle">{vehicles.length} vehicle(s) registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(p => !p)}>
          {showAdd ? 'Cancel' : '➕ Add Vehicle'}
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Add New Vehicle</h3>
          {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>⚠️ {error}</div>}
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Registration Number *</label>
                <input id="reg-number" type="text" className="form-input" placeholder="MH12-AB-1234"
                  value={form.registration_number} onChange={e => setForm(p => ({ ...p, registration_number: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Type *</label>
                <select className="form-select" value={form.vehicle_type} onChange={e => setForm(p => ({ ...p, vehicle_type: e.target.value }))}>
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Capacity (kg) *</label>
                <input type="number" className="form-input" placeholder="e.g. 800"
                  value={form.capacity_kg} onChange={e => setForm(p => ({ ...p, capacity_kg: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Make / Model</label>
                <input type="text" className="form-input" placeholder="e.g. Tata Ace"
                  value={form.make_model} onChange={e => setForm(p => ({ ...p, make_model: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input type="number" className="form-input" placeholder="2022"
                  value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : '🚛 Add Vehicle'}
            </button>
          </form>
        </div>
      )}

      {!vehicles.length ? (
        <div className="empty-state">
          <div className="empty-icon">🚛</div>
          <h3>No vehicles registered</h3>
          <p>Add your vehicle details to start receiving shared trip requests.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {vehicles.map(v => (
            <div key={v.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '2.5rem' }}>
                  {v.vehicle_type === 'LARGE_TRUCK' ? '🚚' : v.vehicle_type === 'TRACTOR' ? '🚜' : '🚛'}
                </div>
                <StatusBadge status={v.is_available ? 'accepted' : 'cancelled'} />
              </div>
              <h3 style={{ marginTop: 12 }}>{v.make_model || v.vehicle_type.replace('_', ' ')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Registration</span>
                  <span style={{ fontWeight: 600 }}>{v.registration_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Capacity</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>{v.capacity_kg} kg</span>
                </div>
                {v.year && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Year</span>
                    <span>{v.year}</span>
                  </div>
                )}
              </div>
              <button
                className={`btn btn-sm w-full mt-md ${v.is_available ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => toggleAvail(v)}
              >
                {v.is_available ? '🔴 Set Unavailable' : '🟢 Set Available'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

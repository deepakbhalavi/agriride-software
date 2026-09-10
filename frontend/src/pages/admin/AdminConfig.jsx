import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../api'

export default function AdminConfig() {
  const [config, setConfig] = useState(null)
  const [form, setForm]     = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getConfig().then(r => {
      setConfig(r.data)
      setForm(r.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const payload = {}
      for (const k of Object.keys(form)) {
        if (k !== 'id') payload[k] = parseFloat(form[k])
      }
      const r = await adminAPI.updateConfig(payload)
      setConfig(r.data)
      setMsg('✅ Configuration saved! Matching engine will use new parameters.')
      setTimeout(() => setMsg(''), 4000)
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.detail || 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  const totalWeight = ['weight_destination', 'weight_proximity', 'weight_time', 'weight_capacity']
    .reduce((s, k) => s + parseFloat(form[k] || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Matching Configuration</h1>
          <p className="page-subtitle">Configure the rule-based matching engine parameters</p>
        </div>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      <form onSubmit={handleSave}>
        {/* Scoring Weights */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 8 }}>⚖️ Compatibility Scoring Weights</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: 16 }}>Weights must sum to 1.0 (100%).</p>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Total: </span>
            <span style={{ color: Math.abs(totalWeight - 1.0) < 0.01 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>
              {totalWeight.toFixed(2)} {Math.abs(totalWeight - 1.0) < 0.01 ? '✅' : '⚠️'}
            </span>
          </div>
          <div className="form-row">
            {[
              { key: 'weight_destination', label: 'Destination Compatibility', hint: 'Same market = 30%' },
              { key: 'weight_proximity',   label: 'Geographic Proximity',      hint: 'Pickup distance = 25%' },
              { key: 'weight_time',        label: 'Time Window Overlap',       hint: 'Pickup timing = 20%' },
              { key: 'weight_capacity',    label: 'Vehicle Capacity',          hint: 'Load feasibility = 25%' },
            ].map(w => (
              <div key={w.key} className="form-group">
                <label className="form-label">{w.label}</label>
                <input type="number" step="0.01" min="0" max="1" className="form-input"
                  value={form[w.key] || 0}
                  onChange={e => set(w.key, e.target.value)} />
                <span className="form-help">{w.hint}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Thresholds */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>📏 Matching Thresholds</h3>
          <div className="form-row">
            {[
              { key: 'max_pickup_distance_km',  label: 'Max Pickup Distance (km)',       hint: 'Max distance between farmer pickup points' },
              { key: 'destination_radius_km',   label: 'Destination Radius (km)',         hint: 'Allow nearby markets within this radius' },
              { key: 'min_time_overlap_min',    label: 'Min Time Window Overlap (min)',   hint: 'Minimum overlap between farmer time windows' },
              { key: 'min_load_kg',             label: 'Minimum Booking Load (kg)',       hint: 'Reject bookings below this quantity' },
              { key: 'max_load_kg',             label: 'Maximum Booking Load (kg)',       hint: 'Reject bookings above this quantity' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input type="number" step="0.1" className="form-input"
                  value={form[f.key] || 0}
                  onChange={e => set(f.key, e.target.value)} />
                <span className="form-help">{f.hint}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Parameters */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>💰 Cost Parameters</h3>
          <div className="form-row">
            {[
              { key: 'base_vehicle_cost',  label: 'Base Vehicle Cost (₹)',  hint: 'Fixed cost per trip' },
              { key: 'cost_per_km',        label: 'Cost per km (₹)',        hint: 'Distance-based rate' },
              { key: 'handling_cost',      label: 'Handling Cost (₹)',      hint: 'Loading/unloading charge' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input type="number" step="1" className="form-input"
                  value={form[f.key] || 0}
                  onChange={e => set(f.key, e.target.value)} />
                <span className="form-help">{f.hint}</span>
              </div>
            ))}
          </div>
          <div className="alert alert-info" style={{ marginTop: 12 }}>
            💡 Cost formula: Total = Base + (Distance × Rate/km) + Handling
            <br />Example: ₹{form.base_vehicle_cost} + (40km × ₹{form.cost_per_km}) + ₹{form.handling_cost} = ₹{parseFloat(form.base_vehicle_cost || 0) + 40 * parseFloat(form.cost_per_km || 0) + parseFloat(form.handling_cost || 0)}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving || Math.abs(totalWeight - 1.0) >= 0.05}>
          {saving ? 'Saving...' : '💾 Save Configuration'}
        </button>
      </form>
    </div>
  )
}

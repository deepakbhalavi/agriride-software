import React, { useState, useEffect } from 'react'
import { farmerAPI } from '../../api'

export default function FarmerProfile() {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    farmerAPI.getProfile().then(r => {
      setProfile(r.data)
      setForm(r.data)
    })
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Only send fields accepted by FarmerProfileUpdate schema
      // (strip read-only fields like id, user_id, email, created_at)
      const payload = {
        farm_name:     form.farm_name     || null,
        address:       form.address       || null,
        city:          form.city          || null,
        state:         form.state         || null,
        pincode:       form.pincode       || null,
        latitude:      form.latitude  !== '' && form.latitude  != null ? parseFloat(form.latitude)  : null,
        longitude:     form.longitude !== '' && form.longitude != null ? parseFloat(form.longitude) : null,
        location_name: form.location_name || null,
        full_name:     form.full_name     || null,
        phone:         form.phone         || null,
      }
      const r = await farmerAPI.updateProfile(payload)
      setProfile(r.data)
      setEditing(false)
      setMsg('Profile updated successfully!')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg('Update failed: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error'))
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal and farm information</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setEditing(p => !p)}>
          {editing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Avatar Card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px', fontWeight: 700 }}>
            {(profile.full_name || 'F').split(' ').map(w => w[0]).slice(0,2).join('')}
          </div>
          <h2>{profile.full_name}</h2>
          <p style={{ color: 'var(--color-primary-light)' }}>🌾 Farmer</p>
          <p>{profile.email}</p>
          {profile.phone && <p>📞 {profile.phone}</p>}
          {profile.location_name && (
            <div className="tag" style={{ display: 'inline-flex', marginTop: 8 }}>
              📍 {profile.location_name}
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Farm Details</h3>
          {editing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={form.full_name || ''} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-input" value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Farm Name</label>
                <input type="text" className="form-input" value={form.farm_name || ''} onChange={e => setForm(p => ({ ...p, farm_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Location Name</label>
                <input type="text" className="form-input" value={form.location_name || ''} onChange={e => setForm(p => ({ ...p, location_name: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input type="number" step="any" className="form-input" value={form.latitude ?? ''} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input type="number" step="any" className="form-input" value={form.longitude ?? ''} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" value={form.city || ''} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" className="form-input" value={form.state || ''} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Farm Name',   value: profile.farm_name },
                { label: 'City',        value: profile.city },
                { label: 'State',       value: profile.state },
                { label: 'Location',    value: profile.location_name },
                { label: 'Coordinates', value: profile.latitude ? `${profile.latitude}, ${profile.longitude}` : null },
              ].map(item => item.value && (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{item.label}</span>
                  <span style={{ fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

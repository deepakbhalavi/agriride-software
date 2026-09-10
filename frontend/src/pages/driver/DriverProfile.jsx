import React, { useState, useEffect } from 'react'
import { driverAPI } from '../../api'

export default function DriverProfile() {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    driverAPI.getProfile().then(r => { setProfile(r.data); setForm(r.data) })
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await driverAPI.updateProfile(form)
      setProfile(r.data)
      setEditing(false)
      setMsg('Profile updated!')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg('Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Driver Profile</h1>
        <button className="btn btn-secondary" onClick={() => setEditing(p => !p)}>
          {editing ? 'Cancel' : '✏️ Edit'}
        </button>
      </div>
      {msg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{msg}</div>}
      <div className="grid-2" style={{ gap: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px', fontWeight: 700 }}>
            {(profile.full_name || 'D').split(' ').map(w => w[0]).slice(0,2).join('')}
          </div>
          <h2>{profile.full_name}</h2>
          <p style={{ color: 'var(--color-info)' }}>🚛 Driver</p>
          <p>{profile.email}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            <span className="tag">⭐ {profile.rating}</span>
            <span className="tag">📅 {profile.experience}y exp</span>
            <span className={`badge ${profile.is_available ? 'badge-accepted' : 'badge-cancelled'}`}>
              {profile.is_available ? '🟢 Available' : '🔴 Unavailable'}
            </span>
          </div>
        </div>
        <div className="card">
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
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">License No</label>
                  <input type="text" className="form-input" value={form.license_no || ''} onChange={e => setForm(p => ({ ...p, license_no: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Experience (years)</label>
                  <input type="number" className="form-input" value={form.experience || ''} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Availability</label>
                <select className="form-select" value={form.is_available ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, is_available: e.target.value === 'true' }))}>
                  <option value="true">Available</option>
                  <option value="false">Not Available</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '💾 Save'}
              </button>
            </form>
          ) : (
            <div>
              <h3 style={{ marginBottom: 16 }}>Details</h3>
              {[
                { label: 'License No',   value: profile.license_no },
                { label: 'Experience',   value: profile.experience ? `${profile.experience} years` : null },
                { label: 'Location',     value: profile.location_name },
                { label: 'Coordinates',  value: profile.latitude ? `${profile.latitude}, ${profile.longitude}` : null },
              ].map(item => item.value && (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
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

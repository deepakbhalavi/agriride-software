import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingAPI } from '../../api'

// Demo location presets for easy demo input
const DEMO_LOCATIONS = [
  { name: 'Village Aakurdi, Pune',   lat: 18.5204, lon: 73.8567 },
  { name: 'Village Bhosari, Pune',   lat: 18.5310, lon: 73.8412 },
  { name: 'Village Chikhali, Pune',  lat: 18.5260, lon: 73.8500 },
  { name: 'Village Pimpri, Pune',    lat: 18.5350, lon: 73.8600 },
  { name: 'Village Wakad, Pune',     lat: 18.5280, lon: 73.8450 },
  { name: 'Village Dindori, Nashik', lat: 19.9975, lon: 73.7898 },
]

const DEMO_DESTINATIONS = [
  { name: 'Pune Mandai Market',   lat: 18.5088, lon: 73.8756 },
  { name: 'Nashik Sabzi Mandi',   lat: 20.0059, lon: 73.7898 },
  { name: 'Kolhapur Market',      lat: 16.7000, lon: 74.2333 },
]

const PRODUCE_TYPES = ['Tomato', 'Onion', 'Potato', 'Cauliflower', 'Spinach', 'Cabbage', 'Garlic', 'Ginger', 'Brinjal', 'Capsicum', 'Green Beans', 'Carrot', 'Other']

export default function CreateBooking() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    produce_type:          '',
    quantity_kg:           '',
    pickup_latitude:       '',
    pickup_longitude:      '',
    pickup_location_name:  '',
    destination_name:      '',
    destination_latitude:  '',
    destination_longitude: '',
    preferred_date:        '',
    earliest_pickup_time:  '06:00',
    latest_pickup_time:    '08:00',
    special_requirements:  '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const selectLocation = (loc) => {
    set('pickup_latitude', loc.lat)
    set('pickup_longitude', loc.lon)
    set('pickup_location_name', loc.name)
  }

  const selectDestination = (dest) => {
    set('destination_name', dest.name)
    set('destination_latitude', dest.lat)
    set('destination_longitude', dest.lon)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.pickup_latitude) { setError('Please select a pickup location'); return }
    if (!form.destination_name) { setError('Please enter a destination market'); return }
    setLoading(true)
    try {
      await bookingAPI.create({
        ...form,
        quantity_kg:           parseFloat(form.quantity_kg),
        pickup_latitude:       parseFloat(form.pickup_latitude),
        pickup_longitude:      parseFloat(form.pickup_longitude),
        destination_latitude:  form.destination_latitude ? parseFloat(form.destination_latitude) : null,
        destination_longitude: form.destination_longitude ? parseFloat(form.destination_longitude) : null,
      })
      setSuccess(true)
      setTimeout(() => navigate('/farmer/bookings'), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div style={{ fontSize: '4rem' }}>✅</div>
      <h2 style={{ color: 'var(--color-success)' }}>Booking Created!</h2>
      <p>Your transportation request has been submitted. The matching engine will find compatible farmers.</p>
      <span className="badge badge-requested animate-pulse">Redirecting to My Bookings...</span>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Transportation Booking</h1>
          <p className="page-subtitle">Tell us about your produce and pickup requirements</p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Produce Details */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>🌿 Produce Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Produce Type *</label>
                <select id="produce-type" className="form-select" value={form.produce_type}
                  onChange={e => set('produce_type', e.target.value)} required>
                  <option value="">Select produce...</option>
                  {PRODUCE_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity (kg) *</label>
                <input id="quantity" type="number" className="form-input" placeholder="e.g. 300"
                  value={form.quantity_kg} onChange={e => set('quantity_kg', e.target.value)}
                  min="1" max="10000" required />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Special Requirements</label>
              <textarea id="special-req" className="form-textarea" placeholder="e.g. Handle with care, fragile produce..."
                value={form.special_requirements} onChange={e => set('special_requirements', e.target.value)} />
            </div>
          </div>

          {/* Pickup Location */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>📍 Pickup Location</h3>
            <div className="section-label">Quick Select (Demo Locations)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {DEMO_LOCATIONS.map(loc => (
                <button key={loc.name} type="button"
                  className={`btn btn-sm ${form.pickup_location_name === loc.name ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => selectLocation(loc)}>
                  📍 {loc.name.split(',')[0]}
                </button>
              ))}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Location Name *</label>
                <input id="pickup-name" type="text" className="form-input" placeholder="Village / Area name"
                  value={form.pickup_location_name} onChange={e => set('pickup_location_name', e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input type="number" className="form-input" step="any" placeholder="18.5204"
                  value={form.pickup_latitude} onChange={e => set('pickup_latitude', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input type="number" className="form-input" step="any" placeholder="73.8567"
                  value={form.pickup_longitude} onChange={e => set('pickup_longitude', e.target.value)} required />
              </div>
            </div>
            {form.pickup_latitude && (
              <div className="alert alert-success" style={{ marginTop: 8 }}>
                ✅ Coordinates: {form.pickup_latitude}, {form.pickup_longitude}
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>🏪 Destination Market</h3>
            <div className="section-label">Quick Select (Demo Markets)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {DEMO_DESTINATIONS.map(d => (
                <button key={d.name} type="button"
                  className={`btn btn-sm ${form.destination_name === d.name ? 'btn-accent' : 'btn-secondary'}`}
                  onClick={() => selectDestination(d)}>
                  🏪 {d.name}
                </button>
              ))}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Market Name *</label>
                <input id="destination" type="text" className="form-input" placeholder="Market name"
                  value={form.destination_name} onChange={e => set('destination_name', e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Market Latitude</label>
                <input type="number" className="form-input" step="any"
                  value={form.destination_latitude} onChange={e => set('destination_latitude', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Market Longitude</label>
                <input type="number" className="form-input" step="any"
                  value={form.destination_longitude} onChange={e => set('destination_longitude', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Time Window */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>⏰ Pickup Schedule</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Preferred Date *</label>
                <input id="preferred-date" type="date" className="form-input"
                  value={form.preferred_date} onChange={e => set('preferred_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Earliest Pickup Time *</label>
                <input id="earliest-time" type="time" className="form-input"
                  value={form.earliest_pickup_time} onChange={e => set('earliest_pickup_time', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Latest Pickup Time *</label>
                <input id="latest-time" type="time" className="form-input"
                  value={form.latest_pickup_time} onChange={e => set('latest_pickup_time', e.target.value)} required />
              </div>
            </div>
            <div className="alert alert-info" style={{ marginTop: 12 }}>
              💡 A wider time window increases your chances of matching with other farmers.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 1 }}>
              {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Submitting...</> : '📋 Submit Booking'}
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/farmer/bookings')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

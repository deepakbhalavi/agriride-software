import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '', role: 'FARMER'
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const role = await register(form)
      navigate(role === 'FARMER' ? '/farmer/dashboard' : '/driver/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="logo-icon">🌾</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem' }}>AgriRide</span>
        </div>

        <div className="auth-title">
          <h2>Create Account</h2>
          <p>Join the smart farming transport network</p>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">I am a...</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { value: 'FARMER', label: '🌾 Farmer', desc: 'I want to ship produce' },
                { value: 'DRIVER', label: '🚛 Driver', desc: 'I own a vehicle' },
              ].map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setForm(p => ({ ...p, role: opt.value }))}
                  style={{
                    border: `2px solid ${form.role === opt.value ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    cursor: 'pointer',
                    background: form.role === opt.value ? 'var(--color-primary-faint)' : 'var(--bg-elevated)',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.5rem' }}>{opt.label.split(' ')[0]}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{opt.label.split(' ')[1]}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="reg-name" type="text" className="form-input" placeholder="Ramesh Patil"
                autoComplete="off" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input id="reg-phone" type="tel" className="form-input" placeholder="9876543210"
                autoComplete="off" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@example.com"
              autoComplete="off" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" type="password" className="form-input" placeholder="Min 6 characters"
              autoComplete="new-password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating account...</> : '✅ Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}

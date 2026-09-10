import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || null

  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const role = await login(form.email, form.password)
      const dest = from || (role === 'FARMER' ? '/farmer/dashboard' : role === 'DRIVER' ? '/driver/dashboard' : '/admin/dashboard')
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (email, password) => setForm({ email, password })

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">🌾</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem' }}>AgriRide</span>
        </div>

        <div className="auth-title">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Your password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Signing in...</> : '🔐 Sign In'}
          </button>
        </form>

        <div className="divider" />

        {/* Quick Login Demo */}
        <div>
          <div className="section-label">Quick Demo Login</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '🌾 Farmer Demo',  email: 'farmer1@agriride.com',  password: 'Farmer@123' },
              { label: '🚛 Driver Demo',  email: 'driver1@agriride.com',  password: 'Driver@123' },
              { label: '👔 Admin Demo',   email: 'admin@agriride.com',    password: 'Admin@123'  },
            ].map(d => (
              <button
                key={d.email}
                className="btn btn-secondary btn-sm"
                onClick={() => quickLogin(d.email, d.password)}
                type="button"
                style={{ justifyContent: 'flex-start' }}
              >
                {d.label}
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.email}</span>
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>Register</Link>
        </p>
      </div>
    </div>
  )
}

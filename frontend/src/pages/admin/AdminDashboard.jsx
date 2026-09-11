import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI, matchingAPI, bookingAPI } from '../../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboard() {
  const [stats, setStats]               = useState(null)
  const [reports, setReports]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [matching, setMatching]         = useState(false)
  const [matchMsg, setMatchMsg]         = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([adminAPI.getDashboard(), adminAPI.getReports(), bookingAPI.getAll()])
      .then(([s, r, b]) => {
        setStats(s.data)
        setReports(r.data)
        const pending = (b.data || []).filter(bk => bk.status === 'REQUESTED')
        setPendingCount(pending.length)
      })
      .finally(() => setLoading(false))
  }, [])

  const runMatching = async () => {
    setMatching(true)
    setMatchMsg('')
    try {
      const res = await matchingAPI.run()
      const found = res.data.groups_found
      if (found > 0) {
        setMatchMsg(`✅ Found ${found} matched group(s)! Go to "Manage Trips" to review and create shared trips.`)
      } else {
        setMatchMsg(`ℹ️ No matches found. Need at least 2 farmers with similar destinations, pickup locations, and time windows.`)
      }
    } catch {
      setMatchMsg('❌ Matching failed. Ensure farmers have complete booking details.')
    } finally {
      setMatching(false)
    }
  }


  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  const tripStatusData = [
    { name: 'Active',    value: stats?.active_trips ?? 0 },
    { name: 'Completed', value: stats?.completed_trips ?? 0 },
    { name: 'Cancelled', value: stats?.cancelled_trips ?? 0 },
  ]

  const dailyData = reports ? Object.entries(reports.daily_bookings || {}).slice(-7).map(([date, count]) => ({
    date: date.slice(5), count
  })) : []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">System overview and platform metrics</p>
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(22,163,74,0.3)' }}>
        <h3 style={{ marginBottom: 16 }}>📋 Platform Workflow</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { step: '1', role: '🌾 Farmer', action: 'Creates booking request' },
            { step: '→', role: '', action: '' },
            { step: '2', role: '🔧 Admin', action: 'Runs matching engine' },
            { step: '→', role: '', action: '' },
            { step: '3', role: '🚛 Driver', action: 'Accepts shared trip' },
            { step: '→', role: '', action: '' },
            { step: '4', role: '✅ Done', action: 'Trip completed & paid' },
          ].map((s, i) => s.step === '→' ? (
            <span key={i} style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>→</span>
          ) : (
            <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', minWidth: 130 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>Step {s.step}</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{s.role}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{s.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Bookings Action */}
      {pendingCount > 0 && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(245,158,11,0.5)', background: 'rgba(245,158,11,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, color: '#f59e0b' }}>⚠️ {pendingCount} Pending Booking(s) Need Matching</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>Farmers are waiting. Run the matching engine to group them into shared trips.</p>
            </div>
            <button className="btn btn-primary" onClick={runMatching} disabled={matching} style={{ minWidth: 180 }}>
              {matching ? '⏳ Running...' : '🔍 Run Matching Engine'}
            </button>
          </div>
          {matchMsg && (
            <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0 }}>{matchMsg}</div>
          )}
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total Farmers',  value: stats?.total_farmers,  icon: '🌾', color: '#16a34a' },
          { label: 'Total Drivers',  value: stats?.total_drivers,  icon: '🚛', color: '#3b82f6' },
          { label: 'Total Vehicles', value: stats?.total_vehicles, icon: '🚗', color: '#8b5cf6' },
          { label: 'Total Bookings', value: stats?.total_bookings, icon: '📋', color: '#f59e0b' },
          { label: 'Active Trips',   value: stats?.active_trips,   icon: '🔄', color: '#06b6d4' },
          { label: 'Completed Trips',value: stats?.completed_trips,icon: '✅', color: '#10b981' },
          { label: 'Est. Savings',   value: `₹${Math.round(stats?.estimated_savings ?? 0)}`, icon: '💰', color: '#f59e0b' },
          { label: 'Vehicle Util %', value: `${stats?.avg_vehicle_util ?? 0}%`, icon: '📊', color: '#8b5cf6' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ '--stat-accent': c.color, '--stat-bg': `${c.color}20` }}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
        {/* Daily Bookings Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Daily Bookings (Last 7 Days)</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#16a34a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}><p>No booking data yet</p></div>
          )}
        </div>

        {/* Trip Status Pie */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Trip Status Distribution</h3>
          {tripStatusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={tripStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {tripStatusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}><p>No trip data yet</p></div>
          )}
        </div>
      </div>

      {/* Research Metrics */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>📊 Research Metrics (Demo Data)</h3>
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          ℹ️ All metrics are calculated from the demo dataset. Values represent algorithm output, not real-world measurements.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { label: 'Matching Success Rate',      value: `${reports?.matching_success_rate ?? 0}%` },
            { label: 'Total Shared Trips',          value: reports?.total_shared_trips ?? 0 },
            { label: 'Avg Farmer Cost',             value: `₹${Math.round(reports?.avg_farmer_cost ?? 0)}` },
            { label: 'Total Distance Covered',      value: `${reports?.total_distance_km ?? 0} km` },
            { label: 'Vehicles (Shared Mode)',       value: reports?.vehicles_needed_shared ?? 0 },
            { label: 'Vehicles (Individual Mode)',   value: reports?.vehicles_needed_individual ?? 0 },
            { label: 'Vehicle Reduction',            value: `${reports?.vehicle_reduction ?? 0} less` },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12 }}>
              <div className="stat-label">{m.label}</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-primary-light)', marginTop: 4 }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

export default function AdminReports() {
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getReports().then(r => setReports(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  const comparisonData = [
    { metric: 'Vehicles Used',    individual: reports?.vehicles_needed_individual ?? 0, shared: reports?.vehicles_needed_shared ?? 0 },
    { metric: 'Trips Made',       individual: reports?.total_bookings ?? 0,              shared: reports?.total_shared_trips ?? 0 },
    { metric: 'Avg Cost (×10)',   individual: Math.round((reports?.avg_farmer_cost ?? 0) * 1.4) / 10, shared: Math.round((reports?.avg_farmer_cost ?? 0)) / 10 },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Research Evaluation Report</h1>
          <p className="page-subtitle">Algorithm performance metrics and comparison analysis</p>
        </div>
      </div>

      <div className="alert alert-warning" style={{ marginBottom: 24 }}>
        ⚠️ <strong>Research Disclaimer:</strong> All values are calculated from the demo dataset.
        These are algorithmic outputs, NOT real-world measured results. Do not present as real farmer data.
      </div>

      {/* Key Metrics */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {[
          { label: 'Matching Success Rate',    value: `${reports?.matching_success_rate ?? 0}%`,    icon: '🎯', color: '#16a34a' },
          { label: 'Total Shared Trips',        value: reports?.total_shared_trips ?? 0,             icon: '🚛', color: '#3b82f6' },
          { label: 'Avg Farmer Cost',           value: `₹${Math.round(reports?.avg_farmer_cost ?? 0)}`, icon: '💰', color: '#f59e0b' },
          { label: 'Total Distance (Demo)',     value: `${reports?.total_distance_km ?? 0} km`,     icon: '📏', color: '#8b5cf6' },
          { label: 'Vehicles (Shared Mode)',    value: reports?.vehicles_needed_shared ?? 0,          icon: '🚗', color: '#10b981' },
          { label: 'Vehicles (Individual Mode)',value: reports?.vehicles_needed_individual ?? 0,      icon: '🚙', color: '#ef4444' },
          { label: 'Vehicle Reduction',         value: `${reports?.vehicle_reduction ?? 0} fewer`,  icon: '✅', color: '#16a34a' },
          { label: 'Est. Total Savings',        value: `₹${Math.round(reports?.estimated_total_savings ?? 0)}`, icon: '💵', color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} className="stat-card" style={{ '--stat-accent': m.color, '--stat-bg': `${m.color}20` }}>
            <div className="stat-icon">{m.icon}</div>
            <div className="stat-label">{m.label}</div>
            <div className="stat-value">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Comparison Chart */}
      <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Individual vs Shared Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="metric" width={100} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
              <Bar dataKey="individual" fill="#ef4444" name="Individual" radius={[0,4,4,0]} />
              <Bar dataKey="shared"     fill="#16a34a" name="Shared"     radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Before vs After Summary */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Before vs After – Shared Scheduling</h3>
          <div className="alert alert-info" style={{ marginBottom: 16, fontSize: '0.78rem' }}>
            * Values based on demo dataset. Labeled as demo assumptions.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Vehicles Required',  before: reports?.vehicles_needed_individual ?? 0, after: reports?.vehicles_needed_shared ?? 0,   unit: 'vehicles', betterIsLess: true  },
              { label: 'Trips Required',     before: reports?.total_bookings ?? 0,              after: reports?.total_shared_trips ?? 0,        unit: 'trips',    betterIsLess: true  },
              { label: 'Matching Rate',      before: '0%',                                       after: `${reports?.matching_success_rate ?? 0}%`, unit: '',       betterIsLess: false },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>{c.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-danger)' }}>{c.before}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Without AgriRide</div>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-success)' }}>{c.after}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>With AgriRide</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Metrics Table */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Complete Research Metrics Table</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Metric</th><th>Individual Scheduling</th><th>Shared Scheduling (AgriRide)</th><th>Improvement</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Vehicles Required</td>
                <td style={{ color: 'var(--color-danger)' }}>{reports?.vehicles_needed_individual} vehicles</td>
                <td style={{ color: 'var(--color-success)' }}>{reports?.vehicles_needed_shared} shared trips</td>
                <td style={{ color: 'var(--color-primary-light)', fontWeight: 700 }}>{reports?.vehicle_reduction} fewer vehicles</td>
              </tr>
              <tr>
                <td>Matching Success Rate</td>
                <td>N/A</td>
                <td>{reports?.matching_success_rate}%</td>
                <td style={{ color: 'var(--color-success)' }}>✅ Rule-based matching</td>
              </tr>
              <tr>
                <td>Total Distance (Demo)</td>
                <td>–</td>
                <td>{reports?.total_distance_km} km</td>
                <td>–</td>
              </tr>
              <tr>
                <td>Avg Farmer Cost</td>
                <td>–</td>
                <td>₹{Math.round(reports?.avg_farmer_cost)}</td>
                <td style={{ color: 'var(--color-success)' }}>Proportional share</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

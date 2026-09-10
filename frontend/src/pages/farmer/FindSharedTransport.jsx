import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { matchingAPI, bookingAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import RouteVisualization from '../../components/RouteVisualization'

export default function FindSharedTransport() {
  const [bookings, setBookings]   = useState([])
  const [results, setResults]     = useState(null)
  const [running, setRunning]     = useState(false)
  const [creating, setCreating]   = useState(false)
  const [error, setError]         = useState('')
  const [created, setCreated]     = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    bookingAPI.getMy().then(r => {
      const pending = r.data.filter(b => b.status === 'REQUESTED')
      setBookings(pending)
    })
  }, [])

  const runMatching = async () => {
    setRunning(true)
    setError('')
    setResults(null)
    try {
      const res = await matchingAPI.run()
      setResults(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Matching failed')
    } finally {
      setRunning(false)
    }
  }

  const createTrip = async (groupIdx, bookingIds) => {
    setCreating(true)
    try {
      const res = await matchingAPI.createTrip(groupIdx, bookingIds)
      setCreated(res.data.trip_id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create shared trip')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Find Shared Transport</h1>
          <p className="page-subtitle">Run the matching engine to find compatible farmers for shared trips</p>
        </div>
      </div>

      {/* Algorithm Notice */}
      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        🧮 <strong>Rule-Based Matching Algorithm</strong> — This system uses transparent rules (NOT machine learning) to
        group farmers by destination compatibility, geographic proximity, time window overlap, and vehicle capacity.
      </div>

      {/* Pending Bookings */}
      {bookings.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Your Pending Bookings ({bookings.length})</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {bookings.map(b => (
              <div key={b.id} className="tag">
                #{b.id} · {b.quantity_kg}kg {b.produce_type} → {b.destination_name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run Button */}
      <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
        <h2 style={{ marginBottom: 8 }}>Run Matching Engine</h2>
        <p style={{ marginBottom: 24 }}>
          Analyzes all pending bookings for compatibility across all farmers in the system.
        </p>
        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
        {created && (
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            ✅ Shared Trip #{created} created! Check your bookings for updates.
          </div>
        )}
        <button
          id="run-matching-btn"
          className="btn btn-primary btn-lg"
          onClick={runMatching}
          disabled={running}
          style={{ minWidth: 240 }}
        >
          {running
            ? <><span className="spinner" style={{ width: 20, height: 20 }} /> Running Matching Engine...</>
            : '🔍 Run Matching & Optimization'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div>
          <div className="card" style={{ marginBottom: 20, background: 'rgba(22,163,74,0.08)', borderColor: 'rgba(22,163,74,0.3)' }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div className="stat-label">Groups Found</div>
                <div className="stat-value" style={{ fontSize: '2rem' }}>{results.groups_found}</div>
              </div>
              <div>
                <div className="stat-label">Unmatched Bookings</div>
                <div className="stat-value" style={{ fontSize: '2rem', color: results.unmatched_booking_ids?.length ? 'var(--color-warning)' : 'var(--color-success)' }}>
                  {results.unmatched_booking_ids?.length || 0}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="stat-label">Algorithm</div>
                <div style={{ color: 'var(--color-primary-light)', fontWeight: 600, marginTop: 4 }}>{results.algorithm}</div>
              </div>
            </div>
          </div>

          {results.matched_groups?.map((grp, idx) => (
            <MatchGroup key={idx} grp={grp} idx={idx} onCreateTrip={createTrip} creating={creating} />
          ))}

          {results.unmatched_booking_ids?.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
              <h3 style={{ color: 'var(--color-danger)', marginBottom: 8 }}>❌ Unmatched Bookings</h3>
              <p style={{ fontSize: '0.875rem' }}>
                Booking IDs {results.unmatched_booking_ids.join(', ')} could not be matched.
                Only one booking exists for their destination or they don't meet compatibility criteria.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MatchGroup({ grp, idx, onCreateTrip, creating }) {
  const [expanded, setExpanded] = useState(true)
  const isMatched = grp.match_result === 'MATCHED'

  return (
    <div className="card" style={{ marginBottom: 20, borderColor: isMatched ? 'rgba(22,163,74,0.3)' : 'rgba(245,158,11,0.3)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: isMatched ? 'rgba(22,163,74,0.2)' : 'rgba(245,158,11,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
          }}>
            {isMatched ? '✅' : '⚠️'}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{grp.destination}</h3>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <StatusBadge status={grp.match_result === 'MATCHED' ? 'MATCHED_STATUS' : grp.match_result === 'PARTIALLY_MATCHED' ? 'PARTIALLY_MATCHED' : 'NOT_MATCHED'} />
              <span className="tag">Score: {grp.compatibility_score}%</span>
              <span className="tag">{grp.booking_ids.length} farmers</span>
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(p => !p)}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <>
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            <StatBox icon="⚖️" label="Total Load"       value={`${grp.total_load_kg} kg`} />
            <StatBox icon="📏" label="Max Pickup Dist"  value={`${grp.distance_km} km`} />
            <StatBox icon="⏰" label="Time Window"      value={grp.time_overlap_ok ? '✅ Compatible' : '⚠️ Borderline'} ok={grp.time_overlap_ok} />
            <StatBox icon="🚛" label="Capacity Check"   value={grp.capacity_ok ? '✅ Feasible' : '❌ Over Capacity'} ok={grp.capacity_ok} />
          </div>

          {/* Scores */}
          <div className="card" style={{ background: 'var(--bg-elevated)', marginBottom: 16 }}>
            <div className="section-label">Compatibility Score Breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Destination (30%)',  val: grp.scores?.destination },
                { label: 'Proximity (25%)',    val: grp.scores?.proximity },
                { label: 'Time (20%)',         val: grp.scores?.time },
                { label: 'Capacity (25%)',     val: grp.scores?.capacity },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.val >= 70 ? 'var(--color-success)' : s.val >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                    {s.val ?? '–'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</div>
                  <div className="progress-bar" style={{ marginTop: 4 }}>
                    <div className="progress-fill" style={{ width: `${s.val ?? 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle */}
          {grp.recommended_vehicle_id && (
            <div className="card" style={{ background: 'var(--bg-elevated)', marginBottom: 16 }}>
              <div className="section-label">Recommended Vehicle</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span className="tag">🚛 {grp.recommended_vehicle_type?.replace('_', ' ')}</span>
                <span className="tag">📄 {grp.recommended_vehicle_reg}</span>
                <span className="tag">⚖️ {grp.recommended_vehicle_cap} kg capacity</span>
                <span className="tag" style={{ color: 'var(--color-success)' }}>
                  ✅ {grp.total_load_kg} / {grp.recommended_vehicle_cap} kg = {Math.round(grp.total_load_kg / grp.recommended_vehicle_cap * 100)}% utilized
                </span>
              </div>
            </div>
          )}

          {/* Farmer Allocations */}
          <div className="card" style={{ background: 'var(--bg-elevated)', marginBottom: 16 }}>
            <div className="section-label">Farmer Cost Allocations</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Farmer</th>
                    <th>Produce</th>
                    <th>Quantity (kg)</th>
                    <th>Share %</th>
                    <th>My Cost (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {grp.farmer_allocations?.map((fa, i) => (
                    <tr key={i}>
                      <td>👤 Farmer #{fa.farmer_id}</td>
                      <td>{fa.produce}</td>
                      <td>{fa.quantity_kg} kg</td>
                      <td>{fa.percentage}%</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>₹{fa.allocated_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divider" />
            <div className="cost-row total">
              <span>Total Trip Cost</span>
              <span>₹{grp.cost_breakdown?.total_cost}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              = ₹{grp.cost_breakdown?.base_cost} base + {grp.route_distance_km} km × ₹{grp.cost_breakdown ? Math.round((grp.cost_breakdown.distance_cost / grp.route_distance_km) || 20) : 20}/km + ₹{grp.cost_breakdown?.handling_cost} handling
            </div>
          </div>

          {/* Savings */}
          {grp.savings_vs_individual && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div className="compare-card before">
                <div className="compare-label">BEFORE (Individual)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>₹{grp.savings_vs_individual.total_individual_cost}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{grp.booking_ids.length} separate vehicles</div>
              </div>
              <div className="vs-divider">→</div>
              <div className="compare-card after">
                <div className="compare-label">AFTER (Shared)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>₹{grp.savings_vs_individual.total_shared_cost}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
                  Save ₹{grp.savings_vs_individual.total_saved} ({grp.savings_vs_individual.pct_saved}%)
                </div>
              </div>
            </div>
          )}

          {/* Route */}
          {grp.pickup_sequence?.length > 0 && (
            <div className="card" style={{ background: 'var(--bg-elevated)', marginBottom: 16 }}>
              <div className="section-label">🗺️ Optimized Pickup Route (Baseline – Nearest Neighbor)</div>
              <RouteVisualization pickupSequence={grp.pickup_sequence} destination={grp.destination} />
            </div>
          )}

          {/* Create Trip Button */}
          {isMatched && grp.capacity_ok && (
            <button
              id={`create-trip-btn-${idx}`}
              className="btn btn-primary btn-lg w-full"
              onClick={() => onCreateTrip(idx, grp.booking_ids)}
              disabled={creating}
            >
              {creating ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating Trip...</> : '🚛 Create Shared Trip & Notify Driver'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function StatBox({ icon, label, value, ok }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '12px 16px' }}>
      <div className="stat-label">{icon} {label}</div>
      <div style={{
        fontWeight: 700, marginTop: 4,
        color: ok === true ? 'var(--color-success)' : ok === false ? 'var(--color-danger)' : 'var(--text-primary)'
      }}>{value}</div>
    </div>
  )
}

import React, { useState } from 'react'
import { matchingAPI, adminAPI } from '../../api'
import RouteVisualization from '../../components/RouteVisualization'

const DEMO_STEPS = [
  { id: 1,  label: 'Overview',               icon: '📋', desc: 'Problem statement and research scope' },
  { id: 2,  label: 'Demo Data',              icon: '🗃️', desc: 'Inspect seed farmers and bookings' },
  { id: 3,  label: 'Run Matching',           icon: '🔍', desc: 'Execute rule-based matching algorithm' },
  { id: 4,  label: 'Scoring Explained',      icon: '🧮', desc: 'See how compatibility scores are calculated' },
  { id: 5,  label: 'Route Optimization',     icon: '🗺️', desc: 'View baseline nearest-neighbor route' },
  { id: 6,  label: 'Cost Allocation',        icon: '💰', desc: 'See proportional cost sharing' },
  { id: 7,  label: 'NOT MATCHED Case',       icon: '❌', desc: 'See why some bookings fail matching' },
  { id: 8,  label: 'Before vs After',        icon: '📊', desc: 'Compare individual vs shared scheduling' },
  { id: 9,  label: 'Research Metrics',       icon: '📈', desc: 'View algorithm evaluation results' },
  { id: 10, label: 'Configuration Impact',   icon: '⚙️', desc: 'How config parameters affect matching' },
]

export default function ResearchDemo() {
  const [step, setStep]           = useState(1)
  const [matching, setMatching]   = useState(null)
  const [running, setRunning]     = useState(false)
  const [reports, setReports]     = useState(null)

  const runMatch = async () => {
    setRunning(true)
    try {
      const [m, r] = await Promise.all([matchingAPI.run(), adminAPI.getReports()])
      setMatching(m.data)
      setReports(r.data)
    } catch (err) {
      console.error(err)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔬 Research Demo Console</h1>
          <p className="page-subtitle">Interactive walkthrough of the AgriRide matching algorithm</p>
        </div>
        <div className="badge badge-warning animate-pulse">DEMO MODE</div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        ℹ️ This console is for <strong>research evaluation and demonstration</strong>.
        All data is from the seeded Demo Dataset (simulated coordinates, Maharashtra-based).
        The matching algorithm is <strong>rule-based, NOT machine learning</strong>.
      </div>

      {/* Step Navigator */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-label">Demo Steps</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DEMO_STEPS.map(s => (
            <button key={s.id}
              className={`btn btn-sm ${step === s.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStep(s.id)}
            >
              {s.icon} Step {s.id}
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && <StepOverview />}
      {step === 2 && <StepDemoData />}
      {step === 3 && <StepRunMatching matching={matching} running={running} onRun={runMatch} />}
      {step === 4 && <StepScoringExplained matching={matching} />}
      {step === 5 && <StepRouteOptimization matching={matching} />}
      {step === 6 && <StepCostAllocation matching={matching} />}
      {step === 7 && <StepNotMatched matching={matching} />}
      {step === 8 && <StepComparison reports={reports} />}
      {step === 9 && <StepResearchMetrics reports={reports} />}
      {step === 10 && <StepConfigImpact />}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <button className="btn btn-secondary" onClick={() => setStep(p => Math.max(1, p-1))} disabled={step === 1}>
          ← Previous
        </button>
        <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>Step {step} of {DEMO_STEPS.length}</span>
        <button className="btn btn-primary" onClick={() => setStep(p => Math.min(DEMO_STEPS.length, p+1))} disabled={step === DEMO_STEPS.length}>
          Next →
        </button>
      </div>
    </div>
  )
}

function StepOverview() {
  return (
    <div className="card">
      <div className="section-label">Step 1 – Problem Statement</div>
      <h2 style={{ marginBottom: 12 }}>AgriRide – Smart Shared Transportation Scheduling</h2>
      <div className="alert alert-warning" style={{ marginBottom: 20 }}>
        🔬 <strong>MCA Research Project</strong> — This application demonstrates a genuine software solution for agricultural transport optimization.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: 'var(--color-danger)', marginBottom: 8 }}>❌ Problem</h3>
          <p>Farmers with small produce quantities book individual vehicles. Most vehicles travel under-capacity, increasing costs and road congestion. A 300kg onion load does not need a 2000kg truck — but booking a smaller vehicle individually is also expensive.</p>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: 'var(--color-success)', marginBottom: 8 }}>✅ Solution</h3>
          <p>AgriRide groups farmers going to the same market with compatible pickup times and nearby locations. A single shared trip carries all their produce, divides the cost proportionally, and reduces vehicles on the road.</p>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: 'var(--color-info)', marginBottom: 8 }}>🧮 Algorithm (Rule-Based, NOT ML)</h3>
          <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>1. <strong>Destination Compatibility (30%)</strong> — Same market or within destination_radius_km</li>
            <li>2. <strong>Geographic Proximity (25%)</strong> — Haversine distance between pickup points ≤ max_pickup_distance_km</li>
            <li>3. <strong>Time Window Overlap (20%)</strong> — Farmer pickup windows must overlap ≥ min_time_overlap_min</li>
            <li>4. <strong>Vehicle Capacity (25%)</strong> — Total load must fit in available vehicle</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function StepDemoData() {
  const DEMO_FARMERS = [
    { name: 'Ramesh Patil',   produce: 'Cauliflower', qty: 300, dest: 'Pune Mandai Market', time: '06:00–07:00', group: 'Group 1 (MATCH)' },
    { name: 'Sunita Bhosale', produce: 'Tomato',      qty: 200, dest: 'Pune Mandai Market', time: '06:15–07:15', group: 'Group 1 (MATCH)' },
    { name: 'Vijay Shinde',   produce: 'Potato',      qty: 250, dest: 'Pune Mandai Market', time: '06:10–07:00', group: 'Group 1 (MATCH)' },
    { name: 'Priya Desai',    produce: 'Onion',       qty: 400, dest: 'Nashik Sabzi Mandi', time: '07:00–08:00', group: 'Group 2 (MATCH)' },
    { name: 'Anil Jadhav',    produce: 'Garlic',      qty: 180, dest: 'Nashik Sabzi Mandi', time: '07:00–08:30', group: 'Group 2 (MATCH)' },
    { name: 'Kavitha Rao',    produce: 'Capsicum',    qty: 150, dest: 'Nashik Sabzi Mandi', time: '06:45–08:00', group: 'Group 2 (MATCH)' },
    { name: 'Mahesh Kumar',   produce: 'Sugarcane',   qty: 600, dest: 'Kolhapur Market',    time: '05:00–06:00', group: 'Solo (NO MATCH)' },
    { name: 'Geeta Chavan',   produce: 'Strawberry',  qty: 80,  dest: 'Satara Market',      time: '10:00–11:00', group: 'Solo (NO MATCH)' },
  ]

  return (
    <div className="card">
      <div className="section-label">Step 2 – Demo Dataset</div>
      <h2 style={{ marginBottom: 8 }}>Seed Data Overview</h2>
      <div className="alert alert-warning" style={{ marginBottom: 16 }}>
        🗃️ <strong>DEMO DATASET</strong> — All coordinates are simulated. Run seed_data.py to populate.
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Farmer</th><th>Produce</th><th>Qty (kg)</th><th>Destination</th><th>Time Window</th><th>Expected</th></tr>
          </thead>
          <tbody>
            {DEMO_FARMERS.map((f, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>🌾 {f.name}</td>
                <td>🌿 {f.produce}</td>
                <td>{f.qty}</td>
                <td>🏪 {f.dest}</td>
                <td>⏰ {f.time}</td>
                <td>
                  <span className={`badge ${f.group.includes('MATCH)') ? 'badge-matched' : 'badge-cancelled'}`}>
                    {f.group}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StepRunMatching({ matching, running, onRun }) {
  return (
    <div className="card">
      <div className="section-label">Step 3 – Live Algorithm Execution</div>
      <h2 style={{ marginBottom: 16 }}>Run Matching Engine</h2>
      {!matching ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
          <p style={{ marginBottom: 24 }}>Click below to execute the rule-based matching algorithm on all pending bookings.</p>
          <button id="research-run-btn" className="btn btn-primary btn-lg" onClick={onRun} disabled={running}>
            {running
              ? <><span className="spinner" style={{ width: 20, height: 20 }} /> Running Algorithm...</>
              : '🔍 Execute Matching Algorithm'}
          </button>
        </div>
      ) : (
        <div>
          <div className="alert alert-success" style={{ marginBottom: 20 }}>✅ Algorithm complete!</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{matching.groups_found}</div>
              <div className="stat-label">Groups Found</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-warning)' }}>{matching.unmatched_booking_ids?.length || 0}</div>
              <div className="stat-label">Unmatched</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-info)' }}>{matching.algorithm}</div>
              <div className="stat-label">Algorithm</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onRun} disabled={running}>↻ Re-run</button>
        </div>
      )}
    </div>
  )
}

function StepScoringExplained({ matching }) {
  return (
    <div className="card">
      <div className="section-label">Step 4 – Compatibility Scoring</div>
      <h2 style={{ marginBottom: 16 }}>How Each Group is Scored</h2>
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20, fontFamily: 'monospace', marginBottom: 20 }}>
        <div style={{ color: 'var(--color-primary-light)' }}>compatibility_score = (</div>
        <div style={{ paddingLeft: 24, color: 'var(--text-secondary)' }}>
          (destination_score × 0.30) +<br />
          (proximity_score × 0.25) +<br />
          (time_score × 0.20) +<br />
          (capacity_score × 0.25)<br />
        </div>
        <div style={{ color: 'var(--color-primary-light)' }}>)</div>
      </div>
      {matching?.matched_groups?.map((grp, i) => (
        <div key={i} style={{ marginBottom: 16, background: 'var(--bg-elevated)', padding: 16, borderRadius: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Group {i+1}: {grp.destination} — Score: {grp.compatibility_score}%</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Destination (×0.30)', val: grp.scores?.destination, weight: 0.30 },
              { label: 'Proximity (×0.25)',   val: grp.scores?.proximity,   weight: 0.25 },
              { label: 'Time (×0.20)',         val: grp.scores?.time,        weight: 0.20 },
              { label: 'Capacity (×0.25)',    val: grp.scores?.capacity,    weight: 0.25 },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.val >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>{s.val ?? '–'}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary-light)' }}>= {((s.val ?? 0) * s.weight).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!matching && <div className="alert alert-info">Run the matching engine first (Step 3).</div>}
    </div>
  )
}

function StepRouteOptimization({ matching }) {
  return (
    <div className="card">
      <div className="section-label">Step 5 – Route Optimization</div>
      <h2 style={{ marginBottom: 8 }}>Baseline Route Optimization</h2>
      <div className="alert alert-warning" style={{ marginBottom: 16 }}>
        ⚠️ <strong>Baseline Algorithm</strong> — Nearest-Neighbor Heuristic.
        This is NOT globally optimal. It is a reasonable baseline suitable for research demonstration.
        Production-grade optimization would use OR-Tools VRPTW.
      </div>
      {matching?.matched_groups?.map((grp, i) => (
        grp.pickup_sequence?.length > 0 && (
          <div key={i} style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Group {i+1}: {grp.destination}</h3>
            <RouteVisualization pickupSequence={grp.pickup_sequence} destination={grp.destination} />
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tag">🔢 {grp.pickup_sequence.length} pickup stops</span>
              <span className="tag">📏 ~{grp.route_distance_km} km total</span>
              <span className="tag">🧭 Start: Driver Location</span>
            </div>
          </div>
        )
      ))}
      {!matching && <div className="alert alert-info">Run the matching engine first (Step 3).</div>}
    </div>
  )
}

function StepCostAllocation({ matching }) {
  return (
    <div className="card">
      <div className="section-label">Step 6 – Cost Allocation</div>
      <h2 style={{ marginBottom: 16 }}>Proportional Cost Sharing</h2>
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20, fontFamily: 'monospace', marginBottom: 20 }}>
        <div style={{ color: 'var(--color-accent)' }}>Total Cost = Base Vehicle Cost + (Distance × Rate/km) + Handling</div>
        <div style={{ color: 'var(--color-primary-light)', marginTop: 8 }}>Farmer Share = (Farmer Qty ÷ Total Qty) × Total Cost</div>
        <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>Example: 300kg ÷ 750kg × ₹1,500 = ₹600.00</div>
      </div>
      {matching?.matched_groups?.map((grp, i) => (
        grp.farmer_allocations?.length > 0 && (
          <div key={i} style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Group {i+1}: {grp.destination}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Farmer</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Qty (kg)</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Share %</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Cost (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {grp.farmer_allocations.map((fa, j) => (
                    <tr key={j}>
                      <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>👤 Farmer #{fa.farmer_id}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>{fa.quantity_kg}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>{fa.percentage}%</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-light)' }}>₹{fa.allocated_amount}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} style={{ padding: '8px', fontWeight: 700 }}>TOTAL</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>100%</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: 'var(--color-accent)', fontSize: '1rem' }}>₹{grp.cost_breakdown?.total_cost}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      ))}
      {!matching && <div className="alert alert-info">Run the matching engine first (Step 3).</div>}
    </div>
  )
}

function StepNotMatched({ matching }) {
  return (
    <div className="card">
      <div className="section-label">Step 7 – NOT MATCHED Cases</div>
      <h2 style={{ marginBottom: 16 }}>Why Some Bookings Don't Match</h2>
      {matching?.unmatched_booking_ids?.length > 0 ? (
        <>
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            ❌ Booking IDs not matched: [{matching.unmatched_booking_ids.join(', ')}]
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { reason: 'Different Destination', detail: 'Kolhapur Market and Satara Market have no other bookings for the same destination. Cannot form a group.' },
              { reason: 'No Proximity Match', detail: 'Mahesh Kumar (Kolhapur) is geographically far from Pune/Nashik clusters. Haversine distance exceeds threshold.' },
              { reason: 'No Time Window Overlap', detail: 'Geeta Chavan (10:00–11:00) has no overlap with any other farmer in the same region.' },
            ].map(r => (
              <div key={r.reason} className="compat-item fail" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <div style={{ fontWeight: 700 }}>❌ {r.reason}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.detail}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="alert alert-info">Run matching engine (Step 3) to see unmatched bookings.</div>
      )}
    </div>
  )
}

function StepComparison({ reports }) {
  return (
    <div className="card">
      <div className="section-label">Step 8 – Before vs After Comparison</div>
      <h2 style={{ marginBottom: 16 }}>Individual Scheduling vs AgriRide</h2>
      <div className="alert alert-warning" style={{ marginBottom: 16 }}>
        * Demo dataset values. Labeled explicitly as algorithmic output.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center', marginBottom: 24 }}>
        <div className="compare-card before">
          <div className="compare-label">❌ Without AgriRide</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>{reports?.vehicles_needed_individual ?? '?'} Vehicles</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Every farmer hires separate vehicle</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-danger)', marginTop: 8 }}>{reports?.total_bookings ?? '?'} separate trips needed</div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--color-primary-light)', fontWeight: 900 }}>→</div>
        <div className="compare-card after">
          <div className="compare-label">✅ With AgriRide</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>{reports?.vehicles_needed_shared ?? '?'} Shared Trips</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Farmers grouped, single vehicle per group</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-success)', marginTop: 8 }}>
            {reports?.vehicle_reduction ?? '?'} fewer vehicles on road
          </div>
        </div>
      </div>
    </div>
  )
}

function StepResearchMetrics({ reports }) {
  return (
    <div className="card">
      <div className="section-label">Step 9 – Research Evaluation Metrics</div>
      <h2 style={{ marginBottom: 16 }}>Algorithm Performance</h2>
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        ℹ️ These metrics evaluate the rule-based algorithm's performance on the demo dataset.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Matching Success Rate', value: `${reports?.matching_success_rate ?? 0}%`, good: true },
          { label: 'Groups Created',         value: reports?.total_shared_trips ?? 0,           good: true },
          { label: 'Unmatched Bookings',     value: reports?.unmatched_bookings ?? 0,            good: false },
          { label: 'Vehicle Reduction',      value: `${reports?.vehicle_reduction ?? 0} fewer`, good: true },
          { label: 'Avg Compatibility Score',value: `${reports?.avg_compatibility_score ?? 0}%`, good: true },
          { label: 'Algorithm',              value: 'Rule-Based', good: true },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: m.good ? 'var(--color-primary-light)' : 'var(--color-warning)' }}>{m.value}</div>
            <div className="stat-label" style={{ marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepConfigImpact() {
  return (
    <div className="card">
      <div className="section-label">Step 10 – Configuration Impact</div>
      <h2 style={{ marginBottom: 16 }}>How Parameters Affect Matching</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          { param: 'max_pickup_distance_km',  effect: 'Increase → More farmers can be grouped (higher matching rate, but longer routes)', tradeoff: 'If too large, routes become impractical' },
          { param: 'min_time_overlap_min',    effect: 'Decrease → More lenient time matching (more groups formed)', tradeoff: 'If too small, farmers wait too long for pickup' },
          { param: 'destination_radius_km',   effect: 'Increase → Allow different but nearby markets in one trip', tradeoff: 'May cause farmers to go to wrong market' },
          { param: 'weight_proximity (25%)',  effect: 'Increase weight → Prioritize geographic clustering', tradeoff: 'May reject time-compatible but slightly far farmers' },
          { param: 'base_vehicle_cost (₹500)', effect: 'Decrease → Lower individual farmer cost', tradeoff: 'Should reflect actual market rates' },
        ].map(item => (
          <div key={item.param} style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12 }}>
            <div style={{ fontFamily: 'monospace', color: 'var(--color-primary-light)', fontWeight: 700, marginBottom: 4 }}>{item.param}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>✅ {item.effect}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-warning)' }}>⚠️ Trade-off: {item.tradeoff}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <a href="/admin/config" className="btn btn-primary">⚙️ Go to Matching Configuration →</a>
      </div>
    </div>
  )
}

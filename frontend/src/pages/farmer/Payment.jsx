import React, { useState, useEffect } from 'react'
import { bookingAPI, paymentAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'

export default function Payment() {
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState({})
  const [loading, setLoading]   = useState(true)
  const [paying, setPaying]     = useState(null)
  const [method, setMethod]     = useState('UPI')

  useEffect(() => {
    bookingAPI.getMy().then(async (r) => {
      const matched = r.data.filter(b => b.allocated_cost && b.status !== 'CANCELLED')
      setBookings(matched)
      // Load payments for each
      const pmtMap = {}
      await Promise.all(matched.map(async b => {
        try {
          const res = await paymentAPI.getByBooking(b.id)
          pmtMap[b.id] = res.data
        } catch {}
      }))
      setPayments(pmtMap)
    }).finally(() => setLoading(false))
  }, [])

  const handlePay = async (booking) => {
    setPaying(booking.id)
    try {
      let pmt = payments[booking.id]
      if (!pmt) {
        const r = await paymentAPI.initiate({ booking_id: booking.id, payment_method: method })
        pmt = r.data
      }
      const r2 = await paymentAPI.process(pmt.id)
      setPayments(p => ({ ...p, [booking.id]: r2.data }))
      alert(`✅ Payment of ₹${r2.data.amount} successful!\nTransaction: ${r2.data.transaction_reference}`)
    } catch (err) {
      alert('Payment failed: ' + (err.response?.data?.detail || 'Unknown error'))
    } finally {
      setPaying(null)
    }
  }

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Pay your shared transportation costs</p>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        💡 <strong>Mock Payment:</strong> This is a research prototype. No real financial transactions are processed.
      </div>

      {!bookings.length ? (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <h3>No pending payments</h3>
          <p>Payments will appear here once your bookings are matched to a shared trip.</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <label className="form-label">Payment Method</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {['UPI', 'CASH', 'CARD', 'BANK_TRANSFER'].map(m => (
                <button key={m} type="button"
                  className={`btn btn-sm ${method === m ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMethod(m)}>
                  {m === 'UPI' ? '📱' : m === 'CASH' ? '💵' : m === 'CARD' ? '💳' : '🏦'} {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bookings.map(b => {
              const pmt = payments[b.id]
              const paid = pmt?.payment_status === 'SUCCESS'
              return (
                <div key={b.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <h3 style={{ margin: 0 }}>🌿 {b.produce_type}</h3>
                        <StatusBadge status={b.status} />
                        {pmt && <StatusBadge status={pmt.payment_status} />}
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📦 {b.quantity_kg} kg</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {b.destination_name}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📅 {b.preferred_date}</span>
                      </div>
                      {pmt?.transaction_reference && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Txn: {pmt.transaction_reference}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-light)', fontFamily: 'var(--font-display)' }}>
                        ₹{b.allocated_cost}
                      </div>
                      {paid ? (
                        <span className="badge badge-success">✅ Paid</span>
                      ) : (
                        <button
                          id={`pay-btn-${b.id}`}
                          className="btn btn-accent btn-lg"
                          style={{ marginTop: 8 }}
                          onClick={() => handlePay(b)}
                          disabled={paying === b.id}
                        >
                          {paying === b.id ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing...</> : `💳 Pay ₹${b.allocated_cost}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

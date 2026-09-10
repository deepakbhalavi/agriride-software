import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'

export default function AdminUsers() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const load = () => adminAPI.getUsers().then(r => setUsers(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleToggle = async (id) => {
    await adminAPI.toggleUser(id)
    load()
  }

  const filtered = filter === 'ALL' ? users : users.filter(u => u.role === filter)

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} total users</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['ALL', 'FARMER', 'DRIVER', 'ADMIN'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                <td>{u.email}</td>
                <td><StatusBadge status={u.role} /></td>
                <td>{u.phone || '–'}</td>
                <td><span className={`badge ${u.is_active ? 'badge-accepted' : 'badge-cancelled'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.created_at?.slice(0,10)}</td>
                <td>
                  {u.role !== 'ADMIN' && (
                    <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => handleToggle(u.id)}>
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FARMER_NAV = [
  { to: '/farmer/dashboard',      icon: '🏠', label: 'Dashboard' },
  { to: '/farmer/create-booking', icon: '➕', label: 'New Booking' },
  { to: '/farmer/bookings',       icon: '📋', label: 'My Bookings' },
  { to: '/farmer/find-transport', icon: '🔍', label: 'Find Shared Transport' },
  { to: '/farmer/payment',        icon: '💳', label: 'Payments' },
  { to: '/farmer/history',        icon: '📅', label: 'Trip History' },
  { to: '/farmer/profile',        icon: '👤', label: 'Profile' },
]

const DRIVER_NAV = [
  { to: '/driver/dashboard',  icon: '🏠', label: 'Dashboard' },
  { to: '/driver/vehicle',    icon: '🚛', label: 'My Vehicle' },
  { to: '/driver/trips',      icon: '📦', label: 'Available Trips' },
  { to: '/driver/earnings',   icon: '💰', label: 'Earnings' },
  { to: '/driver/history',    icon: '📅', label: 'Trip History' },
  { to: '/driver/profile',    icon: '👤', label: 'Profile' },
]

const ADMIN_NAV = [
  { to: '/admin/dashboard',   icon: '📊', label: 'Dashboard' },
  { to: '/admin/users',       icon: '👥', label: 'All Users' },
  { to: '/admin/farmers',     icon: '🌾', label: 'Farmers' },
  { to: '/admin/drivers',     icon: '🚛', label: 'Drivers' },
  { to: '/admin/vehicles',    icon: '🚗', label: 'Vehicles' },
  { to: '/admin/bookings',    icon: '📋', label: 'Bookings' },
  { to: '/admin/trips',       icon: '🗺️', label: 'Shared Trips' },
  { to: '/admin/research',    icon: '🔬', label: 'Research Demo' },
  { to: '/admin/config',      icon: '⚙️', label: 'Matching Config' },
  { to: '/admin/reports',     icon: '📈', label: 'Reports' },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = user?.role === 'FARMER' ? FARMER_NAV
                 : user?.role === 'DRIVER' ? DRIVER_NAV
                 : ADMIN_NAV

  const roleBadge = user?.role === 'FARMER' ? { label: 'Farmer', cls: 'badge-farmer' }
                  : user?.role === 'DRIVER' ? { label: 'Driver', cls: 'badge-driver' }
                  : { label: 'Admin', cls: 'badge-admin' }

  const initials = (user?.full_name || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🌾</div>
        <div>
          <div className="logo-text">AgriRide</div>
          <div className="logo-sub">Smart Transport</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role">{roleBadge.label}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm w-full mt-md"
          style={{ justifyContent: 'flex-start', color: 'var(--color-danger)' }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  )
}

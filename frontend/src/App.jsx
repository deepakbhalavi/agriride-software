import React, { Suspense, lazy, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'

// ── Lazy imports ─────────────────────────────────────────────
// Public
const LandingPage   = lazy(() => import('./pages/public/LandingPage'))
const Login         = lazy(() => import('./pages/public/Login'))
const Register      = lazy(() => import('./pages/public/Register'))
const HowItWorks    = lazy(() => import('./pages/public/HowItWorks'))

// Farmer
const FarmerDashboard     = lazy(() => import('./pages/farmer/FarmerDashboard'))
const CreateBooking       = lazy(() => import('./pages/farmer/CreateBooking'))
const MyBookings          = lazy(() => import('./pages/farmer/MyBookings'))
const FindSharedTransport = lazy(() => import('./pages/farmer/FindSharedTransport'))
const SharedTripDetails   = lazy(() => import('./pages/farmer/SharedTripDetails'))
const Payment             = lazy(() => import('./pages/farmer/Payment'))
const TripTracking        = lazy(() => import('./pages/farmer/TripTracking'))
const FarmerHistory       = lazy(() => import('./pages/farmer/FarmerHistory'))
const FarmerProfile       = lazy(() => import('./pages/farmer/FarmerProfile'))

// Driver
const DriverDashboard   = lazy(() => import('./pages/driver/DriverDashboard'))
const VehicleManagement = lazy(() => import('./pages/driver/VehicleManagement'))
const AvailableTrips    = lazy(() => import('./pages/driver/AvailableTrips'))
const DriverTripDetail  = lazy(() => import('./pages/driver/DriverTripDetail'))
const Earnings          = lazy(() => import('./pages/driver/Earnings'))
const DriverHistory     = lazy(() => import('./pages/driver/DriverHistory'))
const DriverProfile     = lazy(() => import('./pages/driver/DriverProfile'))

// Admin
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'))
const AdminFarmers      = lazy(() => import('./pages/admin/AdminFarmers'))
const AdminDrivers      = lazy(() => import('./pages/admin/AdminDrivers'))
const AdminVehicles     = lazy(() => import('./pages/admin/AdminVehicles'))
const AdminBookings     = lazy(() => import('./pages/admin/AdminBookings'))
const AdminTrips        = lazy(() => import('./pages/admin/AdminTrips'))
const AdminConfig       = lazy(() => import('./pages/admin/AdminConfig'))
const AdminReports      = lazy(() => import('./pages/admin/AdminReports'))
const ResearchDemo      = lazy(() => import('./pages/admin/ResearchDemo'))


// ── Guards ───────────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function PageLoader() {
  return (
    <div className="loading-state" style={{ minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p>Loading AgriRide...</p>
    </div>
  )
}

// ── App Shell ────────────────────────────────────────────────
function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  const isPublic = ['/', '/login', '/register', '/how-it-works'].includes(location.pathname)
  if (isPublic || !user) return <>{children}</>

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="main-content">
        <div className="page-wrapper">
          {children}
        </div>
      </main>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
    </AuthProvider>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <AppShell>
      <Routes>
        {/* Public */}
        <Route path="/"            element={<LandingPage />} />
        <Route path="/login"       element={user ? <Navigate to={defaultRoute(user.role)} /> : <Login />} />
        <Route path="/register"    element={user ? <Navigate to={defaultRoute(user.role)} /> : <Register />} />
        <Route path="/how-it-works" element={<HowItWorks />} />

        {/* Farmer */}
        <Route path="/farmer/dashboard"      element={<ProtectedRoute roles={['FARMER']}><FarmerDashboard /></ProtectedRoute>} />
        <Route path="/farmer/create-booking" element={<ProtectedRoute roles={['FARMER']}><CreateBooking /></ProtectedRoute>} />
        <Route path="/farmer/bookings"       element={<ProtectedRoute roles={['FARMER']}><MyBookings /></ProtectedRoute>} />
        <Route path="/farmer/find-transport" element={<ProtectedRoute roles={['FARMER']}><FindSharedTransport /></ProtectedRoute>} />
        <Route path="/farmer/trip/:id"       element={<ProtectedRoute roles={['FARMER']}><SharedTripDetails /></ProtectedRoute>} />
        <Route path="/farmer/payment"        element={<ProtectedRoute roles={['FARMER']}><Payment /></ProtectedRoute>} />
        <Route path="/farmer/tracking"       element={<ProtectedRoute roles={['FARMER']}><TripTracking /></ProtectedRoute>} />
        <Route path="/farmer/history"        element={<ProtectedRoute roles={['FARMER']}><FarmerHistory /></ProtectedRoute>} />
        <Route path="/farmer/profile"        element={<ProtectedRoute roles={['FARMER']}><FarmerProfile /></ProtectedRoute>} />

        {/* Driver */}
        <Route path="/driver/dashboard" element={<ProtectedRoute roles={['DRIVER']}><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/vehicle"   element={<ProtectedRoute roles={['DRIVER']}><VehicleManagement /></ProtectedRoute>} />
        <Route path="/driver/trips"     element={<ProtectedRoute roles={['DRIVER']}><AvailableTrips /></ProtectedRoute>} />
        <Route path="/driver/trip/:id"  element={<ProtectedRoute roles={['DRIVER']}><DriverTripDetail /></ProtectedRoute>} />
        <Route path="/driver/earnings"  element={<ProtectedRoute roles={['DRIVER']}><Earnings /></ProtectedRoute>} />
        <Route path="/driver/history"   element={<ProtectedRoute roles={['DRIVER']}><DriverHistory /></ProtectedRoute>} />
        <Route path="/driver/profile"   element={<ProtectedRoute roles={['DRIVER']}><DriverProfile /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users"     element={<ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/farmers"   element={<ProtectedRoute roles={['ADMIN']}><AdminFarmers /></ProtectedRoute>} />
        <Route path="/admin/drivers"   element={<ProtectedRoute roles={['ADMIN']}><AdminDrivers /></ProtectedRoute>} />
        <Route path="/admin/vehicles"  element={<ProtectedRoute roles={['ADMIN']}><AdminVehicles /></ProtectedRoute>} />
        <Route path="/admin/bookings"  element={<ProtectedRoute roles={['ADMIN']}><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/trips"     element={<ProtectedRoute roles={['ADMIN']}><AdminTrips /></ProtectedRoute>} />
        <Route path="/admin/config"    element={<ProtectedRoute roles={['ADMIN']}><AdminConfig /></ProtectedRoute>} />
        <Route path="/admin/reports"   element={<ProtectedRoute roles={['ADMIN']}><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/research"  element={<ProtectedRoute roles={['ADMIN']}><ResearchDemo /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

function defaultRoute(role) {
  if (role === 'FARMER') return '/farmer/dashboard'
  if (role === 'DRIVER') return '/driver/dashboard'
  return '/admin/dashboard'
}

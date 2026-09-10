import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agriride_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post('/api/auth/register', data),
  login:    (data)  => api.post('/api/auth/login', data),
  me:       ()      => api.get('/api/auth/me'),
}

// ── Farmer ──────────────────────────────────────────────────
export const farmerAPI = {
  getProfile:    ()     => api.get('/api/farmers/profile'),
  updateProfile: (data) => api.put('/api/farmers/profile', data),
  getDashboard:  ()     => api.get('/api/farmers/dashboard-stats'),
  getAll:        ()     => api.get('/api/farmers/all'),
}

// ── Driver ──────────────────────────────────────────────────
export const driverAPI = {
  getProfile:    ()     => api.get('/api/drivers/profile'),
  updateProfile: (data) => api.put('/api/drivers/profile', data),
  getDashboard:  ()     => api.get('/api/drivers/dashboard-stats'),
  getAll:        ()     => api.get('/api/drivers/all'),
}

// ── Vehicles ─────────────────────────────────────────────────
export const vehicleAPI = {
  add:    (data)        => api.post('/api/vehicles', data),
  getMy:  ()            => api.get('/api/vehicles/my'),
  getAll: ()            => api.get('/api/vehicles'),
  update: (id, data)    => api.put(`/api/vehicles/${id}`, data),
}

// ── Bookings ─────────────────────────────────────────────────
export const bookingAPI = {
  create:    (data)     => api.post('/api/bookings', data),
  getMy:     ()         => api.get('/api/bookings'),
  getAll:    ()         => api.get('/api/bookings/all'),
  getById:   (id)       => api.get(`/api/bookings/${id}`),
  update:    (id, data) => api.put(`/api/bookings/${id}`, data),
  cancel:    (id)       => api.delete(`/api/bookings/${id}`),
}

// ── Matching ──────────────────────────────────────────────────
export const matchingAPI = {
  run:         (ids)          => api.post('/api/matching/run', ids || null),
  createTrip:  (idx, ids)     => api.post(`/api/matching/create-trip/${idx}`, ids),
}

// ── Shared Trips ──────────────────────────────────────────────
export const tripAPI = {
  getAll:      ()         => api.get('/api/shared-trips'),
  getById:     (id)       => api.get(`/api/shared-trips/${id}`),
  accept:      (id)       => api.post(`/api/shared-trips/${id}/accept`),
  reject:      (id)       => api.post(`/api/shared-trips/${id}/reject`),
  updateStatus: (id, s)   => api.put(`/api/shared-trips/${id}/status?new_status=${s}`),
}

// ── Payments ─────────────────────────────────────────────────
export const paymentAPI = {
  initiate:    (data)     => api.post('/api/payments', data),
  process:     (id)       => api.post(`/api/payments/${id}/process`),
  getById:     (id)       => api.get(`/api/payments/${id}`),
  getByBooking: (bid)     => api.get(`/api/payments/booking/${bid}`),
}

// ── Notifications ─────────────────────────────────────────────
export const notifAPI = {
  getAll:       ()         => api.get('/api/notifications'),
  getCount:     ()         => api.get('/api/notifications/unread-count'),
  markRead:     (id)       => api.put(`/api/notifications/${id}/read`),
  markAllRead:  ()         => api.put('/api/notifications/mark-all-read'),
}

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: ()        => api.get('/api/admin/dashboard'),
  getReports:   ()        => api.get('/api/admin/reports'),
  getConfig:    ()        => api.get('/api/admin/config'),
  updateConfig: (data)    => api.put('/api/admin/config', data),
  getUsers:     ()        => api.get('/api/admin/users'),
  toggleUser:   (id)      => api.put(`/api/admin/users/${id}/toggle-active`),
}

export default api

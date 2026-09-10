import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token    = localStorage.getItem('agriride_token')
    const userData = localStorage.getItem('agriride_user')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res  = await authAPI.login({ email, password })
    const data = res.data
    localStorage.setItem('agriride_token', data.access_token)
    localStorage.setItem('agriride_user', JSON.stringify({
      id:        data.user_id,
      email,
      full_name: data.full_name,
      role:      data.role,
    }))
    setUser({ id: data.user_id, email, full_name: data.full_name, role: data.role })
    return data.role
  }

  const logout = () => {
    localStorage.removeItem('agriride_token')
    localStorage.removeItem('agriride_user')
    setUser(null)
  }

  const register = async (formData) => {
    const res  = await authAPI.register(formData)
    const data = res.data
    localStorage.setItem('agriride_token', data.access_token)
    localStorage.setItem('agriride_user', JSON.stringify({
      id:        data.user_id,
      email:     formData.email,
      full_name: formData.full_name,
      role:      data.role,
    }))
    setUser({ id: data.user_id, email: formData.email, full_name: formData.full_name, role: data.role })
    return data.role
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import { createContext, useContext, useEffect, useState } from 'react'
import { getUserProfile, loginUser, registerUser } from '../services/authService.js'

const AuthContext = createContext(null)
const storageKey = 'brainbattle-auth'

function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || { user: null, token: null }
  } catch {
    return { user: null, token: null }
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth)
  const [profileLoading, setProfileLoading] = useState(Boolean(auth.token))
  const [profileError, setProfileError] = useState(false)

  function saveAuth(data) {
    const nextAuth = { user: data.user, token: data.token }
    localStorage.setItem(storageKey, JSON.stringify(nextAuth))
    setAuth(nextAuth)
  }

  async function refreshProfile() {
    if (!auth.token) return
    setProfileLoading(true)
    setProfileError(false)
    try {
      const user = await getUserProfile(auth.token)
      const nextAuth = { user, token: auth.token }
      localStorage.setItem(storageKey, JSON.stringify(nextAuth))
      setAuth(nextAuth)
    } catch (error) {
      if (error.status === 401) logout()
      else setProfileError(true)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => { refreshProfile() }, [auth.token])

  async function login(credentials) {
    const data = await loginUser(credentials)
    saveAuth(data)
  }

  async function register(userDetails) {
    const data = await registerUser(userDetails)
    saveAuth(data)
  }

  function logout() {
    localStorage.removeItem(storageKey)
    setAuth({ user: null, token: null })
    setProfileError(false)
  }

  return (
    <AuthContext.Provider value={{ ...auth, isAuthenticated: Boolean(auth.user && auth.token), login, logout, profileError, profileLoading, refreshProfile, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider.')
  return context
}

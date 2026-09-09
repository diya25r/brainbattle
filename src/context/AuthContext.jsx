import { createContext, useContext, useState } from 'react'
import { loginUser, registerUser } from '../services/authService.js'

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

  function saveAuth(data) {
    const nextAuth = { user: data.user, token: data.token }
    localStorage.setItem(storageKey, JSON.stringify(nextAuth))
    setAuth(nextAuth)
  }

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
  }

  return (
    <AuthContext.Provider value={{ ...auth, isAuthenticated: Boolean(auth.user && auth.token), login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider.')
  return context
}

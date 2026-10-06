import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext.jsx'

const SocketContext = createContext(null)

function socketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL
  const apiUrl = import.meta.env.VITE_API_URL
  return apiUrl ? apiUrl.replace(/\/api\/?$/, '') : 'http://localhost:5000'
}

export function SocketProvider({ children }) {
  const { token } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [token])

  useEffect(() => () => { socketRef.current?.disconnect(); socketRef.current = null }, [])

  const connect = useCallback(() => {
    if (!token) return null
    if (!socketRef.current) socketRef.current = io(socketUrl(), { autoConnect: false, auth: { token }, reconnection: true })
    socketRef.current.auth = { token }
    if (!socketRef.current.connected) socketRef.current.connect()
    return socketRef.current
  }, [token])

  const value = useMemo(() => ({ connect }), [connect])

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) throw new Error('useSocket must be used within a SocketProvider.')
  return context
}

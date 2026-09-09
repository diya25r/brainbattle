import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import DashboardPlaceholder from '../pages/DashboardPlaceholder.jsx'
import './AppShell.css'

function AppShell() {
  const [mode, setMode] = useState('login')
  const { isAuthenticated } = useAuth()

  return (
    <main className="app-shell" aria-label="BrainBattle application">
      <div className="app-shell__glow app-shell__glow--violet" />
      <div className="app-shell__glow app-shell__glow--pink" />
      {isAuthenticated ? <DashboardPlaceholder /> : <AuthPage mode={mode} onModeChange={setMode} />}
    </main>
  )
}

export default AppShell

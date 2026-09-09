import { useState } from 'react'
import AuthPage from '../pages/AuthPage.jsx'
import './AppShell.css'

function AppShell() {
  const [mode, setMode] = useState('login')

  return (
    <main className="app-shell" aria-label="BrainBattle application">
      <div className="app-shell__glow app-shell__glow--violet" />
      <div className="app-shell__glow app-shell__glow--pink" />
      <AuthPage mode={mode} onModeChange={setMode} />
    </main>
  )
}

export default AppShell

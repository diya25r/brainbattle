import './AppShell.css'

function AppShell() {
  return (
    <main className="app-shell" aria-label="BrainBattle application">
      <div className="app-shell__glow app-shell__glow--violet" />
      <div className="app-shell__glow app-shell__glow--pink" />
      <div className="app-shell__content">
        <p className="app-shell__brand">BRAIN<span>BATTLE</span></p>
        <p className="app-shell__status">Interface foundation ready</p>
      </div>
    </main>
  )
}

export default AppShell

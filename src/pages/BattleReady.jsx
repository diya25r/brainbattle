import { Navigate } from 'react-router-dom'
import './BattleSetup.css'

function BattleReady() {
  const battle = sessionStorage.getItem('brainbattle-battle')
  if (!battle) return <Navigate replace to="/battle" />

  return (
    <>
      <header className="page-header">
        <p className="page-header__label">BATTLE</p>
        <h1>Battle Ready</h1>
        <p className="page-header__description">Your questions are ready.</p>
      </header>
      <section className="battle-ready__card">
        <span aria-hidden="true">✓</span>
        <h2>Battle setup complete</h2>
        <p>The quiz experience will arrive in Phase 7.</p>
      </section>
    </>
  )
}

export default BattleReady

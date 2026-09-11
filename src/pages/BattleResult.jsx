import { Link, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getBattleResult } from '../services/battleService.js'
import './BattleSetup.css'

function LegacyBattleResult() {
  return (
    <>
      <header className="page-header"><p className="page-header__label">BATTLE</p><h1>Battle Submitted</h1><p className="page-header__description">Your battle has been submitted successfully.</p></header>
      <section className="battle-ready__card">
        <span aria-hidden="true">✓</span>
        <h2>Submission complete</h2>
        <p>Score and XP will be shown here in the next phase.</p>
        <Link className="battle-result__link" to="/dashboard">BACK TO DASHBOARD</Link>
      </section>
    </>
  )
}

function BattleResult() {
  const { battleId } = useParams()
  const { token, user, refreshProfile } = useAuth()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const loadResult = useCallback(async () => {
    try { const data = await getBattleResult(token, battleId); setResult(data.result) } catch (requestError) { setError(requestError.message) }
  }, [battleId, token])
  useEffect(() => { loadResult() }, [loadResult])
  useEffect(() => { if (result) refreshProfile() }, [result])
  if (error) return <section className="battle-ready__card"><h2>Results unavailable</h2><p>{error}</p><Link className="battle-result__link" to={`/battle/${battleId}`}>RETURN TO BATTLE</Link></section>
  if (!result) return <p className="page-state">Loading authoritative battle results...</p>
  const iAmCreator = result.creator.id === user.id
  const me = iAmCreator ? result.creator : result.opponent
  const opponent = iAmCreator ? result.opponent : result.creator
  const outcome = !result.winner ? "IT'S A DRAW!" : result.winner === user.id ? 'YOU WON' : 'BETTER LUCK NEXT TIME'
  return <><header className="page-header"><p className="page-header__label">BATTLE</p><h1>BATTLE COMPLETE</h1><p className="page-header__description">{me.name} VS {opponent.name}</p></header><section className="battle-ready__card"><h2>{me.score} — {opponent.score}</h2><p>{outcome}</p><p>Your Accuracy: {me.accuracy}%</p><small>XP EARNED</small><strong>+{result.xpEarned} XP</strong><Link className="battle-result__link" to="/dashboard">BACK TO DASHBOARD</Link></section></>
}

export default BattleResult

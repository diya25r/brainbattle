import { Link, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getBattleResult } from '../services/battleService.js'
import './BattleSetup.css'
import './BattleResult.css'

function BattleResult() {
  const { battleId } = useParams()
  const { token, user, refreshProfile } = useAuth()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const loadResult = useCallback(async () => {
    try { const data = await getBattleResult(token, battleId); setResult(data.result) } catch (requestError) { setError(requestError.message) }
  }, [battleId, token])
  useEffect(() => { loadResult() }, [loadResult])
  useEffect(() => { if (result) refreshProfile() }, [refreshProfile, result])
  if (error) return <section className="battle-ready__card"><h2>Results unavailable</h2><p>{error}</p><Link className="battle-result__link" to={`/battle/${battleId}`}>RETURN TO BATTLE</Link></section>
  if (!result) return <p className="page-state">Loading authoritative battle results...</p>
  const iAmCreator = result.creator.id === user.id
  const me = iAmCreator ? result.creator : result.opponent
  const opponent = iAmCreator ? result.opponent : result.creator
  const outcome = !result.winner ? "IT'S A DRAW" : result.winner === user.id ? 'YOU WON' : 'YOU LOST'
  return <><header className="page-header"><p className="page-header__label">BATTLE</p><h1>BATTLE COMPLETE</h1><p className="page-header__description">{me.name} VS {opponent.name}</p></header><section className="battle-ready__card battle-result"><p className="battle-result__outcome">{outcome}</p><div className="battle-result__scores"><div><small>YOUR SCORE</small><strong>{me.score}</strong><span>{me.accuracy}% accuracy</span></div><b>VS</b><div><small>OPPONENT SCORE</small><strong>{opponent.score}</strong><span>{opponent.accuracy}% accuracy</span></div></div><p>{me.score} correct of {result.questionCount}. +{result.xpEarned} XP earned.</p><div className="battle-result__actions"><Link className="battle-result__link" to="/battle">BATTLE AGAIN</Link><Link className="battle-result__link battle-result__link--secondary" to="/history">VIEW HISTORY</Link><Link className="battle-result__link battle-result__link--secondary" to="/dashboard">DASHBOARD</Link></div></section></>
}

export default BattleResult

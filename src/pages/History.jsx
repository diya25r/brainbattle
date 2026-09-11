import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getBattleHistory } from '../services/userService.js'
import './Insights.css'

const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Recently completed'

function History() {
  const { token } = useAuth()
  const [battles, setBattles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadHistory = useCallback(async () => { setLoading(true); setError(''); try { const data = await getBattleHistory(token); setBattles(data.battles || []) } catch (requestError) { setError(requestError.message) } finally { setLoading(false) } }, [token])
  useEffect(() => { loadHistory() }, [loadHistory])
  return <><header className="page-header"><p className="page-header__label">BATTLE HISTORY</p><h1>Your past battles</h1><p className="page-header__description">Review completed battles and see how each challenge went.</p></header>
    {loading && <p className="page-state">Loading your battle history...</p>}
    {!loading && error && <section className="insights-state"><h2>History unavailable</h2><p>{error}</p><button onClick={loadHistory} type="button">TRY AGAIN</button></section>}
    {!loading && !error && battles.length === 0 && <section className="insights-state"><h2>No battles yet</h2><p>Complete your first battle to see your history here.</p></section>}
    {!loading && !error && battles.length > 0 && <section className="history-list" aria-label="Completed battles">{battles.map((battle) => <article className="history-card" key={battle._id}><div className="history-card__main"><span className={`result-badge result-badge--${battle.result.toLowerCase()}`}>{battle.result}</span><div><h2>{battle.subject}</h2><p>{battle.topic} <span>·</span> {battle.difficulty}</p></div></div><dl className="history-card__details"><div><dt>OPPONENT</dt><dd>{battle.opponent?.name || 'Opponent'}</dd></div><div><dt>SCORE</dt><dd>You: {battle.myScore} <span>·</span> Opponent: {battle.opponentScore}</dd></div><div><dt>DATE</dt><dd>{formatDate(battle.completedAt || battle.createdAt)}</dd></div><div><dt>BATTLE CODE</dt><dd>{battle.battleCode}</dd></div></dl></article>)}</section>}
  </>
}

export default History

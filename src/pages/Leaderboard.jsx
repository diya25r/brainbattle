import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getLeaderboard } from '../services/userService.js'
import './Insights.css'

function Leaderboard() {
  const { token, user } = useAuth(); const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const loadLeaderboard = useCallback(async () => { setLoading(true); setError(''); try { setData(await getLeaderboard(token)) } catch (requestError) { setError(requestError.message) } finally { setLoading(false) } }, [token])
  useEffect(() => { loadLeaderboard() }, [loadLeaderboard])
  if (loading) return <p className="page-state">Loading the leaderboard...</p>
  if (error) return <section className="insights-state"><h2>Leaderboard unavailable</h2><p>{error}</p><button onClick={loadLeaderboard} type="button">TRY AGAIN</button></section>
  if (!data.leaderboard?.length) return <><header className="page-header"><p className="page-header__label">LEADERBOARD</p><h1>Top players</h1></header><section className="insights-state"><h2>No players to rank yet</h2><p>Complete a battle to start the leaderboard.</p></section></>
  const currentUserIsListed = data.leaderboard.some((entry) => entry.userId === user.id)
  return <><header className="page-header"><p className="page-header__label">LEADERBOARD</p><h1>Top players</h1><p className="page-header__description">Ranked by XP, then wins. The top 50 players are shown.</p></header><section className="leaderboard" aria-label="Player leaderboard"><div className="leaderboard__head"><span>RANK</span><span>PLAYER</span><span>LEVEL</span><span>XP</span><span>WINS</span></div>{data.leaderboard.map((entry) => <article className={`leaderboard__row ${entry.userId === user.id ? 'leaderboard__row--current' : ''}`} key={entry.userId}><span className={`leaderboard__rank leaderboard__rank--${entry.rank}`}>#{entry.rank}</span><strong>{entry.name}{entry.userId === user.id && <small> YOU</small>}</strong><span>Level {entry.level}</span><span>{entry.xp.toLocaleString()}</span><span>{entry.wins}</span></article>)}</section>{!currentUserIsListed && data.currentUser && <section className="your-rank"><p>YOUR RANK</p><div><strong>#{data.currentUser.rank}</strong><span>{data.currentUser.name}</span><span>Level {data.currentUser.level} · {data.currentUser.xp.toLocaleString()} XP</span></div></section>}</>
}
export default Leaderboard

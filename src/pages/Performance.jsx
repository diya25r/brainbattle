import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getPerformance } from '../services/userService.js'
import './Insights.css'

const statLabels = [['Total Battles', 'totalBattles'], ['Wins', 'wins'], ['Losses', 'losses'], ['Draws', 'draws']]
function Performance() {
  const { token } = useAuth(); const [performance, setPerformance] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const loadPerformance = useCallback(async () => { setLoading(true); setError(''); try { const data = await getPerformance(token); setPerformance(data.performance) } catch (requestError) { setError(requestError.message) } finally { setLoading(false) } }, [token])
  useEffect(() => { loadPerformance() }, [loadPerformance])
  if (loading) return <p className="page-state">Loading your performance...</p>
  if (error) return <section className="insights-state"><h2>Performance unavailable</h2><p>{error}</p><button onClick={loadPerformance} type="button">TRY AGAIN</button></section>
  const progress = Math.min(100, (performance.currentLevelXP / 500) * 100)
  return <><header className="page-header"><p className="page-header__label">PERFORMANCE</p><h1>Know your game</h1><p className="page-header__description">Your results are calculated from completed battles.</p></header><section className="performance-grid" aria-label="Battle statistics">{statLabels.map(([label, key]) => <article className="performance-stat" key={key}><p>{label}</p><strong>{performance[key]}</strong></article>)}<article className="performance-stat"><p>Win Rate</p><strong>{performance.winRate}%</strong></article><article className="performance-stat"><p>Accuracy</p><strong>{performance.accuracy}%</strong><small>{performance.totalCorrect} correct from {performance.totalQuestions} answered</small></article></section><section className="level-card"><div className="level-card__heading"><div><p>XP & LEVEL</p><h2>LEVEL {performance.level}</h2></div><strong>{performance.totalXP.toLocaleString()} XP</strong></div><div aria-label={`${Math.round(progress)} percent to next level`} aria-valuemax="100" aria-valuemin="0" aria-valuenow={progress} className="level-card__track" role="progressbar"><span style={{ width: `${progress}%` }} /></div><p className="level-card__remaining">{performance.nextLevelXP} XP to Level {performance.level + 1}</p></section></>
}
export default Performance

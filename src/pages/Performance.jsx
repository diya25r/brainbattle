
/**
 * JavaScript Hoisting in BrainBattle
 
 */

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getPerformance } from '../services/userService.js'
import './Insights.css'

// const declaration: initialized when execution reaches this line.
// Cannot be accessed before initialization.
const statLabels = [
  ['Total Battles', 'totalBattles'],
  ['Wins', 'wins'],
  ['Losses', 'losses'],
  ['Draws', 'draws']
]

// Function declaration.
// Function declarations are completely hoisted.
// JavaScript knows about this function before execution.
function Performance() {

  // const and let declarations are hoisted,
  // but remain in the Temporal Dead Zone until initialized.
  const { token } = useAuth()

  // State variables are initialized when execution reaches these lines.
  const [performance, setPerformance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Function expression stored in a const variable.
  // Unlike a function declaration, it cannot be called
  // before this const variable is initialized.
  const loadPerformance = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getPerformance(token)
      setPerformance(data.performance)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  // useEffect calls loadPerformance after rendering.
  // loadPerformance has already been initialized above.
  useEffect(() => {
    loadPerformance()
  }, [loadPerformance])

  if (loading) {
    return <p className="page-state">Loading your performance...</p>
  }

  if (error) {
    return (
      <section className="insights-state">
        <h2>Performance unavailable</h2>
        <p>{error}</p>
        <button onClick={loadPerformance} type="button">
          TRY AGAIN
        </button>
      </section>
    )
  }

  const progress = Math.min(
    100,
    (performance.currentLevelXP / 500) * 100
  )

  return (
    <>
      <header className="page-header">
        <p className="page-header__label">PERFORMANCE</p>
        <h1>Know your game</h1>
        <p className="page-header__description">
          Your results are calculated from completed battles.
        </p>
      </header>

      <section className="performance-grid" aria-label="Battle statistics">
        {statLabels.map(([label, key]) => (
          <article className="performance-stat" key={key}>
            <p>{label}</p>
            <strong>{performance[key]}</strong>
          </article>
        ))}
      </section>

      <section className="level-card">
        <div className="level-card__heading">
          <div>
            <p>XP & LEVEL</p>
            <h2>LEVEL {performance.level}</h2>
          </div>
          <strong>{performance.totalXP.toLocaleString()} XP</strong>
        </div>

        <div
          aria-label={`${Math.round(progress)} percent to next level`}
          aria-valuemax="100"
          aria-valuemin="0"
          aria-valuenow={progress}
          className="level-card__track"
          role="progressbar"
        >
          <span style={{ width: `${progress}%` }} />
        </div>

        <p className="level-card__remaining">
          {performance.nextLevelXP} XP to Level {performance.level + 1}
        </p>
      </section>
    </>
  )
}

export default Performance

import { Link } from 'react-router-dom'

function QuickBattleCard({ description, icon, subject }) {
  return (
    <article className="subject-card">
      <span className="subject-card__icon" aria-hidden="true">{icon}</span>
      <h3>{subject}</h3>
      <p>{description}</p>
      <Link to="/battle">START <span>→</span></Link>
    </article>
  )
}

export default QuickBattleCard

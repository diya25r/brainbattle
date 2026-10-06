import { useAuth } from '../context/AuthContext.jsx'

function DashboardPlaceholder() {
  const { logout, user } = useAuth()

  return (
    <section className="auth-page">
      <div className="auth-card auth-card--placeholder">
        <p className="auth-card__brand">BRAIN<span>BATTLE</span></p>
        <p className="auth-card__kicker">SIGNED IN</p>
        <h1 className="auth-card__title">Welcome, {user.name}.</h1>
        <p className="auth-card__placeholder-copy">Your dashboard will be built in a later phase.</p>
        <button className="auth-card__submit" onClick={logout} type="button">LOG OUT</button>
      </div>
    </section>
  )
}

export default DashboardPlaceholder

import { Link } from 'react-router-dom'
import QuickBattleCard from '../components/dashboard/QuickBattleCard.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import XPProgress from '../components/dashboard/XPProgress.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './Dashboard.css'

const subjects = [
  ['\u2615', 'Java', 'Test your Java knowledge.'],
  ['\u25A3', 'DBMS', 'Master database concepts.'],
  ['\u2318', 'Web Development', 'Challenge your web skills.'],
  ['\u25C8', 'Aptitude', 'Sharpen your problem solving.'],
]

function Dashboard() {
  const { profileError, profileLoading, user } = useAuth()

  if (profileLoading) return <p className="page-state">Loading your BrainBattle profile...</p>
  if (profileError) return <p className="page-state">Unable to load your profile. Please try again.</p>

  return (
    <>
      <section className="page-header dashboard__hero">
        <div>
          <p className="page-header__label">DASHBOARD</p>
          <h1>Hey, {user.name} <span aria-label="wave">{'\u{1F44B}'}</span></h1>
          <p className="page-header__description">Ready for your next battle?</p>
        </div>
        <Link className="dashboard__battle-button" to="/battle">START A BATTLE <span aria-hidden="true">{'\u2694'}</span></Link>
      </section>

      <section className="dashboard__stats" aria-label="Your stats">
        <StatCard label="LEVEL" value={`LEVEL ${user.level}`} />
        <StatCard label="XP" value={`${user.xp} XP`} />
      </section>
      <XPProgress level={user.level} xp={user.xp} />

      <section className="quick-battle">
        <div className="quick-battle__heading">
          <div><p>CHOOSE A SUBJECT</p><h2>QUICK BATTLE</h2></div>
          <Link to="/battle">VIEW ALL</Link>
        </div>
        <div className="quick-battle__grid">
          {subjects.map(([icon, subject, description]) => <QuickBattleCard description={description} icon={icon} key={subject} subject={subject} />)}
        </div>
      </section>
    </>
  )
}

export default Dashboard

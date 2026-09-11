import { useAuth } from '../context/AuthContext.jsx'
import XPProgress from '../components/dashboard/XPProgress.jsx'
import './Insights.css'
import './Profile.css'

function Profile() {
  const { profileError, profileLoading, refreshProfile, user } = useAuth()
  if (profileLoading) return <p className="page-state">Loading your profile...</p>
  if (profileError) return <section className="insights-state"><h2>Profile unavailable</h2><p>Unable to load your profile. Please check that the backend is running.</p><button onClick={refreshProfile} type="button">TRY AGAIN</button></section>
  return <><header className="page-header"><p className="page-header__label">PROFILE</p><h1>Your player profile</h1><p className="page-header__description">Your account and progression details.</p></header><section className="profile-card"><div className="profile-card__identity"><span aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span><div><h2>{user.name}</h2><p>{user.email}</p></div></div><dl><div><dt>CURRENT LEVEL</dt><dd>Level {user.level}</dd></div><div><dt>TOTAL XP</dt><dd>{user.xp.toLocaleString()} XP</dd></div></dl><XPProgress level={user.level} xp={user.xp} /></section></>
}

export default Profile

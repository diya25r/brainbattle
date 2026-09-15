import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const navigation = [
  ['Dashboard', '/dashboard'],
  ['Battle', '/battle'],
  ['History', '/history'],
  ['Performance', '/performance'],
  ['Profile', '/profile'],
]

function Sidebar() {
  const { logout } = useAuth()

  return (
    <aside className="sidebar">
      <p className="sidebar__brand">BRAIN <span>BATTLE</span></p>
      <nav className="sidebar__nav" aria-label="Main navigation">
        {navigation.map(([label, path]) => <NavLink className="sidebar__link" key={path} to={path}>{label}</NavLink>)}
      </nav>
      <button className="sidebar__logout" onClick={logout} type="button">LOGOUT</button>
    </aside>
  )
}

export default Sidebar

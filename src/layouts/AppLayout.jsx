import { Outlet } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import './AppLayout.css'

function AppLayout() {
  return (
    <div className="authenticated-layout">
      <Sidebar />
      <main className="authenticated-layout__main"><div className="page-content"><Outlet /></div></main>
    </div>
  )
}

export default AppLayout

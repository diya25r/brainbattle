import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import BattleSetup from '../pages/BattleSetup.jsx'
import BattleReady from '../pages/BattleReady.jsx'
import PlaceholderPage from '../pages/PlaceholderPage.jsx'
import AppLayout from './AppLayout.jsx'
import './AppShell.css'

function AppShell() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="app-shell" aria-label="BrainBattle application">
      <div className="app-shell__glow app-shell__glow--violet" />
      <div className="app-shell__glow app-shell__glow--pink" />
      <Routes>
        <Route element={isAuthenticated ? <Navigate replace to="/dashboard" /> : <AuthPage mode="login" />} path="/login" />
        <Route element={isAuthenticated ? <Navigate replace to="/dashboard" /> : <AuthPage mode="signup" />} path="/signup" />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route element={<Dashboard />} path="/dashboard" />
          <Route element={<BattleSetup />} path="/battle" />
          <Route element={<BattleReady />} path="/battle/quiz" />
          <Route element={<PlaceholderPage title="History" />} path="/history" />
          <Route element={<PlaceholderPage title="Performance" />} path="/performance" />
          <Route element={<PlaceholderPage title="Leaderboard" />} path="/leaderboard" />
          <Route element={<PlaceholderPage title="Profile" />} path="/profile" />
        </Route>
        <Route element={<Navigate replace to={isAuthenticated ? '/dashboard' : '/login'} />} path="*" />
      </Routes>
    </main>
  )
}

export default AppShell

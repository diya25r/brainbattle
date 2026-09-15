import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import BattleSetup from '../pages/BattleSetup.jsx'
import QuizBattle from '../pages/QuizBattle.jsx'
import BattleResult from '../pages/BattleResult.jsx'
import BattleRoom from '../pages/BattleRoom.jsx'
import History from '../pages/History.jsx'
import Performance from '../pages/Performance.jsx'
import Profile from '../pages/Profile.jsx'
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
          <Route element={<QuizBattle />} path="/battle/:battleId/play" />
          <Route element={<BattleRoom />} path="/battle/:battleId" />
          <Route element={<BattleResult />} path="/battle/result/:battleId" />
          <Route element={<BattleResult />} path="/battle/:battleId/result" />
          <Route element={<History />} path="/history" />
          <Route element={<Performance />} path="/performance" />
          <Route element={<Profile />} path="/profile" />
        </Route>
        <Route element={<Navigate replace to={isAuthenticated ? '/dashboard' : '/login'} />} path="*" />
      </Routes>
    </main>
  )
}

export default AppShell

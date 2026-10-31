import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import DashboardLayout from './components/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import WorkoutPlanner from './pages/WorkoutPlanner'
import ProgressPhotos from './pages/ProgressPhotos'
import Analytics from './pages/Analytics'
import AiAnalysis from './pages/AiAnalysis'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/app" element={<Protected><DashboardLayout /></Protected>}>
        <Route index element={<DashboardHome />} />
        <Route path="planner" element={<WorkoutPlanner />} />
        <Route path="photos" element={<ProgressPhotos />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-analysis" element={<AiAnalysis />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

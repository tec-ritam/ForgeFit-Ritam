import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const DashboardLayout = lazy(() => import('./components/DashboardLayout'))
const DashboardHome = lazy(() => import('./pages/DashboardHome'))
const WorkoutPlanner = lazy(() => import('./pages/WorkoutPlanner'))
const ProgressPhotos = lazy(() => import('./pages/ProgressPhotos'))
const Analytics = lazy(() => import('./pages/Analytics'))
const AiAnalysis = lazy(() => import('./pages/AiAnalysis'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Pricing = lazy(() => import('./pages/Pricing'))

function Fallback() {
  return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Loading...</div>
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
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
    </Suspense>
  )
}

import { useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Dumbbell, Camera, BarChart3, Bot, User, Settings,
  LogOut, Menu, X, Flame,
} from 'lucide-react'
import { useAuth } from '../lib/auth'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/planner', label: 'Workout Planner', icon: Dumbbell },
  { to: '/app/photos', label: 'Progress Photos', icon: Camera },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/ai-analysis', label: 'AI Analysis', icon: Bot },
  { to: '/app/profile', label: 'Profile', icon: User },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const nav2 = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    nav2('/')
  }

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <Link to="/app" className="flex items-center gap-2 font-display font-bold text-xl text-white px-2 py-1">
        <span className="w-9 h-9 rounded-xl bg-brand-400 text-ink-950 grid place-items-center"><Dumbbell className="w-5 h-5" /></span>
        ForgeFit
      </Link>
      <div className="mt-6 flex-1 space-y-1">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? 'bg-brand-400/15 text-brand-300 border border-brand-400/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <n.icon className="w-[18px] h-[18px]" />
            {n.label}
          </NavLink>
        ))}
      </div>
      <div className="glass rounded-xl p-3 mt-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 grid place-items-center text-ink-950 font-bold text-sm">
            {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white text-sm font-medium truncate">{profile?.full_name || 'Athlete'}</div>
            <div className="text-xs text-slate-500 truncate">{profile?.email}</div>
          </div>
        </div>
        <button onClick={handleSignOut} className="btn-ghost w-full mt-2 text-sm py-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-white/5 bg-ink-900/40 backdrop-blur-xl p-4 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-ink-900 border-r border-white/10 p-4 z-50 lg:hidden"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 backdrop-blur-xl bg-ink-950/70 border-b border-white/5 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setOpen(true)} className="text-slate-300"><Menu className="w-6 h-6" /></button>
          <Link to="/app" className="flex items-center gap-2 font-display font-bold text-white">
            <span className="w-7 h-7 rounded-lg bg-brand-400 text-ink-950 grid place-items-center"><Dumbbell className="w-4 h-4" /></span>
            ForgeFit
          </Link>
          <div className="flex items-center gap-1 text-brand-300 text-sm font-medium">
            <Flame className="w-4 h-4" /> {profile?.streak ?? 0}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

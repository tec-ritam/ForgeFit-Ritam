import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Dumbbell, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) toast(error, 'error')
    else { toast('Welcome back!'); nav('/app') }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your journey">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="email" className="input pl-10" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type={showPassword ? "text" : "password"} className="input pl-10 pr-10" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-300 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-brand-300 hover:text-brand-200">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in...' : <>Sign In <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
      <Divider />
      <button onClick={signInWithGoogle} className="btn-outline w-full">
        <GoogleIcon /> Continue with Google
      </button>
      <p className="mt-6 text-center text-sm text-slate-400">
        Don't have an account? <Link to="/register" className="text-brand-300 hover:text-brand-200 font-medium">Sign up</Link>
      </p>
    </AuthShell>
  )
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -z-10 top-1/4 left-1/4 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" />
      <div className="absolute -z-10 bottom-1/4 right-1/4 w-72 h-72 bg-accent-500/15 rounded-full blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="card p-7 sm:p-8 w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-white mb-6">
          <span className="w-9 h-9 rounded-xl bg-brand-400 text-ink-950 grid place-items-center"><Dumbbell className="w-5 h-5" /></span>
          ForgeFit
        </Link>
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        <p className="text-slate-400 text-sm mt-1 mb-6">{subtitle}</p>
        {children}
      </motion.div>
    </div>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px bg-white/10 flex-1" />
      <span className="text-xs text-slate-500">or</span>
      <div className="h-px bg-white/10 flex-1" />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}

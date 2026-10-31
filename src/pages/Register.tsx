import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { AuthShell } from './Login'

export default function Register() {
  const { signUp, signInWithGoogle } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return }
    setLoading(true)
    const { error } = await signUp(email, password, name)
    setLoading(false)
    if (error) toast(error, 'error')
    else { toast('Account created! Welcome to ForgeFit.'); nav('/app') }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start tracking your transformation today">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input pl-10" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        </div>
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
            <input type="password" className="input pl-10" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account...' : <>Create Account <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
      <div className="flex items-center gap-3 my-5">
        <div className="h-px bg-white/10 flex-1" />
        <span className="text-xs text-slate-500">or</span>
        <div className="h-px bg-white/10 flex-1" />
      </div>
      <button onClick={signInWithGoogle} className="btn-outline w-full">Continue with Google</button>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account? <Link to="/login" className="text-brand-300 hover:text-brand-200 font-medium">Log in</Link>
      </p>
    </AuthShell>
  )
}

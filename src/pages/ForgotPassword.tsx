import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { AuthShell } from './Login'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) toast(error, 'error')
    else { setSent(true); toast('Reset link sent to your email') }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="We've sent you a password reset link">
        <div className="text-center py-6">
          <CheckCircle2 className="w-16 h-16 text-brand-400 mx-auto mb-4" />
          <p className="text-slate-300">If an account exists for <span className="text-white font-medium">{email}</span>, you'll receive a reset link shortly.</p>
          <Link to="/login" className="btn-outline mt-6 inline-flex">Back to Login</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Forgot password" subtitle="Enter your email to reset your password">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="email" className="input pl-10" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Sending...' : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Remember your password? <Link to="/login" className="text-brand-300 hover:text-brand-200 font-medium">Log in</Link>
      </p>
    </AuthShell>
  )
}

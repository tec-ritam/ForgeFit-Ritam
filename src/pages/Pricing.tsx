import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Dumbbell, ArrowLeft } from 'lucide-react'

const plans = [
  { name: 'Free', price: '$0', period: '/mo', features: ['Workout planner', 'Rep & set counter', '7-day photo history', 'Basic analytics'], cta: 'Start Free', highlight: false },
  { name: 'Pro', price: '$9', period: '/mo', features: ['Everything in Free', 'Unlimited photo storage', 'AI physique analysis', 'Advanced charts', 'Daily reminders'], cta: 'Go Pro', highlight: true },
  { name: 'Premium', price: '$19', period: '/mo', features: ['Everything in Pro', 'Weekly AI reports', 'Personalized suggestions', 'Priority support', 'Export data'], cta: 'Get Premium', highlight: false },
]

export default function Pricing() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-sm"><ArrowLeft className="w-4 h-4" /> Back home</Link>
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 font-display font-bold text-2xl text-white mb-4">
            <span className="w-10 h-10 rounded-xl bg-brand-400 text-ink-950 grid place-items-center"><Dumbbell className="w-5 h-5" /></span>
            ForgeFit
          </div>
          <h1 className="section-title">Choose your <span className="gradient-text">plan</span></h1>
          <p className="mt-4 text-slate-400">Start free. Upgrade when you're ready to unlock AI features.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`card p-7 relative ${p.highlight ? 'border-brand-400/40 shadow-glow' : ''}`}>
              {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 chip bg-brand-400 text-ink-950 font-bold">Most Popular</div>}
              <h3 className="font-display text-xl font-bold text-white">{p.name}</h3>
              <div className="mt-3 flex items-end gap-1"><span className="text-4xl font-extrabold text-white">{p.price}</span><span className="text-slate-500 mb-1">{p.period}</span></div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => <li key={f} className="flex items-start gap-2 text-slate-300"><Check className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" /> {f}</li>)}
              </ul>
              <Link to="/register" className={`mt-7 w-full ${p.highlight ? 'btn-primary' : 'btn-outline'}`}>{p.cta}</Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

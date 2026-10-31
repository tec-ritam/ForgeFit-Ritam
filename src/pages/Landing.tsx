import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Camera, CalendarClock, BarChart3, Dumbbell, Repeat, TrendingUp, Cloud, Bot,
  ArrowRight, Check, Mail, Globe, MessageSquare, Share2, Dumbbell as Logo,
} from 'lucide-react'

const features = [
  { icon: Camera, title: 'AI Body Progress Tracking', desc: 'Upload daily body photos and let AI track your visual transformation over time.' },
  { icon: CalendarClock, title: 'Daily Gym Reminder', desc: 'Never miss a session with smart workout, water, and protein reminders.' },
  { icon: BarChart3, title: 'Progress Analytics', desc: 'Interactive charts for weight, strength, body fat, and workout consistency.' },
  { icon: Dumbbell, title: 'Workout Planner', desc: 'Build weekly split routines with sets, reps, rest timers, and weight tracking.' },
  { icon: Repeat, title: 'Rep & Set Counter', desc: 'Tap to log every rep and set. Auto-saved with live completion percentage.' },
  { icon: TrendingUp, title: 'Muscle Growth Charts', desc: 'Visualize strength gains and muscle growth across every muscle group.' },
  { icon: Cloud, title: 'Cloud Photo Storage', desc: 'Your progress photos are stored securely and synced across all your devices.' },
  { icon: Bot, title: 'AI Physique Analysis', desc: 'Get an AI-powered physique score with body fat, symmetry, and posture insights.' },
]

const plans = [
  {
    name: 'Free', price: '$0', period: '/mo',
    features: ['Workout planner', 'Rep & set counter', '7-day photo history', 'Basic analytics'],
    cta: 'Start Free', highlight: false,
  },
  {
    name: 'Pro', price: '$9', period: '/mo',
    features: ['Everything in Free', 'Unlimited photo storage', 'AI physique analysis', 'Advanced charts', 'Daily reminders'],
    cta: 'Go Pro', highlight: true,
  },
  {
    name: 'Premium', price: '$19', period: '/mo',
    features: ['Everything in Pro', 'Weekly AI reports', 'Personalized suggestions', 'Priority support', 'Export data'],
    cta: 'Get Premium', highlight: false,
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-ink-950/60 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-white">
            <span className="w-9 h-9 rounded-xl bg-brand-400 text-ink-950 grid place-items-center"><Logo className="w-5 h-5" /></span>
            ForgeFit
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
            <Link to="/pricing" className="hover:text-white transition">Plans</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost text-sm px-4 py-2">Login</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-grid-dark [background-size:32px_32px] opacity-40" />
        <div className="absolute -z-10 top-20 left-1/4 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl animate-pulseGlow" />
        <div className="absolute -z-10 top-40 right-1/4 w-72 h-72 bg-accent-500/20 rounded-full blur-3xl animate-pulseGlow" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="chip bg-brand-400/10 text-brand-300 border border-brand-400/20 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" /> AI-Powered Fitness Tracking
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
              Track every rep.<br />
              <span className="gradient-text">Transform your body.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-400 max-w-md">
              ForgeFit uses AI to analyze your progress photos, track your workouts, and keep you accountable — all in one beautiful dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">Get Started Free <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/login" className="btn-outline">Login</Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-brand-400" /> No credit card</div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-brand-400" /> Cancel anytime</div>
            </div>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <div className="card p-5 animate-floaty">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-400">Today's Workout</div>
                <div className="chip bg-brand-400/10 text-brand-300">In Progress</div>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Bench Press', sets: '3/4', pct: 75 },
                  { name: 'Incline Dumbbell', sets: '2/3', pct: 66 },
                  { name: 'Tricep Pushdown', sets: '1/3', pct: 33 },
                ].map((e) => (
                  <div key={e.name} className="glass rounded-xl p-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-200">{e.name}</span>
                      <span className="text-slate-400">{e.sets}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${e.pct}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-gradient-to-r from-brand-400 to-accent-400" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[['Streak', '12d'], ['Volume', '4.2t'], ['Calories', '580']].map(([k, v]) => (
                  <div key={k} className="glass rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-white">{v}</div>
                    <div className="text-xs text-slate-500">{k}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-4 -right-4 card p-3 w-40 hidden sm:block animate-floaty" style={{ animationDelay: '1s' }}>
              <div className="text-xs text-slate-400 mb-1">Physique Score</div>
              <div className="text-2xl font-bold gradient-text">8.4</div>
              <div className="text-xs text-brand-300">+0.6 this week</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="section-title">Everything you need to <span className="gradient-text">level up</span></h2>
            <p className="mt-4 text-slate-400">A complete toolkit for serious lifters — from your first rep to your hundredth PR.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="card p-6 hover:border-brand-400/30 hover:bg-white/[0.07] transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-400/10 text-brand-300 grid place-items-center mb-4 group-hover:scale-110 transition">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="section-title">Simple, <span className="gradient-text">honest pricing</span></h2>
            <p className="mt-4 text-slate-400">Start free. Upgrade when you're ready to go all in.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`card p-7 relative ${p.highlight ? 'border-brand-400/40 shadow-glow' : ''}`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 chip bg-brand-400 text-ink-950 font-bold">Most Popular</div>
                )}
                <h3 className="font-display text-xl font-bold text-white">{p.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-white">{p.price}</span>
                  <span className="text-slate-500 mb-1">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" /> {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`mt-7 w-full ${p.highlight ? 'btn-primary' : 'btn-outline'}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="section-title">Get in <span className="gradient-text">touch</span></h2>
            <p className="mt-4 text-slate-400">Questions, feedback, or partnership ideas? Drop us a line.</p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); (e.target as HTMLFormElement).reset() }}
            className="card p-6 sm:p-8 space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label">Name</label><input className="input" placeholder="Your name" required /></div>
              <div><label className="label">Email</label><input type="email" className="input" placeholder="you@email.com" required /></div>
            </div>
            <div><label className="label">Message</label><textarea className="input min-h-[120px] resize-y" placeholder="How can we help?" required /></div>
            <button type="submit" className="btn-primary w-full">Send Message <Mail className="w-4 h-4" /></button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg text-white">
              <span className="w-8 h-8 rounded-lg bg-brand-400 text-ink-950 grid place-items-center"><Logo className="w-4 h-4" /></span>
              ForgeFit
            </Link>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full glass grid place-items-center text-slate-400 hover:text-brand-300 hover:border-brand-400/30 transition"><Globe className="w-4 h-4" /></a>
              <a href="#" className="w-10 h-10 rounded-full glass grid place-items-center text-slate-400 hover:text-brand-300 hover:border-brand-400/30 transition"><MessageSquare className="w-4 h-4" /></a>
              <a href="#" className="w-10 h-10 rounded-full glass grid place-items-center text-slate-400 hover:text-brand-300 hover:border-brand-400/30 transition"><Share2 className="w-4 h-4" /></a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-slate-600">© 2026 ForgeFit. Built for lifters, by lifters.</div>
        </div>
      </footer>
    </div>
  )
}

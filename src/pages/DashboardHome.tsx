import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Dumbbell, TrendingUp, Calendar, Plus, Check, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { WEEK_SPLIT, ACHIEVEMENT_DEFS, type Workout, type Exercise, type Achievement } from '../lib/types'

export default function DashboardHome() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [customTemplate, setCustomTemplate] = useState<any>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [weekData, setWeekData] = useState<{ day: string; done: number }[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [isFirstVisit, setIsFirstVisit] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('forgefit_has_visited')) {
      setIsFirstVisit(true)
      localStorage.setItem('forgefit_has_visited', 'true')
    }
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const defaultSplit = WEEK_SPLIT[todayIndex]

  const loadToday = useCallback(async () => {
    if (!user) return
    if (profile?.active_plan_type === 'custom') {
      const { data } = await supabase.from('custom_templates').select('*').eq('user_id', user.id).eq('day_index', todayIndex).maybeSingle()
      setCustomTemplate(data)
    }
    const { data: w } = await supabase.from('workouts').select('*').eq('user_id', user.id).eq('date', today).maybeSingle()
    if (w) {
      setWorkout(w as Workout)
      const { data: ex } = await supabase.from('exercises').select('*').eq('workout_id', w.id)
      setExercises((ex ?? []) as Exercise[])
    }
  }, [user, today, profile?.active_plan_type, todayIndex])

  const loadWeek = useCallback(async () => {
    if (!user) return
    const start = new Date(); start.setDate(start.getDate() - 6)
    const { data } = await supabase.from('workouts').select('date,completed').eq('user_id', user.id).gte('date', start.toISOString().slice(0, 10))
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const now = new Date()
    const map: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i)
      const key = d.toLocaleDateString('en-US', { weekday: 'short' })
      map[key] = 0
    }
    ;(data ?? []).forEach((w: any) => { if (w.completed) map[new Date(w.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })]++ })
    setWeekData(days.map((d) => ({ day: d, done: map[d] || 0 })))
  }, [user])

  const loadAchievements = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('achievements').select('*').eq('user_id', user.id)
    setAchievements((data ?? []) as Achievement[])
  }, [user])

  useEffect(() => {
    Promise.all([loadToday(), loadWeek(), loadAchievements()]).finally(() => setLoading(false))
  }, [loadToday, loadWeek, loadAchievements])

  const todaySplit = profile?.active_plan_type === 'custom'
    ? (customTemplate || { day_label: 'Custom Day', muscle_group: 'Rest / Custom', exercises: [] })
    : defaultSplit
  const dispMuscle = todaySplit.muscle_group || todaySplit.muscle

  async function startWorkout() {
    if (!user || workout) return
    const { data, error } = await supabase.from('workouts').insert({
      user_id: user.id, date: today, day_label: todaySplit.day_label || todaySplit.day, muscle_group: dispMuscle, completed: false,
    }).select('*').single()
    if (error) { toast('Could not start workout', 'error'); return }
    setWorkout(data as Workout)
    toast('Workout started. Let\'s go!')
  }

  async function addExercise(name: string) {
    if (!user || !workout) return
    const { data, error } = await supabase.from('exercises').insert({
      workout_id: workout.id, user_id: user.id, name, sets: 3, reps: 10, weight_kg: 0, rest_seconds: 60, completed: false,
    }).select('*').single()
    if (error) return
    setExercises((e) => [...e, data as Exercise])
  }

  async function toggleExercise(id: string, completed: boolean) {
    await supabase.from('exercises').update({ completed }).eq('id', id)
    
    let isAllComplete = false
    setExercises((prev) => {
      const next = prev.map((x) => x.id === id ? { ...x, completed } : x)
      isAllComplete = next.length > 0 && next.every((x) => x.completed)
      return next
    })

    setWorkout((prevWorkout) => {
      if (isAllComplete && prevWorkout && !prevWorkout.completed) {
        supabase.from('workouts').update({ completed: true }).eq('id', prevWorkout.id).then(() => {
          unlockAchievement('workout_done')
          toast('Workout complete! Great work. ⚡', 'success')
        })
        return { ...prevWorkout, completed: true }
      }
      return prevWorkout
    })
  }

  async function unlockAchievement(key: string) {
    if (!user) return
    const def = ACHIEVEMENT_DEFS.find((a) => a.key === key)
    if (!def) return
    const { error } = await supabase.from('achievements').upsert({ user_id: user.id, key, title: def.title }, { onConflict: 'user_id,key' })
    if (!error) {
      setAchievements((a) => a.some((x) => x.key === key) ? a : [...a, { id: key, user_id: user.id, key, title: def.title, unlocked_at: new Date().toISOString() }])
      toast(`Achievement unlocked: ${def.emoji} ${def.title}!`, 'success')
    }
  }

  const completedCount = exercises.filter((e) => e.completed).length
  const pct = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0

  if (loading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">{isFirstVisit ? 'Welcome, ' : 'Welcome back, '}{profile?.full_name?.split(' ')[0] || 'Athlete'}</h1>
          <p className="text-slate-400 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {dispMuscle}</p>
        </div>
        <div className="flex items-center gap-2 chip bg-brand-400/10 text-brand-300 border border-brand-400/20">
          <Flame className="w-4 h-4" /> {profile?.streak ?? 0} day streak
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Current Streak" value={`${profile?.streak ?? 0}d`} color="text-brand-300" />
        <StatCard icon={Dumbbell} label="This Week" value={`${weekData.filter((d) => d.done > 0).length}/7`} color="text-accent-400" />
        <StatCard icon={TrendingUp} label="Exercises Done" value={`${completedCount}`} color="text-gold-400" />
        <StatCard icon={Trophy} label="Achievements" value={`${achievements.length}`} color="text-brand-300" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's workout */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">Today's Workout</h2>
            {workout && <div className="chip bg-brand-400/10 text-brand-300">{pct}% complete</div>}
          </div>
          {!workout ? (
            <div className="text-center py-10">
              <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No workout logged yet. Ready to train {dispMuscle}?</p>
              <button onClick={startWorkout} className="btn-primary"><Plus className="w-4 h-4" /> Start Workout</button>
            </div>
          ) : exercises.length === 0 ? (
            <div>
              <p className="text-slate-400 text-sm mb-3">Add exercises from today's {dispMuscle} template:</p>
              <div className="flex flex-wrap gap-2">
                {todaySplit.exercises.map((ex: any) => (
                  <button key={ex.name} onClick={() => addExercise(ex.name)} className="chip glass hover:border-brand-400/30 hover:text-brand-300 transition">
                    <Plus className="w-3 h-3" /> {ex.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((ex) => (
                <motion.div key={ex.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`glass rounded-xl p-3 flex items-center gap-3 ${ex.completed ? 'opacity-60' : ''}`}>
                  <button
                    onClick={() => toggleExercise(ex.id, !ex.completed)}
                    className={`w-6 h-6 rounded-lg grid place-items-center transition ${ex.completed ? 'bg-brand-400 text-ink-950' : 'border border-white/15 text-transparent hover:border-brand-400/50'}`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <span className={`flex-1 text-sm ${ex.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{ex.name}</span>
                  <span className="text-xs text-slate-500">{ex.sets}×{ex.reps}</span>
                  <Link to="/app/planner" className="text-xs text-brand-300 hover:underline">Edit</Link>
                </motion.div>
              ))}
              <button onClick={() => {
                const remaining = todaySplit.exercises.filter((e: any) => !exercises.some((x) => x.name === e.name))
                if (remaining[0]) addExercise(remaining[0].name)
              }} className="btn-ghost text-sm py-2 mt-2"><Plus className="w-4 h-4" /> Add exercise</button>
            </div>
          )}
        </div>

        {/* Weekly summary */}
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-white mb-4">Weekly Summary</h2>
          <div className="space-y-2.5">
            {weekData.map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-8">{d.day}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: d.done > 0 ? '100%' : '0%' }}
                    transition={{ duration: 0.6 }}
                    className={`h-full ${d.done > 0 ? 'bg-gradient-to-r from-brand-400 to-accent-400' : ''}`}
                  />
                </div>
                {d.done > 0 ? <Check className="w-4 h-4 text-brand-400" /> : <span className="w-4" />}
              </div>
            ))}
          </div>
          <Link to="/app/analytics" className="btn-ghost text-sm w-full mt-4 py-2">View Analytics</Link>
        </div>
      </div>

      {/* Achievements preview */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold text-white mb-4">Recent Achievements</h2>
        {achievements.length === 0 ? (
          <p className="text-slate-400 text-sm">Complete workouts to unlock achievements. Keep going!</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {achievements.slice(0, 6).map((a) => {
              const def = ACHIEVEMENT_DEFS.find((d) => d.key === a.key)
              return (
                <div key={a.id} className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="text-xl">{def?.emoji || '🏆'}</span>
                  <div>
                    <div className="text-sm text-white font-medium">{a.title}</div>
                    <div className="text-xs text-slate-500">{def?.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="h-64 skeleton lg:col-span-2" />
        <div className="h-64 skeleton" />
      </div>
    </div>
  )
}

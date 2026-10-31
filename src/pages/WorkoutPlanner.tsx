import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Check, Timer, Dumbbell, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { WEEK_SPLIT, type Workout, type Exercise } from '../lib/types'

export default function WorkoutPlanner() {
  const { user } = useAuth()
  const toast = useToast()
  const [activeDay, setActiveDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [restTimer, setRestTimer] = useState<{ active: boolean; remaining: number } | null>(null)

  const split = WEEK_SPLIT[activeDay]
  const dateForDay = (() => {
    const now = new Date()
    const diff = activeDay - (now.getDay() === 0 ? 6 : now.getDay() - 1)
    const d = new Date(now); d.setDate(now.getDate() + diff)
    return d.toISOString().slice(0, 10)
  })()

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data: w } = await supabase.from('workouts').select('*').eq('user_id', user.id).eq('date', dateForDay).maybeSingle()
    setWorkout(w as Workout | null)
    if (w) {
      const { data: ex } = await supabase.from('exercises').select('*').eq('workout_id', (w as Workout).id)
      setExercises((ex ?? []) as Exercise[])
    } else setExercises([])
    setLoading(false)
  }, [user, dateForDay])

  useEffect(() => { load() }, [load])

  // Rest timer countdown
  useEffect(() => {
    if (!restTimer?.active) return
    if (restTimer.remaining <= 0) { setRestTimer(null); toast('Rest time over! Get back to it.'); return }
    const t = setTimeout(() => setRestTimer((r) => r ? { ...r, remaining: r.remaining - 1 } : null), 1000)
    return () => clearTimeout(t)
  }, [restTimer, toast])

  async function ensureWorkout(): Promise<Workout> {
    if (workout) return workout
    const { data, error } = await supabase.from('workouts').insert({
      user_id: user!.id, date: dateForDay, day_label: split.day, muscle_group: split.muscle, completed: false,
    }).select('*').single()
    if (error) { toast('Could not create workout', 'error'); throw error }
    setWorkout(data as Workout)
    return data as Workout
  }

  async function addExercise(name: string) {
    const w = await ensureWorkout()
    const { data, error } = await supabase.from('exercises').insert({
      workout_id: w.id, user_id: user!.id, name, sets: 3, reps: 10, weight_kg: 0, rest_seconds: 60, completed: false,
    }).select('*').single()
    if (!error) setExercises((e) => [...e, data as Exercise])
  }

  async function updateExercise(id: string, patch: Partial<Exercise>) {
    setExercises((e) => e.map((x) => x.id === id ? { ...x, ...patch } : x))
    await supabase.from('exercises').update(patch).eq('id', id)
  }

  async function removeExercise(id: string) {
    setExercises((e) => e.filter((x) => x.id !== id))
    await supabase.from('exercises').delete().eq('id', id)
  }

  async function toggleComplete(ex: Exercise) {
    const completed = !ex.completed
    await updateExercise(ex.id, { completed })
    const all = exercises.map((x) => x.id === ex.id ? { ...x, completed } : x)
    if (all.length > 0 && all.every((x) => x.completed) && workout && !workout.completed) {
      await supabase.from('workouts').update({ completed: true }).eq('id', workout.id)
      setWorkout({ ...workout, completed: true })
      toast('Workout complete! All exercises done. ⚡')
    }
  }

  const completedCount = exercises.filter((e) => e.completed).length
  const pct = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Workout Planner</h1>
        <p className="text-slate-400 text-sm mt-1">Build your weekly split and track every set.</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {WEEK_SPLIT.map((d, i) => (
          <button
            key={d.day}
            onClick={() => setActiveDay(i)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              i === activeDay ? 'bg-brand-400 text-ink-950' : 'glass text-slate-300 hover:text-white'
            }`}
          >
            <div>{d.day.slice(0, 3)}</div>
            <div className={`text-xs ${i === activeDay ? 'text-ink-900/70' : 'text-slate-500'}`}>{d.muscle.split(' ')[0]}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-white">{split.day} — {split.muscle}</h2>
          {exercises.length > 0 && <div className="text-sm text-slate-400 mt-0.5">{completedCount}/{exercises.length} exercises · {pct}%</div>}
        </div>
        {exercises.length > 0 && (
          <div className="w-32 h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div animate={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-brand-400 to-accent-400" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 skeleton" />)}</div>
      ) : split.exercises.length === 0 ? (
        <div className="card p-10 text-center">
          <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Rest day. Recover and recharge.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {exercises.map((ex) => (
              <motion.div key={ex.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                className={`card p-4 ${ex.completed ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleComplete(ex)}
                      className={`w-6 h-6 rounded-lg grid place-items-center transition ${ex.completed ? 'bg-brand-400 text-ink-950' : 'border border-white/15 text-transparent hover:border-brand-400/50'}`}>
                      <Check className="w-4 h-4" />
                    </button>
                    <span className={`font-medium ${ex.completed ? 'line-through text-slate-500' : 'text-white'}`}>{ex.name}</span>
                  </div>
                  <button onClick={() => removeExercise(ex.id)} className="text-slate-500 hover:text-rose-400 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Counter label="Sets" value={ex.sets} onDec={() => updateExercise(ex.id, { sets: Math.max(1, ex.sets - 1) })} onInc={() => updateExercise(ex.id, { sets: ex.sets + 1 })} />
                  <Counter label="Reps" value={ex.reps} onDec={() => updateExercise(ex.id, { reps: Math.max(1, ex.reps - 1) })} onInc={() => updateExercise(ex.id, { reps: ex.reps + 1 })} />
                  <Counter label="Weight (kg)" value={ex.weight_kg} step={2.5} onDec={() => updateExercise(ex.id, { weight_kg: Math.max(0, ex.weight_kg - 2.5) })} onInc={() => updateExercise(ex.id, { weight_kg: ex.weight_kg + 2.5 })} />
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">Rest</div>
                    <button onClick={() => setRestTimer({ active: true, remaining: ex.rest_seconds })}
                      className="w-full glass rounded-lg py-2 px-2 text-sm text-accent-400 hover:border-accent-400/30 transition flex items-center justify-center gap-1">
                      <Timer className="w-3.5 h-3.5" /> {ex.rest_seconds}s
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {exercises.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-slate-400 mb-4">No exercises yet. Add from the {split.muscle} template:</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {split.exercises.filter((e) => !exercises.some((x) => x.name === e.name)).map((ex) => (
              <button key={ex.name} onClick={() => addExercise(ex.name)} className="chip glass hover:border-brand-400/30 hover:text-brand-300 transition">
                <Plus className="w-3 h-3" /> {ex.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rest timer overlay */}
      <AnimatePresence>
        {restTimer?.active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 card p-5 w-64">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-300 flex items-center gap-1.5"><Timer className="w-4 h-4 text-accent-400" /> Rest Timer</span>
              <button onClick={() => setRestTimer(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-center text-4xl font-bold text-white tabular-nums">{restTimer.remaining}s</div>
            <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div animate={{ width: `${(restTimer.remaining / 60) * 100}%` }} className="h-full bg-accent-400" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Counter({ label, value, step = 1, onDec, onInc }: { label: string; value: number; step?: number; onDec: () => void; onInc: () => void }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1.5">{label}</div>
      <div className="flex items-center gap-1 glass rounded-lg p-1">
        <button onClick={onDec} className="w-7 h-7 rounded-md hover:bg-white/10 grid place-items-center text-slate-300"><Minus className="w-3.5 h-3.5" /></button>
        <span className="flex-1 text-center text-sm font-medium text-white tabular-nums">{step !== 1 ? value.toFixed(1) : value}</span>
        <button onClick={onInc} className="w-7 h-7 rounded-md hover:bg-white/10 grid place-items-center text-slate-300"><Plus className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  )
}

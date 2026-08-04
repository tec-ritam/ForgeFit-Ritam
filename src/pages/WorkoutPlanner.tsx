import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Check, Timer, Dumbbell, Trash2, X, Settings2, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { WEEK_SPLIT, type Workout, type Exercise, type CustomTemplate } from '../lib/types'

export default function WorkoutPlanner() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  
  const [activeDay, setActiveDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [restTimer, setRestTimer] = useState<{ active: boolean; remaining: number; total: number } | null>(null)
  
  const [planType, setPlanType] = useState<'default'|'custom'>(profile?.active_plan_type === 'custom' ? 'custom' : 'default')
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [customExName, setCustomExName] = useState('')

  // Edit custom template states
  const [editingTemplate, setEditingTemplate] = useState(false)
  const [editDayLabel, setEditDayLabel] = useState('')
  const [editMuscle, setEditMuscle] = useState('')

  const dateForDay = (() => {
    const now = new Date()
    const diff = activeDay - (now.getDay() === 0 ? 6 : now.getDay() - 1)
    const d = new Date(now); d.setDate(now.getDate() + diff)
    return d.toISOString().slice(0, 10)
  })()

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    
    // Load today's workout instances
    const { data: w } = await supabase.from('workouts').select('*').eq('user_id', user.id).eq('date', dateForDay).maybeSingle()
    setWorkout(w as Workout | null)
    if (w) {
      const { data: ex } = await supabase.from('exercises').select('*').eq('workout_id', (w as Workout).id).order('created_at', { ascending: true })
      setExercises((ex ?? []) as Exercise[])
    } else setExercises([])

    // Load custom templates
    const { data: tpls } = await supabase.from('custom_templates').select('*').eq('user_id', user.id)
    setCustomTemplates((tpls ?? []) as CustomTemplate[])
    
    setLoading(false)
  }, [user, dateForDay])

  useEffect(() => { load() }, [load])

  // Sync planType with profile on load
  useEffect(() => {
    if (profile?.active_plan_type) {
      setPlanType(profile.active_plan_type as 'default'|'custom')
    }
  }, [profile])

  // Rest timer countdown
  useEffect(() => {
    if (!restTimer?.active) return
    if (restTimer.remaining <= 0) { setRestTimer(null); toast('Rest time over! Get back to it.'); return }
    const t = setTimeout(() => setRestTimer((r) => r ? { ...r, remaining: r.remaining - 1 } : null), 1000)
    return () => clearTimeout(t)
  }, [restTimer, toast])

  const activeTemplate = planType === 'default' 
    ? WEEK_SPLIT[activeDay] 
    : (customTemplates.find(t => t.day_index === activeDay) || { day_label: 'Custom Day', muscle_group: 'Rest / Custom', exercises: [] })

  async function togglePlanType(type: 'default'|'custom') {
    if (!user) return
    setPlanType(type)
    await supabase.from('profiles').update({ active_plan_type: type }).eq('id', user.id)
    refreshProfile()
    toast(`Switched to ${type} plan`)
  }

  async function ensureWorkout(): Promise<Workout | null> {
    if (!user) return null
    if (workout) return workout
    const { data, error } = await supabase.from('workouts').insert({
      user_id: user.id, date: dateForDay, day_label: (activeTemplate as any).day_label || (activeTemplate as any).day, muscle_group: (activeTemplate as any).muscle_group || (activeTemplate as any).muscle, completed: false,
    }).select('*').single()
    if (error) { toast('Could not create workout', 'error'); throw error }
    setWorkout(data as Workout)
    return data as Workout
  }

  async function addExercise(name: string) {
    if (!user) return
    const w = await ensureWorkout()
    if (!w) return
    const { data, error } = await supabase.from('exercises').insert({
      workout_id: w.id, user_id: user.id, name, sets: 3, reps: 10, weight_kg: 0, rest_seconds: 60, completed: false,
    }).select('*').single()
    if (!error) setExercises((e) => [...e, data as Exercise])
  }

  async function addCustomExercise(e: React.FormEvent) {
    e.preventDefault()
    if (!customExName.trim() || !user) return
    
    // 1. Add it to today's live workout
    await addExercise(customExName.trim())

    // 2. If in custom mode, permanently save it to this day's template
    if (planType === 'custom') {
      const existing = customTemplates.find(t => t.day_index === activeDay)
      const newEx = { name: customExName.trim(), sets: 3, reps: 10 }
      
      if (existing) {
        const updatedExercises = [...existing.exercises, newEx]
        await supabase.from('custom_templates').update({ exercises: updatedExercises }).eq('id', existing.id)
        setCustomTemplates(prev => prev.map(t => t.id === existing.id ? { ...t, exercises: updatedExercises } : t))
      } else {
        const { data } = await supabase.from('custom_templates').insert({
          user_id: user.id, day_index: activeDay, day_label: 'Custom Day', muscle_group: 'Mixed', exercises: [newEx]
        }).select('*').single()
        if (data) setCustomTemplates(prev => [...prev, data as CustomTemplate])
      }
    }
    
    setCustomExName('')
  }

  async function saveTemplateMeta() {
    if (!user) return
    const existing = customTemplates.find(t => t.day_index === activeDay)
    if (existing) {
      await supabase.from('custom_templates').update({ day_label: editDayLabel, muscle_group: editMuscle }).eq('id', existing.id)
      setCustomTemplates(prev => prev.map(t => t.id === existing.id ? { ...t, day_label: editDayLabel, muscle_group: editMuscle } : t))
    } else {
      const { data } = await supabase.from('custom_templates').insert({
        user_id: user.id, day_index: activeDay, day_label: editDayLabel, muscle_group: editMuscle, exercises: []
      }).select('*').single()
      if (data) setCustomTemplates(prev => [...prev, data as CustomTemplate])
    }
    setEditingTemplate(false)
    toast('Template updated')
  }

  async function updateExercise(id: string, patch: Partial<Exercise>) {
    setExercises((e) => e.map((x) => x.id === id ? { ...x, ...patch } : x))
    await supabase.from('exercises').update(patch).eq('id', id)
  }

  async function removeExercise(id: string) {
    setExercises((e) => e.filter((x) => x.id !== id))
    await supabase.from('exercises').delete().eq('id', id)
  }

  async function removeTemplateExercise(name: string) {
    const existing = customTemplates.find(t => t.day_index === activeDay)
    if (!existing) return
    const updated = existing.exercises.filter(e => e.name !== name)
    await supabase.from('custom_templates').update({ exercises: updated }).eq('id', existing.id)
    setCustomTemplates(prev => prev.map(t => t.id === existing.id ? { ...t, exercises: updated } : t))
  }

  async function toggleComplete(ex: Exercise) {
    const completed = !ex.completed
    await supabase.from('exercises').update({ completed }).eq('id', ex.id)
    setExercises((e) => {
      const all = e.map((x) => x.id === ex.id ? { ...x, completed } : x)
      if (all.length > 0 && all.every((x) => x.completed) && workout && !workout.completed) {
        supabase.from('workouts').update({ completed: true }).eq('id', workout.id)
        setWorkout(prev => prev ? { ...prev, completed: true } : prev)
        toast('Workout complete! All exercises done. ⚡')
      }
      return all
    })
  }

  const completedCount = exercises.filter((e) => e.completed).length
  const pct = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0

  const dispDay = (activeTemplate as any).day || (activeTemplate as any).day_label
  const dispMuscle = (activeTemplate as any).muscle || (activeTemplate as any).muscle_group

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Workout Planner</h1>
          <p className="text-slate-400 text-sm mt-1">Build your weekly split and track every set.</p>
        </div>
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
          <button onClick={() => togglePlanType('default')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${planType === 'default' ? 'bg-brand-400 text-ink-950' : 'text-slate-400 hover:text-white'}`}>Default Plan</button>
          <button onClick={() => togglePlanType('custom')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${planType === 'custom' ? 'bg-brand-400 text-ink-950' : 'text-slate-400 hover:text-white'}`}>Custom Plan</button>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveDay(i)
              setEditingTemplate(false)
            }}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              i === activeDay ? 'bg-brand-400 text-ink-950' : 'glass text-slate-300 hover:text-white'
            }`}
          >
            <div>{dayName}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
        {editingTemplate ? (
          <div className="flex-1 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-slate-500 mb-1 block">Day Label</label>
              <input className="input py-1.5 text-sm" value={editDayLabel} onChange={e => setEditDayLabel(e.target.value)} placeholder="e.g. Push Day" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-slate-500 mb-1 block">Muscle Group</label>
              <input className="input py-1.5 text-sm" value={editMuscle} onChange={e => setEditMuscle(e.target.value)} placeholder="e.g. Chest & Triceps" />
            </div>
            <button onClick={saveTemplateMeta} className="btn-primary py-1.5 px-4"><Save className="w-4 h-4" /> Save</button>
            <button onClick={() => setEditingTemplate(false)} className="btn-ghost py-1.5 px-3"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-white">{dispDay} — {dispMuscle}</h2>
                {planType === 'custom' && (
                  <button onClick={() => { setEditDayLabel(dispDay); setEditMuscle(dispMuscle); setEditingTemplate(true) }} className="text-slate-500 hover:text-brand-300 transition">
                    <Settings2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {exercises.length > 0 && <div className="text-sm text-slate-400 mt-0.5">{completedCount}/{exercises.length} exercises · {pct}%</div>}
            </div>
            {exercises.length > 0 && (
              <div className="w-32 h-2 rounded-full bg-white/5 overflow-hidden hidden sm:block">
                <motion.div animate={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-brand-400 to-accent-400" />
              </div>
            )}
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 skeleton" />)}</div>
      ) : activeTemplate.exercises.length === 0 && exercises.length === 0 && planType === 'default' ? (
        <div className="card p-10 text-center">
          <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Rest day. Recover and recharge.</p>
        </div>
      ) : (
        <div className="space-y-4">
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
                    <button onClick={() => setRestTimer({ active: true, remaining: ex.rest_seconds, total: ex.rest_seconds })}
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
              <p className="text-slate-400 mb-4">No exercises logged yet today. Add from your template below:</p>
            </div>
          )}

          <div className="card p-5">
            <h3 className="text-sm font-medium text-white mb-3">Template Exercises</h3>
            <div className="flex flex-wrap gap-2">
              {activeTemplate.exercises.map((ex: any) => {
                const added = exercises.some((x) => x.name === ex.name)
                return (
                  <div key={ex.name} className="flex items-center gap-1">
                    <button onClick={() => !added && addExercise(ex.name)} className={`chip transition ${added ? 'opacity-50 grayscale cursor-not-allowed border-white/5' : 'glass hover:border-brand-400/30 hover:text-brand-300'}`}>
                      <Plus className="w-3 h-3" /> {ex.name}
                    </button>
                    {planType === 'custom' && !added && (
                      <button onClick={() => removeTemplateExercise(ex.name)} className="text-slate-500 hover:text-rose-400 p-1"><X className="w-3 h-3" /></button>
                    )}
                  </div>
                )
              })}
              {activeTemplate.exercises.length === 0 && <span className="text-sm text-slate-500">No template exercises found.</span>}
            </div>

            <form onSubmit={addCustomExercise} className="mt-5 flex gap-2">
              <input 
                type="text" 
                className="input text-sm flex-1" 
                placeholder="Type any exercise name..." 
                value={customExName} 
                onChange={e => setCustomExName(e.target.value)} 
              />
              <button type="submit" disabled={!customExName.trim()} className="btn-primary px-4">
                <Plus className="w-4 h-4" /> {planType === 'custom' ? 'Add & Save' : 'Add to Workout'}
              </button>
            </form>
            {planType === 'custom' && (
              <p className="text-xs text-slate-500 mt-2">Adding an exercise here will save it to your Custom {dispDay} Template.</p>
            )}
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
              <motion.div animate={{ width: `${(restTimer.remaining / restTimer.total) * 100}%` }} className="h-full bg-accent-400" />
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

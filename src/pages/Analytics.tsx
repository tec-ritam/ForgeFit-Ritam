import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingDown, TrendingUp, Activity, Flame, Dumbbell, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { type Exercise } from '../lib/types'

const chartTheme = {
  grid: 'rgba(255,255,255,0.06)',
  axis: '#64748b',
  tooltipBg: '#0B0F1A',
  brand: '#06E095',
  accent: '#22D3EE',
  gold: '#FBBF24',
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="text-white font-medium">{p.name}: {p.value}{p.unit || ''}</div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { user, profile } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workouts, setWorkouts] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('exercises').select('*, workouts!inner(date)').eq('user_id', user.id),
      supabase.from('workouts').select('*').eq('user_id', user.id).order('date', { ascending: true }),
      supabase.from('progress_photos').select('*').eq('user_id', user.id).order('taken_at', { ascending: true }),
    ]).then(([ex, w, ph]) => {
      setExercises((ex.data ?? []) as Exercise[])
      setWorkouts(w.data ?? [])
      setPhotos(ph.data ?? [])
      setLoading(false)
    })
  }, [user])

  // Weight trend (from photos + profile)
  const weightData = useMemo(() => {
    const pts = photos.map((p) => ({ date: new Date(p.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), weight: p.weight_kg }))
      .filter((p) => p.weight)
    if (profile?.weight_kg) pts.unshift({ date: 'Start', weight: Number(profile.weight_kg) })
    return pts
  }, [photos, profile])

  // Strength progress (avg weight per exercise over time)
  const strengthData = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {}
    exercises.forEach((e: any) => {
      const d = new Date(e.workouts?.date || e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!byDate[d]) byDate[d] = {}
      if (e.weight_kg > 0) byDate[d][e.name] = Number(e.weight_kg)
    })
    return Object.entries(byDate).map(([date, vals]) => ({ date, ...vals })).slice(-10)
  }, [exercises])

  // Workout consistency (last 7 days)
  const consistencyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const now = new Date()
    const map: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); map[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0 }
    workouts.forEach((w) => { if (w.completed) { const k = new Date(w.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }); if (k in map) map[k]++ } })
    return days.map((d) => ({ day: d, workouts: map[d] || 0, calories: (map[d] || 0) * 480 }))
  }, [workouts])

  // Muscle group radar
  const muscleData = useMemo(() => {
    const groups: Record<string, number> = { Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0, Core: 0 }
    exercises.forEach((e: any) => {
      const w = e.workouts?.muscle_group || ''
      if (w.includes('Chest')) groups.Chest += e.sets
      if (w.includes('Back')) groups.Back += e.sets
      if (w.includes('Leg')) groups.Legs += e.sets
      if (w.includes('Shoulder')) groups.Shoulders += e.sets
      if (w.includes('Arm')) groups.Arms += e.sets
      if (w.includes('Core')) groups.Core += e.sets
    })
    return Object.entries(groups).map(([muscle, sets]) => ({ muscle, sets }))
  }, [exercises])

  // Body fat trend (mock from weight)
  const bodyFatData = useMemo(() => {
    return weightData.map((p, i) => ({
      date: p.date,
      bodyFat: Math.max(8, 22 - i * 0.8 + (Math.random() * 0.5)),
    }))
  }, [weightData])

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton" />)}</div>

  const totalWorkouts = workouts.filter((w) => w.completed).length
  const totalVolume = exercises.reduce((s, e) => s + e.sets * e.reps * Number(e.weight_kg), 0)
  const totalCalories = consistencyData.reduce((s, d) => s + d.calories, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Track your strength, consistency, and body composition.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Dumbbell} label="Total Workouts" value={`${totalWorkouts}`} color="text-brand-300" trend="+12%" up />
        <StatCard icon={Zap} label="Total Volume" value={`${(totalVolume / 1000).toFixed(1)}t`} color="text-accent-400" trend="+8%" up />
        <StatCard icon={Flame} label="Calories Burned" value={`${totalCalories}`} color="text-gold-400" trend="+15%" up />
        <StatCard icon={TrendingDown} label="Body Fat" value={`${bodyFatData[bodyFatData.length - 1]?.bodyFat.toFixed(1) || '—'}%`} color="text-brand-300" trend="-2.4%" up />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weight trend */}
        <ChartCard title="Weight Trend" subtitle="kg over time">
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={weightData}>
                <defs><linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartTheme.brand} stopOpacity={0.4} /><stop offset="100%" stopColor={chartTheme.brand} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="date" stroke={chartTheme.axis} fontSize={11} />
                <YAxis stroke={chartTheme.axis} fontSize={11} domain={['auto', 'auto']} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="weight" name="Weight" unit="kg" stroke={chartTheme.brand} fill="url(#gw)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Body fat */}
        <ChartCard title="Body Fat %" subtitle="estimated trend">
          {bodyFatData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={bodyFatData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="date" stroke={chartTheme.axis} fontSize={11} />
                <YAxis stroke={chartTheme.axis} fontSize={11} domain={[0, 30]} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="bodyFat" name="Body Fat" unit="%" stroke={chartTheme.accent} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Consistency */}
        <ChartCard title="Workout Consistency" subtitle="this week">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={consistencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="day" stroke={chartTheme.axis} fontSize={11} />
              <YAxis stroke={chartTheme.axis} fontSize={11} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="workouts" name="Workouts" fill={chartTheme.brand} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Muscle group radar */}
        <ChartCard title="Muscle Group Volume" subtitle="total sets by muscle">
          {muscleData.some((m) => m.sets > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={muscleData}>
                <PolarGrid stroke={chartTheme.grid} />
                <PolarAngleAxis dataKey="muscle" stroke={chartTheme.axis} fontSize={11} />
                <PolarRadiusAxis stroke={chartTheme.axis} fontSize={10} />
                <Radar dataKey="sets" name="Sets" stroke={chartTheme.gold} fill={chartTheme.gold} fillOpacity={0.3} strokeWidth={2} />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Strength progress */}
      <ChartCard title="Strength Progress" subtitle="weight lifted per exercise">
        {strengthData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={strengthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="date" stroke={chartTheme.axis} fontSize={11} />
              <YAxis stroke={chartTheme.axis} fontSize={11} unit="kg" />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {[chartTheme.brand, chartTheme.accent, chartTheme.gold, '#F472B6', '#A78BFA'].map((color, i) => (
                <Line key={i} type="monotone" dot={{ r: 3 }} strokeWidth={2} stroke={color} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartCard>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, trend, up }: { icon: any; label: string; value: string; color: string; trend: string; up?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {trend && <div className={`text-xs mt-1 flex items-center gap-1 ${up ? 'text-brand-300' : 'text-rose-400'}`}>{up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{trend}</div>}
    </motion.div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="font-display font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function EmptyChart() {
  return <div className="h-[240px] grid place-items-center text-sm text-slate-500">No data yet. Start logging workouts to see charts.</div>
}

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Sparkles, Camera, TrendingUp, TrendingDown, Minus, FileText, Loader2, AlertTriangle, History, Dumbbell, Weight } from 'lucide-react'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { type ProgressPhoto } from '../lib/types'

interface AnalysisResult {
  physiqueScore: number
  bodyFatEstimate: number
  bodyFatTrend: 'decreasing' | 'stable' | 'increasing'
  muscleDefinition: number
  shoulderWidth: number
  chestDevelopment: number
  armGrowth: number
  waistReduction: number
  postureImprovement: number
  symmetry: number
  estimatedMuscleMassKg: number
  estimatedHeightCm: number | null
  suggestions: string[]
  report: string
}

interface SavedAnalysis {
  id: string
  photo_url: string
  physique_score: number
  body_fat_estimate: number
  muscle_definition: number
  shoulder_width: number
  chest_development: number
  arm_growth: number
  waist_reduction: number
  posture_improvement: number
  symmetry: number
  body_fat_trend: string
  suggestions: string[]
  report: string
  created_at: string
}

export default function AiAnalysis() {
  const { user, session } = useAuth()
  const toast = useToast()
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [selected, setSelected] = useState<ProgressPhoto | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<SavedAnalysis[]>([])

  const load = useCallback(async () => {
    if (!user) return
    const [photoRes, analysisRes] = await Promise.all([
      supabase.from('progress_photos').select('*').eq('user_id', user.id).order('taken_at', { ascending: false }),
      supabase.from('ai_analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ])
    setPhotos((photoRes.data ?? []) as ProgressPhoto[])
    setHistory((analysisRes.data ?? []) as SavedAnalysis[])
  }, [user])

  useEffect(() => { load() }, [load])

  async function analyze() {
    if (!selected) { toast('Select a photo to analyze', 'error'); return }
    setAnalyzing(true)
    setResult(null)
    setError(null)

    try {
      const apiUrl = `${SUPABASE_URL}/functions/v1/ai-physique-analysis`
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ photoUrl: selected.photo_url }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        if (data.error === 'OPENAI_API_KEY_NOT_CONFIGURED') {
          setError('The AI analysis feature needs an OpenAI API key to be configured. This is a server-side secret — once it is added, the analysis will work automatically.')
        } else {
          setError(data.message || 'Analysis failed. Please try again.')
        }
        setAnalyzing(false)
        return
      }

      const a: AnalysisResult = data.analysis
      setResult(a)
      toast('AI analysis complete!')

      // Save to database
      if (user) {
        await supabase.from('ai_analyses').insert({
          user_id: user.id,
          photo_id: selected.id,
          photo_url: selected.photo_url,
          physique_score: a.physiqueScore,
          body_fat_estimate: a.bodyFatEstimate,
          muscle_definition: a.muscleDefinition,
          shoulder_width: a.shoulderWidth,
          chest_development: a.chestDevelopment,
          arm_growth: a.armGrowth,
          waist_reduction: a.waistReduction,
          posture_improvement: a.postureImprovement,
          symmetry: a.symmetry,
          body_fat_trend: a.bodyFatTrend,
          suggestions: a.suggestions,
          report: a.report,
        })
        load() // refresh history
      }
    } catch {
      setError('Could not reach the AI analysis service. Please check your connection and try again.')
    }
    setAnalyzing(false)
  }

  function viewHistory(h: SavedAnalysis) {
    setResult({
      physiqueScore: Number(h.physique_score),
      bodyFatEstimate: Number(h.body_fat_estimate),
      bodyFatTrend: h.body_fat_trend as any,
      muscleDefinition: h.muscle_definition,
      shoulderWidth: h.shoulder_width,
      chestDevelopment: h.chest_development,
      armGrowth: h.arm_growth,
      waistReduction: h.waist_reduction,
      postureImprovement: h.posture_improvement,
      symmetry: h.symmetry,
      estimatedMuscleMassKg: 0,
      estimatedHeightCm: null,
      suggestions: h.suggestions || [],
      report: h.report || '',
    })
    setError(null)
  }

  const metrics = result ? [
    { label: 'Muscle Definition', value: result.muscleDefinition, unit: '%' },
    { label: 'Shoulder Width', value: result.shoulderWidth, unit: '%' },
    { label: 'Chest Development', value: result.chestDevelopment, unit: '%' },
    { label: 'Arm Growth', value: result.armGrowth, unit: '%' },
    { label: 'Waist Reduction', value: result.waistReduction, unit: '%' },
    { label: 'Posture Improvement', value: result.postureImprovement, unit: '%' },
    { label: 'Symmetry', value: result.symmetry, unit: '%' },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">AI Physique Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">Powered by GPT-4o Vision — real AI analysis of your body composition and muscle development.</p>
      </div>

      {/* Photo selector */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-brand-300" />
          <h2 className="font-display font-bold text-white">Select a Progress Photo</h2>
        </div>
        {photos.length === 0 ? (
          <div className="text-center py-8">
            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Upload or capture a progress photo first to enable AI analysis.</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((p) => (
                <button key={p.id} onClick={() => { setSelected(p); setResult(null); setError(null) }}
                  className={`shrink-0 w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 transition ${selected?.id === p.id ? 'border-brand-400 shadow-glow' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {selected && (
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <button onClick={analyze} disabled={analyzing} className="btn-primary">
                  {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Run AI Analysis</>}
                </button>
                <span className="text-xs text-slate-500">Uses 1 AI credit per analysis</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-5 border-rose-400/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-white mb-1">Analysis Unavailable</h3>
                <p className="text-sm text-slate-400">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card p-12 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="inline-block">
              <Bot className="w-16 h-16 text-brand-400" />
            </motion.div>
            <p className="text-slate-300 mt-4">GPT-4o Vision is analyzing your physique...</p>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {['Scanning body composition', 'Estimating body fat %', 'Measuring muscle symmetry', 'Assessing posture'].map((s, i) => (
                <motion.span key={s} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.4, repeat: Infinity, repeatType: 'reverse' }} className="text-xs text-slate-500">{s}</motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {result && !analyzing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Score */}
          <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-32 h-32 grid place-items-center">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <motion.circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                  initial={{ strokeDasharray: 327 }} animate={{ strokeDasharray: `${(result.physiqueScore / 10) * 327} 327` }} transition={{ duration: 1 }} />
                <defs><linearGradient id="scoreGrad"><stop offset="0%" stopColor="#06E095" /><stop offset="100%" stopColor="#22D3EE" /></linearGradient></defs>
              </svg>
              <div className="absolute text-center">
                <div className="text-3xl font-bold text-white">{result.physiqueScore}</div>
                <div className="text-xs text-slate-500">/ 10</div>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-white">Overall Physique Score</h2>
              <p className="text-slate-400 text-sm mt-1">AI-estimated score based on visual analysis of your progress photo.</p>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  {result.bodyFatTrend === 'decreasing' ? <TrendingDown className="w-4 h-4 text-brand-300" /> : result.bodyFatTrend === 'increasing' ? <TrendingUp className="w-4 h-4 text-rose-400" /> : <Minus className="w-4 h-4 text-slate-400" />}
                  <span className="text-sm text-slate-300">Body fat {result.bodyFatTrend}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-300">
                  <Weight className="w-4 h-4 text-accent-400" /> Est. body fat: {result.bodyFatEstimate}%
                </div>
                {result.estimatedMuscleMassKg > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-300">
                    <Dumbbell className="w-4 h-4 text-gold-400" /> Est. muscle: {result.estimatedMuscleMassKg}kg
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card p-4">
                <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-xl font-bold text-white">{m.value}{m.unit}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 0.8, delay: i * 0.08 }} className="h-full bg-gradient-to-r from-brand-400 to-accent-400" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Report */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-brand-300" />
              <h2 className="font-display font-bold text-white">AI Analysis Report</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{result.report}</p>
          </div>

          {/* Suggestions */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-gold-400" />
              <h2 className="font-display font-bold text-white">AI Suggestions for Improvement</h2>
            </div>
            <ul className="space-y-2.5">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-brand-400/15 text-brand-300 grid place-items-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-brand-300" />
            <h2 className="font-display font-bold text-white">Past Analyses</h2>
          </div>
          <div className="space-y-2">
            {history.map((h) => (
              <button key={h.id} onClick={() => viewHistory(h)} className="glass rounded-xl p-3 w-full flex items-center gap-3 hover:border-brand-400/30 transition text-left">
                <img src={h.photo_url} alt="" className="w-12 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium">Score: {Number(h.physique_score)}/10 · Body fat: {Number(h.body_fat_estimate)}%</div>
                  <div className="text-xs text-slate-500">{new Date(h.created_at).toLocaleDateString()} · {h.body_fat_trend}</div>
                </div>
                <span className="text-xs text-brand-300 shrink-0">View</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

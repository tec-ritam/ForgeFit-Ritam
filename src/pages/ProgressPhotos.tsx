import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, Trash2, X, Image as ImageIcon, Calendar, RefreshCw, Loader2 } from 'lucide-react'
import { supabase, uploadProgressPhoto } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { type ProgressPhoto } from '../lib/types'

export default function ProgressPhotos() {
  const { user } = useAuth()
  const toast = useToast()
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [view, setView] = useState<'timeline' | 'compare'>('timeline')
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all')
  const [compare, setCompare] = useState<{ before: ProgressPhoto; after: ProgressPhoto } | null>(null)
  const [sliderPos, setSliderPos] = useState(50)
  const fileRef = useRef<HTMLInputElement>(null)
  const camRef = useRef<HTMLVideoElement>(null)
  const [camOpen, setCamOpen] = useState(false)
  const [camError, setCamError] = useState<string | null>(null)
  const [camReady, setCamReady] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const streamRef = useRef<MediaStream | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('progress_photos').select('*').eq('user_id', user.id).order('taken_at', { ascending: false })
    setPhotos((data ?? []) as ProgressPhoto[])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (photos.length >= 2 && !compare) {
      setCompare({ before: photos[photos.length - 1], after: photos[0] })
    }
  }, [photos, compare])

  async function handleFile(file: File) {
    if (!user) return
    setUploading(true)
    const url = await uploadProgressPhoto(file, user.id)
    if (!url) { toast('Upload failed. Please try again.', 'error'); setUploading(false); return }
    const { data, error } = await supabase.from('progress_photos').insert({
      user_id: user.id, photo_url: url, taken_at: new Date().toISOString(),
    }).select('*').single()
    setUploading(false)
    if (error) { toast('Could not save photo metadata', 'error'); return }
    setPhotos((p) => [data as ProgressPhoto, ...p])
    toast('Progress photo uploaded!')
  }

  async function deletePhoto(id: string, url: string) {
    setPhotos((p) => p.filter((x) => x.id !== id))
    await supabase.from('progress_photos').delete().eq('id', id)
    const path = url.split('/progress-photos/')[1]
    if (path) await supabase.storage.from('progress-photos').remove([path])
    toast('Photo deleted')
  }

  async function startStream(mode: 'user' | 'environment') {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCamReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (camRef.current) {
        camRef.current.srcObject = stream
        await camRef.current.play()
        setCamReady(true)
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') setCamError('Camera access was denied. Please allow camera permissions in your browser settings and try again.')
      else if (err?.name === 'NotFoundError') setCamError('No camera found on this device.')
      else if (err?.name === 'NotReadableError') setCamError('Camera is already in use by another app. Close it and try again.')
      else setCamError('Could not access the camera. Please try again or upload a photo instead.')
    }
  }

  async function openCamera() {
    setCamOpen(true)
    setCamError(null)
    await startStream(facingMode)
  }

  async function switchCamera() {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    await startStream(next)
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCamOpen(false)
    setCamReady(false)
    setCamError(null)
  }

  async function capture() {
    if (!camRef.current || !camReady) return
    const video = camRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    // Mirror the image if using front camera for a natural selfie capture
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) handleFile(new File([blob], 'capture.jpg', { type: 'image/jpeg' }))
      closeCamera()
    }, 'image/jpeg', 0.92)
  }

  const filtered = photos.filter((p) => {
    if (filter === 'all') return true
    const d = new Date(p.taken_at)
    const now = new Date()
    const days = (now.getTime() - d.getTime()) / 86400000
    if (filter === 'daily') return days <= 1
    if (filter === 'weekly') return days <= 7
    if (filter === 'monthly') return days <= 30
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Progress Photos</h1>
          <p className="text-slate-400 text-sm mt-1">Document your visual transformation over time.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary text-sm py-2.5">
            {uploading ? 'Uploading...' : <><Upload className="w-4 h-4" /> Upload</>}
          </button>
          <button onClick={openCamera} className="btn-outline text-sm py-2.5"><Camera className="w-4 h-4" /> Capture</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <div className="glass rounded-xl p-1 flex">
          {(['timeline', 'compare'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${view === v ? 'bg-brand-400 text-ink-950' : 'text-slate-400 hover:text-white'}`}>{v}</button>
          ))}
        </div>
        {view === 'timeline' && (
          <div className="glass rounded-xl p-1 flex">
            {(['all', 'daily', 'weekly', 'monthly'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${filter === f ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{f}</button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] skeleton" />)}</div>
      ) : view === 'compare' ? (
        <CompareView photos={photos} compare={compare} setCompare={setCompare} sliderPos={sliderPos} setSliderPos={setSliderPos} />
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No photos yet. Upload your first progress photo to start tracking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="card overflow-hidden group">
              <div className="aspect-[3/4] overflow-hidden bg-ink-800 relative">
                <img src={p.photo_url} alt="Progress" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent opacity-0 group-hover:opacity-100 transition" />
                <button onClick={() => deletePhoto(p.id, p.photo_url)} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-ink-950/60 grid place-items-center text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3">
                <div className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(p.taken_at).toLocaleDateString()}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Camera modal */}
      <AnimatePresence>
        {camOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCamera}
            className="fixed inset-0 z-50 bg-ink-950/90 backdrop-blur-sm grid place-items-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}
              className="card p-4 max-w-md w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-white">Take Photo</h3>
                <div className="flex items-center gap-2">
                  <button onClick={switchCamera} disabled={!!camError} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 disabled:opacity-40">
                    <RefreshCw className="w-4 h-4" /> Flip
                  </button>
                  <button onClick={closeCamera} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
              </div>
              {camError ? (
                <div className="aspect-[3/4] rounded-xl bg-ink-900 grid place-items-center p-6 text-center">
                  <div>
                    <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 max-w-xs">{camError}</p>
                    <button onClick={() => fileRef.current?.click()} className="btn-outline text-sm mt-4">Upload a Photo Instead</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-ink-900">
                    <video ref={camRef} className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`} playsInline muted autoPlay />
                    {!camReady && (
                      <div className="absolute inset-0 grid place-items-center bg-ink-900">
                        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                      </div>
                    )}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 chip bg-ink-950/60 text-white text-xs">Stand back for full body</div>
                  </div>
                  <button onClick={capture} disabled={!camReady} className="btn-primary w-full mt-3 disabled:opacity-50">
                    <Camera className="w-4 h-4" /> {camReady ? 'Capture' : 'Starting camera...'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CompareView({ photos, compare, setCompare, sliderPos, setSliderPos }: {
  photos: ProgressPhoto[]
  compare: { before: ProgressPhoto; after: ProgressPhoto } | null
  setCompare: (c: { before: ProgressPhoto; after: ProgressPhoto } | null) => void
  sliderPos: number; setSliderPos: (n: number) => void
}) {
  if (!compare || photos.length < 2) {
    return <div className="card p-12 text-center"><p className="text-slate-400">Upload at least 2 photos to use the before/after comparison.</p></div>
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select className="input max-w-xs py-2" value={compare.before.id}
          onChange={(e) => { const p = photos.find((x) => x.id === e.target.value); if (p) setCompare({ ...compare, before: p }) }}>
          {photos.map((p) => <option key={p.id} value={p.id}>Before: {new Date(p.taken_at).toLocaleDateString()}</option>)}
        </select>
        <select className="input max-w-xs py-2" value={compare.after.id}
          onChange={(e) => { const p = photos.find((x) => x.id === e.target.value); if (p) setCompare({ ...compare, after: p }) }}>
          {photos.map((p) => <option key={p.id} value={p.id}>After: {new Date(p.taken_at).toLocaleDateString()}</option>)}
        </select>
      </div>
      <div className="card p-2 overflow-hidden">
        <div className="relative aspect-[4/3] sm:aspect-[16/9] rounded-xl overflow-hidden select-none"
          onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setSliderPos(((e.clientX - r.left) / r.width) * 100) }}
          onTouchMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setSliderPos(((e.touches[0].clientX - r.left) / r.width) * 100) }}>
          <img src={compare.after.photo_url} alt="After" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
            <img src={compare.before.photo_url} alt="Before" className="absolute inset-0 h-full object-cover" style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }} />
          </div>
          <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPos}%` }}>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white grid place-items-center text-ink-950 text-xs font-bold">⟷</div>
          </div>
          <div className="absolute top-3 left-3 chip bg-ink-950/60 text-white">Before</div>
          <div className="absolute top-3 right-3 chip bg-ink-950/60 text-white">After</div>
        </div>
      </div>
    </div>
  )
}

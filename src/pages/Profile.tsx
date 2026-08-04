import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Ruler, Weight, Calendar, Target, Award, Flame, Save, Camera } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { supabase } from '../lib/supabase'
import { bmi, ACHIEVEMENT_DEFS } from '../lib/types'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [form, setForm] = useState({
    full_name: '', height_cm: '', weight_kg: '', age: '', goal: '', experience: '',
  })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [achievements, setAchievements] = useState<any[]>([])

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        height_cm: profile.height_cm?.toString() || '',
        weight_kg: profile.weight_kg?.toString() || '',
        age: profile.age?.toString() || '',
        goal: profile.goal || '',
        experience: profile.experience || '',
      })
    }
  }, [profile])

  useEffect(() => {
    if (user) supabase.from('achievements').select('*').eq('user_id', user.id).then(({ data }) => setAchievements(data ?? []))
  }, [user])

  async function save() {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name || null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      age: form.age ? Number(form.age) : null,
      goal: form.goal || null,
      experience: form.experience || null,
    }).eq('id', user.id)
    setSaving(false)
    if (error) toast('Could not save profile', 'error')
    else { toast('Profile updated!'); refreshProfile() }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    
    try {
      setUploadingAvatar(true)
      
      // Upload to storage bucket
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file)
      
      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

      // Update profile
      const { error: dbError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      if (dbError) throw dbError

      toast('Profile photo updated!', 'success')
      refreshProfile()
    } catch (error: any) {
      toast(error.message || 'Error uploading photo', 'error')
    } finally {
      setUploadingAvatar(false)
      // Clear input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const userBmi = bmi(profile?.height_cm ? Number(profile.height_cm) : null, profile?.weight_kg ? Number(profile.weight_kg) : null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your personal information and fitness goals.</p>
      </div>

      {/* Profile header */}
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-5">
        <div 
          onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
          className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-400 grid place-items-center text-ink-950 font-bold text-3xl relative group overflow-hidden ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            (profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()
          )}
          
          <div className="absolute inset-0 bg-ink-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
            <Camera className="w-6 h-6" />
          </div>
          
          {uploadingAvatar && (
            <div className="absolute inset-0 bg-ink-950/80 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={uploadAvatar} />
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          <h2 className="font-display text-xl font-bold text-white">{profile?.full_name || 'Athlete'}</h2>
          <p className="text-slate-400 text-sm">{profile?.email}</p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
            <div className="chip bg-brand-400/10 text-brand-300 border border-brand-400/20"><Flame className="w-3.5 h-3.5" /> {profile?.streak ?? 0} day streak</div>
            {userBmi && <div className="chip glass text-slate-300">BMI: {userBmi}</div>}
            {profile?.experience && <div className="chip glass text-slate-300 capitalize">{profile.experience}</div>}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-5">
        <h2 className="font-display font-bold text-white mb-4">Edit Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field icon={User} label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          <Field icon={Calendar} label="Age" type="number" value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
          <Field icon={Ruler} label="Height (cm)" type="number" value={form.height_cm} onChange={(v) => setForm({ ...form, height_cm: v })} />
          <Field icon={Weight} label="Weight (kg)" type="number" value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} />
          <div>
            <label className="label"><Target className="w-3.5 h-3.5 inline mr-1" />Goal</label>
            <select className="input" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
              <option value="">Select goal</option>
              <option value="lose_weight">Lose Weight</option>
              <option value="build_muscle">Build Muscle</option>
              <option value="maintain">Maintain</option>
              <option value="get_stronger">Get Stronger</option>
              <option value="improve_endurance">Improve Endurance</option>
            </select>
          </div>
          <div>
            <label className="label"><Award className="w-3.5 h-3.5 inline mr-1" />Experience Level</label>
            <select className="input" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}>
              <option value="">Select level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary mt-5"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      {/* Achievements */}
      <div className="card p-5">
        <h2 className="font-display font-bold text-white mb-4">Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACHIEVEMENT_DEFS.map((a) => {
            const unlocked = achievements.some((x) => x.key === a.key)
            return (
              <motion.div key={a.key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`glass rounded-xl p-4 text-center ${unlocked ? 'border-brand-400/30' : 'opacity-40 grayscale'}`}>
                <div className="text-3xl mb-1">{a.emoji}</div>
                <div className="text-sm font-medium text-white">{a.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{a.desc}</div>
                {unlocked && <div className="chip bg-brand-400/15 text-brand-300 mt-2 mx-auto">Unlocked</div>}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, value, onChange, type = 'text' }: { icon: any; label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="label"><Icon className="w-3.5 h-3.5 inline mr-1" />{label}</label>
      <input type={type} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

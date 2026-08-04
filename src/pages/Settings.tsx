import { useState, useEffect } from 'react'
import { Bell, Droplet, Dumbbell, Clock, Save, Volume2, Shield } from 'lucide-react'
import { useToast } from '../lib/toast'
import { useAuth } from '../lib/auth'

export default function Settings() {
  const toast = useToast()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState({ workout: true, water: true, protein: false })
  const [times, setTimes] = useState({ workout: '07:00', water: '10:00', protein: '13:00' })
  const [sound, setSound] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission)
    const saved = localStorage.getItem('forgefit_settings')
    if (saved) {
      try {
        const s = JSON.parse(saved)
        if (s.notifications) setNotifications(s.notifications)
        if (s.times) setTimes(s.times)
        if (s.sound !== undefined) setSound(s.sound)
      } catch {}
    }
  }, [])

  async function requestPermission() {
    if (!('Notification' in window)) { toast('Notifications not supported in this browser', 'error'); return }
    const p = await Notification.requestPermission()
    setPermission(p)
    if (p === 'granted') toast('Notifications enabled!')
    else toast('Notification permission denied', 'error')
  }

  function sendTestNotification() {
    if (permission !== 'granted') { toast('Enable notifications first', 'error'); return }
    new Notification('ForgeFit', { body: 'This is a test reminder. Time to get moving! 💪' })
    if (sound) { try { const ctx = new AudioContext(); const o = ctx.createOscillator(); o.connect(ctx.destination); o.frequency.value = 880; o.start(); setTimeout(() => { o.stop(); ctx.close() }, 150) } catch {} }
  }

  async function saveSettings() {
    if (!user) return
    localStorage.setItem('forgefit_settings', JSON.stringify({ notifications, times, sound }))
    toast('Settings saved!')
  }

  const reminderCards = [
    { key: 'workout' as const, icon: Dumbbell, label: 'Workout Reminder', desc: 'Daily reminder to hit the gym' },
    { key: 'water' as const, icon: Droplet, label: 'Water Reminder', desc: 'Stay hydrated throughout the day' },
    { key: 'protein' as const, icon: Bell, label: 'Protein Reminder', desc: 'Don\'t forget your protein intake' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage notifications, reminders, and preferences.</p>
      </div>

      {/* Notification permission */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-brand-300" />
          <h2 className="font-display font-bold text-white">Browser Notifications</h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-300">Status: <span className={permission === 'granted' ? 'text-brand-300' : 'text-gold-400'}>{permission}</span></p>
            <p className="text-xs text-slate-500 mt-0.5">Allow notifications to receive workout reminders.</p>
          </div>
          <div className="flex gap-2">
            {permission !== 'granted' && <button onClick={requestPermission} className="btn-primary text-sm py-2.5">Enable</button>}
            <button onClick={sendTestNotification} className="btn-outline text-sm py-2.5">Test Notification</button>
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-brand-300" />
          <h2 className="font-display font-bold text-white">Daily Reminders</h2>
        </div>
        <div className="space-y-3">
          {reminderCards.map((r) => (
            <div key={r.key} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-400/10 text-brand-300 grid place-items-center"><r.icon className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{r.label}</div>
                <div className="text-xs text-slate-500">{r.desc}</div>
              </div>
              <input type="time" value={times[r.key]} onChange={(e) => setTimes({ ...times, [r.key]: e.target.value })}
                className="input max-w-[120px] py-1.5 text-sm" />
              <Toggle on={notifications[r.key]} onToggle={() => setNotifications({ ...notifications, [r.key]: !notifications[r.key] })} />
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-brand-300" />
          <h2 className="font-display font-bold text-white">Preferences</h2>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Sound Effects</div>
            <div className="text-xs text-slate-500">Play sounds for achievements and reminders</div>
          </div>
          <Toggle on={sound} onToggle={() => setSound(!sound)} />
        </div>
      </div>

      <button onClick={saveSettings} className="btn-primary"><Save className="w-4 h-4" /> Save Settings</button>
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative w-11 h-6 rounded-full transition ${on ? 'bg-brand-400' : 'bg-white/10'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

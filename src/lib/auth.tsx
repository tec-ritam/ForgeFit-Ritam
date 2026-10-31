import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  height_cm: number | null
  weight_kg: number | null
  age: number | null
  goal: string | null
  experience: string | null
  streak: number
  created_at: string
}

interface AuthCtx {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    if (data) setProfile(data as Profile)
    else {
      // create profile if missing
      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: uid, email: session?.user.email ?? '' })
        .select('*')
        .single()
      if (created) setProfile(created as Profile)
    }
  }

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) loadProfile(data.session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s?.user) loadProfile(s.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    profile,
    loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message ?? null }
    },
    async signUp(email, password, fullName) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message }
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id, email, full_name: fullName,
        })
      }
      return { error: null }
    },
    async signInWithGoogle() {
      await supabase.auth.signInWithOAuth({ provider: 'google' })
    },
    async resetPassword(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error: error?.message ?? null }
    },
    async signOut() {
      await supabase.auth.signOut()
      setProfile(null)
    },
    async refreshProfile() {
      if (session?.user) await loadProfile(session.user.id)
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}

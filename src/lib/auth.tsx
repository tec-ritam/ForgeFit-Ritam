import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  height_cm: number | null
  weight_kg: number | null
  age: number | null
  goal: string | null
  experience: string | null
  active_plan_type: string
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

  async function loadProfile(uid: string, email: string, userMetadata?: any) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    if (error) { console.error(error); return }
    if (data) setProfile(data as Profile) // unsafe cast, out of scope for Zod
    else {
      // create profile if missing
      const fullName = userMetadata?.full_name || ''
      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .upsert({ id: uid, email, full_name: fullName })
        .select('*')
        .single()
      if (insertError) { console.error(insertError); return }
      if (created) setProfile(created as Profile) // unsafe cast, out of scope for Zod
    }
  }

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) loadProfile(data.session.user.id, data.session.user.email ?? '', data.session.user.user_metadata).finally(() => setLoading(false))
      else setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s?.user) loadProfile(s.user.id, s.user.email ?? '', s.user.user_metadata).finally(() => setLoading(false))
      else { setProfile(null); setLoading(false) }
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Provide friendlier error messages
      const msg = error.message
      if (msg.includes('Email not confirmed')) {
        return { error: 'Please check your email and click the confirmation link before logging in.' }
      }
      if (msg.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please try again.' }
      }
      return { error: msg }
    }
    return { error: null }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin + '/app',
      },
    })
    if (error) return { error: error.message }
    
    if (data.user) {
      if (!data.session) {
        // If email confirmation is enabled, try to sign in to check the exact status
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            return { error: null, needsConfirmation: true }
          }
          // If it fails with invalid credentials, the email might already be taken
          return { error: 'Could not create account or email already in use.' }
        }
      } else {
        // If session exists (email confirmation disabled), profile will be created in onAuthStateChange
        // via the loadProfile function
      }
    }
    return { error: null }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id, session.user.email ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user])

  const value: AuthCtx = useMemo(() => ({
    user: session?.user ?? null,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    signOut,
    refreshProfile,
  }), [session, profile, loading, signIn, signUp, signInWithGoogle, resetPassword, signOut, refreshProfile])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}

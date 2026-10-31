import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export async function uploadProgressPhoto(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('progress-photos').upload(path, file, { upsert: false })
  if (error) return null
  const { data } = supabase.storage.from('progress-photos').getPublicUrl(path)
  return data.publicUrl
}

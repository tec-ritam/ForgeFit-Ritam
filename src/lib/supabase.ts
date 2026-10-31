import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://vmxmctwndrobaioudaau.supabase.co'

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZteG1jdHduZHJvYmFpb3VkYWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjQzMDgsImV4cCI6MjEwMTAwMDMwOH0.vGcQ_KpsW6Zgp233e1Zs5WOF-vUuO_yhw36yB4vWcAY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

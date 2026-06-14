import { createClient } from '@supabase/supabase-js'

let _admin: ReturnType<typeof createClient> | null = null
let _anon: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    _admin = createClient(url, key)
  }
  return _admin
}

export function getSupabase() {
  if (!_anon) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    _anon = createClient(url, key)
  }
  return _anon
}

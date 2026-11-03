import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Supabase is not configured. Copy .env.example to .env and fill in the values.')
}

export const supabase = createClient(url, anonKey)

import { createBrowserClient } from "@supabase/ssr"
import { requireEnv } from "@/lib/env"

export function createSupabaseBrowserClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  return createBrowserClient(url, anonKey)
}

export function createSupabaseBrowserAnonClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  return createBrowserClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
}

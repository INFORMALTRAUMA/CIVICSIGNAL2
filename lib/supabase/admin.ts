import { createClient } from "@supabase/supabase-js"
import { requireEnv } from "@/lib/env"

export function createSupabaseAdminClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

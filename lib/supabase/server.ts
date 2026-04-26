import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { requireEnv } from "@/lib/env"

export async function createSupabaseServerClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options })
          })
        } catch {
          // Ignore if called in a read-only context (e.g. Server Components).
        }
      }
    }
  })
}

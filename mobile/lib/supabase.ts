import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { AppState } from "react-native"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config"

function requireSupabaseEnv(): { url: string; anonKey: string } {
  const rawUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim()
  const anonKey = SUPABASE_ANON_KEY.trim()

  if (rawUrl.startsWith("eyJ")) {
    throw new Error(
      "[mobile] EXPO_PUBLIC_SUPABASE_URL looks like a JWT (anon key). Swap lines: URL must be https://….supabase.co " +
        "from Supabase → Project Settings → API, and the anon key belongs in EXPO_PUBLIC_SUPABASE_ANON_KEY."
    )
  }

  const url = SUPABASE_URL.trim()
  if (!url || !anonKey) {
    throw new Error(
      "[mobile] Supabase env missing or invalid URL: set EXPO_PUBLIC_SUPABASE_URL (https://…supabase.co) and " +
        "EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env (see mobile/.env.example), then restart Expo (npx expo start -c)."
    )
  }
  return { url, anonKey }
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = requireSupabaseEnv()

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

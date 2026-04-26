import Constants from "expo-constants"
import { Platform } from "react-native"

function stripQuotes(value: string): string {
  const t = value.trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).trim()
  }
  return t
}

/** Supabase project URL must be https://....supabase.co — not the anon JWT. */
export function normalizeSupabaseUrl(raw: string): string {
  const s = stripQuotes(raw)
  if (!s) return ""
  if (s.startsWith("eyJ")) {
    return ""
  }
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, "")}`
  try {
    const u = new URL(withScheme)
    if (u.protocol !== "http:" && u.protocol !== "https:") return ""
    return u.toString().replace(/\/$/, "")
  } catch {
    return ""
  }
}

/** Host running Metro (same machine as Next in dev). Expo Go sets this on physical devices. */
function devMachineHostFromExpo(): string | null {
  const dbg = Constants.expoGoConfig?.debuggerHost
  if (!dbg || typeof dbg !== "string") return null
  const host = dbg.split(":")[0]?.trim()
  if (!host || host === "localhost" || host === "127.0.0.1") return null
  return host
}

/** Android emulator maps 10.0.2.2 → host machine (localhost on the host). */
function resolveApiBaseForDevice(base: string): string {
  if (Platform.OS !== "android") return base
  try {
    const u = new URL(base)
    const h = u.hostname.toLowerCase()
    if (h === "localhost" || h === "127.0.0.1") {
      u.hostname = "10.0.2.2"
      return u.toString().replace(/\/$/, "")
    }
  } catch {
    return base
  }
  return base
}

/**
 * If env still says localhost but the app runs on a device, point at the dev PC
 * using Expo's debugger host (LAN IP of the machine running `expo start`).
 */
function resolveApiBaseUrl(rawInput: string): string {
  const base = stripQuotes(rawInput) || "http://localhost:3000"
  try {
    const u = new URL(base)
    const loopback = u.hostname === "localhost" || u.hostname === "127.0.0.1"
    const lan = __DEV__ && Platform.OS !== "web" && loopback ? devMachineHostFromExpo() : null
    if (lan) {
      u.hostname = lan
      return resolveApiBaseForDevice(u.toString().replace(/\/$/, ""))
    }
  } catch {
    return resolveApiBaseForDevice(base)
  }
  return resolveApiBaseForDevice(base)
}

const apiBaseRaw = stripQuotes(process.env.EXPO_PUBLIC_API_BASE_URL ?? "") || "http://localhost:3000"
export const API_BASE_URL = resolveApiBaseUrl(apiBaseRaw)

export const SUPABASE_URL = normalizeSupabaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL ?? "")
export const SUPABASE_ANON_KEY = stripQuotes(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "")

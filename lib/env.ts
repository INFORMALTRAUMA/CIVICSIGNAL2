import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1).optional()
})

type Env = z.infer<typeof envSchema>

const rawEnv: Env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
}

const parsed = envSchema.safeParse(rawEnv)

if (!parsed.success && process.env.NODE_ENV !== "production") {
  // Avoid hard crashes during early scaffolding. Prefer explicit checks in callers.
  console.warn("[env] Missing or invalid environment variables", parsed.error.flatten().fieldErrors)
}

export const env: Env = parsed.success ? parsed.data : rawEnv

export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key]
  if (!value) {
    throw new Error(`[env] Missing required environment variable: ${String(key)}`)
  }
  return value
}

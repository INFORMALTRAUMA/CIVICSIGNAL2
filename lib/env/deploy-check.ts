import { z } from "zod"

/** Required for a working deploy on Vercel (web + API + Supabase). */
const vercelDeploySchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1)
})

/**
 * Runs once on Node server startup when deployed on Vercel.
 * Fails fast if required env vars are missing (avoids silent 500s after deploy).
 */
export function assertVercelDeployEnv(): void {
  if (process.env.VERCEL !== "1") {
    return
  }
  const parsed = vercelDeploySchema.safeParse(process.env)
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors
    console.error("[deploy-check] Missing or invalid environment variables:", fields)
    throw new Error("Missing required environment variables for Vercel deployment")
  }
}

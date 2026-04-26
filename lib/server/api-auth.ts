import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

/**
 * Resolves the signed-in user for API routes: Supabase JWT (mobile) or Clerk session (web).
 */
export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization")?.trim() ?? ""
  const bearer = /^Bearer\s+(.+)$/i.exec(header)
  if (bearer?.[1] && env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data, error } = await supabase.auth.getUser(bearer[1])
    if (!error && data.user?.id) {
      return data.user.id
    }
  }

  const { userId } = await auth()
  return userId ?? null
}

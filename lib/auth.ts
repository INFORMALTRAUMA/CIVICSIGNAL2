import { auth } from "@clerk/nextjs/server"

export type UserRole = "citizen" | "official"

export async function getUserRole(): Promise<UserRole | null> {
  const session = await auth()
  const claims = session.sessionClaims as Record<string, unknown> | null
  if (!claims) return null

  const directRole = claims.role
  if (directRole === "official" || directRole === "citizen") return directRole

  const publicMetadata = claims.publicMetadata as Record<string, unknown> | undefined
  const metadata = claims.metadata as Record<string, unknown> | undefined
  const role = publicMetadata?.role ?? metadata?.role

  if (role === "official" || role === "citizen") return role
  return null
}

export async function isOfficial(): Promise<boolean> {
  return (await getUserRole()) === "official"
}

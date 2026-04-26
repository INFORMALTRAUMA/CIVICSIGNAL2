import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

function officialRoleFromUser(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>): boolean {
  const pub = user.publicMetadata as { role?: unknown } | undefined
  const priv = user.privateMetadata as { role?: unknown } | undefined
  const role = pub?.role ?? priv?.role
  return role === "official"
}

/** Requires Clerk sign-in with `publicMetadata.role` or `privateMetadata.role` === `official`. */
export async function requireOfficialUser(): Promise<{ userId: string } | NextResponse> {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!officialRoleFromUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return { userId: user.id }
}

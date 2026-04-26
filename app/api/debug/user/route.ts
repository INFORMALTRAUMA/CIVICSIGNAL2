import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 })
  }

  const publicRole = (user.publicMetadata as Record<string, unknown> | undefined)?.role
  const privateRole = (user.privateMetadata as Record<string, unknown> | undefined)?.role
  const unsafeRole = (user.unsafeMetadata as Record<string, unknown> | undefined)?.role

  return NextResponse.json({
    ok: true,
    userId: user.id,
    email: user.emailAddresses?.[0]?.emailAddress ?? null,
    publicMetadata: user.publicMetadata,
    privateMetadata: user.privateMetadata,
    unsafeMetadata: user.unsafeMetadata,
    resolvedRole: publicRole ?? privateRole ?? unsafeRole ?? null
  })
}

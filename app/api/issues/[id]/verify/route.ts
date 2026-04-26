import { NextResponse } from "next/server"
import { addResolutionVerification } from "@/lib/db/issues"
import { getAuthenticatedUserId } from "@/lib/server/api-auth"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authedUserId = await getAuthenticatedUserId(request)
  if (!authedUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || typeof body.userId !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (body.userId !== authedUserId) {
    return NextResponse.json({ error: "userId must match the signed-in user" }, { status: 403 })
  }

  try {
    await addResolutionVerification(id, body.userId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to verify", details: String(error) }, { status: 500 })
  }
}

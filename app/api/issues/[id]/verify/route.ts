import { NextResponse } from "next/server"
import { addResolutionVerification } from "@/lib/db/issues"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || typeof body.userId !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  try {
    await addResolutionVerification(id, body.userId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to verify", details: String(error) }, { status: 500 })
  }
}

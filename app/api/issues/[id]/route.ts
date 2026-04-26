import { NextResponse } from "next/server"
import { getIssue, updateIssue, addUpvote, addReport, getReportedIssueIdsForUser, getUpvotedIssueIdsForUser } from "@/lib/db/issues"
import { getAuthenticatedUserId } from "@/lib/server/api-auth"
import { requireOfficialUser } from "@/lib/server/clerk-official"
import { updateIssueSchema } from "@/lib/validators/issues"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const viewerId = new URL(request.url).searchParams.get("viewerId")?.trim() || null
  try {
    const issue = await getIssue(id)
    if (viewerId) {
      const [upvoted, reported] = await Promise.all([
        getUpvotedIssueIdsForUser(viewerId, [id]),
        getReportedIssueIdsForUser(viewerId, [id])
      ])
      return NextResponse.json({
        data: {
          ...issue,
          viewer_has_upvoted: upvoted.has(id),
          viewer_has_reported: reported.has(id)
        }
      })
    }
    return NextResponse.json({ data: issue })
  } catch (error) {
    return NextResponse.json({ error: "Issue not found", details: String(error) }, { status: 404 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const official = await requireOfficialUser()
  if (official instanceof NextResponse) {
    return official
  }

  const { id } = await context.params
  const body = await request.json().catch(() => null)
  const parsed = updateIssueSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const issue = await updateIssue(id, parsed.data)
    return NextResponse.json({ data: issue })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update issue", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authedUserId = await getAuthenticatedUserId(request)
  if (!authedUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (body.action === "upvote" && typeof body.userId === "string") {
    if (body.userId !== authedUserId) {
      return NextResponse.json({ error: "userId must match the signed-in user" }, { status: 403 })
    }
    try {
      const { created } = await addUpvote(id, body.userId)
      return NextResponse.json({ ok: true, created })
    } catch (error) {
      return NextResponse.json({ error: "Failed to upvote", details: String(error) }, { status: 500 })
    }
  }

  if (body.action === "report" && typeof body.userId === "string") {
    if (body.userId !== authedUserId) {
      return NextResponse.json({ error: "userId must match the signed-in user" }, { status: 403 })
    }
    try {
      const { created } = await addReport(id, body.userId, typeof body.note === "string" ? body.note : undefined)
      return NextResponse.json({ ok: true, created })
    } catch (error) {
      return NextResponse.json({ error: "Failed to report", details: String(error) }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

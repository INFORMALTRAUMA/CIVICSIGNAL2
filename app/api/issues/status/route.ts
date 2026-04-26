import { NextResponse } from "next/server"
import { updateIssue, addStatusHistory } from "@/lib/db/issues"
import { requireOfficialUser } from "@/lib/server/clerk-official"
import { updateIssueSchema, statusHistorySchema } from "@/lib/validators/issues"

export async function POST(request: Request) {
  const official = await requireOfficialUser()
  if (official instanceof NextResponse) {
    return official
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const statusParsed = statusHistorySchema.safeParse(body)
  const issueParsed = updateIssueSchema.safeParse({ status: body.status })

  if (!statusParsed.success || !issueParsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  try {
    const issue = await updateIssue(body.issueId, { status: body.status })
    await addStatusHistory(body.issueId, body.status, body.note, official.userId)
    return NextResponse.json({ data: issue })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status", details: String(error) }, { status: 500 })
  }
}

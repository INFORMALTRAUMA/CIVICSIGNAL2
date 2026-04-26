import { NextResponse } from "next/server"
import { listIssues, listIssuesWithinRadius, createIssue } from "@/lib/db/issues"
import { getAuthenticatedUserId } from "@/lib/server/api-auth"
import { createIssueSchema, listIssuesQuerySchema } from "@/lib/validators/issues"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const params = Object.fromEntries(searchParams.entries())
  const parsed = listIssuesQuerySchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const { lat, lng, radius, excludeClosed, ...rest } = parsed.data
    const issues =
      lat !== undefined && lng !== undefined && radius !== undefined
        ? await listIssuesWithinRadius({ lat, lng, radius, excludeClosed, ...rest })
        : await listIssues({ ...rest, excludeClosed })
    return NextResponse.json({ data: issues })
  } catch (error) {
    return NextResponse.json({ error: "Failed to load issues", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authedUserId = await getAuthenticatedUserId(request)
  if (!authedUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createIssueSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.createdBy !== authedUserId) {
    return NextResponse.json({ error: "createdBy must match the signed-in user" }, { status: 403 })
  }

  try {
    const issue = await createIssue(parsed.data)
    return NextResponse.json({ data: issue }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create issue", details: String(error) }, { status: 500 })
  }
}

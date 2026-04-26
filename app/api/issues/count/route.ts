import { NextResponse } from "next/server"
import { countIssuesByStatus } from "@/lib/db/issues"
import { issueStatusSchema } from "@/lib/validators/issues"

export async function GET(request: Request) {
  const statusRaw = new URL(request.url).searchParams.get("status")
  const parsed = issueStatusSchema.safeParse(statusRaw)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid or missing status" }, { status: 400 })
  }

  try {
    const count = await countIssuesByStatus(parsed.data)
    return NextResponse.json({ data: { count } })
  } catch (error) {
    return NextResponse.json({ error: "Failed to count issues", details: String(error) }, { status: 500 })
  }
}

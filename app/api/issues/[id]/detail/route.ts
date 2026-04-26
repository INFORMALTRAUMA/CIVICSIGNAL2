import { NextResponse } from "next/server"
import { getIssueWithHistory } from "@/lib/db/issues"

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const data = await getIssueWithHistory(id)
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Issue not found", details: String(error) }, { status: 404 })
  }
}

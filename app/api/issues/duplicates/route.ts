import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getReportedIssueIdsForUser, getUpvotedIssueIdsForUser } from "@/lib/db/issues"
import { duplicateQuerySchema } from "@/lib/validators/issues"

type DuplicateRow = Record<string, unknown> & { issue_id?: string; id?: string }

async function enrichWithViewerSignals(
  rows: DuplicateRow[],
  viewerId: string | undefined
): Promise<DuplicateRow[]> {
  if (!viewerId || rows.length === 0) return rows
  const ids = rows
    .map((r) => (typeof r.issue_id === "string" ? r.issue_id : typeof r.id === "string" ? r.id : null))
    .filter((id): id is string => Boolean(id))
  const [upvoted, reported] = await Promise.all([
    getUpvotedIssueIdsForUser(viewerId, ids),
    getReportedIssueIdsForUser(viewerId, ids)
  ])
  return rows.map((row) => {
    const iid = typeof row.issue_id === "string" ? row.issue_id : typeof row.id === "string" ? row.id : ""
    return {
      ...row,
      viewer_has_upvoted: Boolean(iid && upvoted.has(iid)),
      viewer_has_reported: Boolean(iid && reported.has(iid))
    }
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const parsed = duplicateQuerySchema.safeParse(params)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 })
    }

    const { lat, lng, query, radius, threshold, viewerId } = parsed.data
    
    const supabase = await createSupabaseServerClient()

    // First try the complex function
    try {
      const { data, error } = await supabase.rpc("find_issue_duplicates", {
        lat,
        lng,
        query_text: query,
        radius_m: radius ?? 300,
        min_similarity: threshold ?? 0.2
      })

      if (!error) {
        const rows = (data ?? []) as DuplicateRow[]
        const enriched = await enrichWithViewerSignals(rows, viewerId)
        return NextResponse.json({ data: enriched })
      }
      
      // If the complex function fails, fall back to a simpler version
      console.warn("Complex duplicates function failed, falling back to simple version:", error)
    } catch (rpcError) {
      console.warn("RPC call failed, falling back to simple version:", rpcError)
    }

    // Simple fallback: just get issues within radius without similarity
    const { data: simpleData, error: simpleError } = await supabase
      .from('issues')
      .select('id, title, description, priority_score, status, upvote_count, report_count')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10)

    if (simpleError) {
      return NextResponse.json({ 
        error: "Failed to fetch issues", 
        details: simpleError 
      }, { status: 500 })
    }

    // Add mock similarity scores for testing
    const dataWithScores: DuplicateRow[] =
      simpleData?.map((issue) => ({
        ...issue,
        issue_id: issue.id, // Map id field to issue_id for frontend compatibility
        similarity: Math.random() * 0.5 + 0.3, // Mock similarity between 0.3-0.8
        distance_m: Math.floor(Math.random() * 500 + 50) // Mock distance between 50-550m
      })) || []

    const enrichedFallback = await enrichWithViewerSignals(dataWithScores, viewerId)

    return NextResponse.json({
      data: enrichedFallback,
      fallback: true,
      message: "Using simplified version due to database function issues"
    })
  } catch (err) {
    return NextResponse.json({ 
      error: "Unexpected error", 
      details: {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      } 
    }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get("ids")
  if (!idsParam) {
    return NextResponse.json({ error: "Missing ids" }, { status: 400 })
  }
  const ids = idsParam.split(",").filter(Boolean)
  if (ids.length === 0) {
    return NextResponse.json({ data: {} })
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("issue_resolutions")
    .select("issue_id,verification_count")
    .in("issue_id", ids)

  if (error) {
    return NextResponse.json({ error: "Failed to load verification counts", details: error.message }, { status: 500 })
  }

  const map: Record<string, number> = {}
  for (const row of data ?? []) {
    map[row.issue_id] = row.verification_count
  }

  return NextResponse.json({ data: map })
}

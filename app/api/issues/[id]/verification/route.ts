import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("issue_verifications")
    .select("issue_id")
    .eq("issue_id", id)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Failed to check verification", details: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { verified: Boolean(data) } })
}

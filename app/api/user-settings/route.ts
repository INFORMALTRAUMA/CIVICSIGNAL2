import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { defaultTheme, isThemeId } from "@/lib/theme"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("user_settings")
    .select("theme")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Failed to load settings", details: error.message }, { status: 500 })
  }

  const theme = isThemeId(data?.theme) ? data?.theme : defaultTheme

  if (!data) {
    await supabase.from("user_settings").insert({ user_id: userId, theme }).select().maybeSingle()
  }

  return NextResponse.json({ data: { theme } })
}

export async function PUT(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const theme = body?.theme

  if (!isThemeId(theme)) {
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, theme }, { onConflict: "user_id" })

  if (error) {
    return NextResponse.json({ error: "Failed to update settings", details: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { theme } })
}

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("wards").select("id,name,code,city").order("name")
  if (error) {
    return NextResponse.json({ error: "Failed to load wards", details: error.message }, { status: 500 })
  }
  return NextResponse.json({ data: data ?? [] })
}

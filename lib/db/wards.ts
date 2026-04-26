import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function getWardName(wardId: string) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from("wards").select("name").eq("id", wardId).maybeSingle()
  if (error) return null
  return data?.name ?? null
}

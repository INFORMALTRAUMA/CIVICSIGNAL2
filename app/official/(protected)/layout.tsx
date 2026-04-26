import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import OfficialNav from "@/app/components/OfficialNav"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function OfficialLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) {
    redirect("/official/login?redirect=/official")
  }

  return (
    <div className="min-h-screen bg-[var(--sand)] text-[var(--ink)]">
      <OfficialNav />
      <div className="transition-[padding] lg:pl-[var(--sidebar-width)]">{children}</div>
    </div>
  )
}

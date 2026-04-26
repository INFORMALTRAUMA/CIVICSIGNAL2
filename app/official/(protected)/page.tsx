import { listIssuesAdminSummary } from "@/lib/db/issues"
import OfficialDashboardClient from "@/app/official/(protected)/OfficialDashboardClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function OfficialDashboard() {
  const issues = await listIssuesAdminSummary({ limit: 120 })

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--sand)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute top-[-15%] right-[-10%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(228,95,90,0.35),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-8%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(30,122,117,0.35),transparent_70%)] blur-3xl" />

      <header className="relative page-shell-wide border-b border-[var(--stone)] pb-6 pt-8 lg:pt-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink-soft">
              Operations · Signal management
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">Command dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-soft">
              Live queue metrics, workflow tabs, and tabular roster. Use ward scope to narrow jurisdiction.
            </p>
          </div>
        </div>
      </header>

      <OfficialDashboardClient initialIssues={issues} />
    </main>
  )
}

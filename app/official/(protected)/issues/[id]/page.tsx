import Link from "next/link"
import { getIssueWithHistoryAdmin } from "@/lib/db/issues"
import StatusUpdateForm from "@/app/official/(protected)/issues/[id]/StatusUpdateForm"
import IssueRealtimePanels from "@/app/components/IssueRealtimePanels"
import { getWardName } from "@/lib/db/wards"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const panelShell = "overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm"
const panelHead = "border-b border-[var(--stone)] bg-[var(--sand)] px-4 py-3"
const panelTitle = "text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
const panelBody = "p-4"

export default async function OfficialIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  const officialId = data.user?.id ?? null
  const { id } = await params
  const { issue, history, media, resolution } = await getIssueWithHistoryAdmin(id)
  const wardName = issue.ward_id ? await getWardName(issue.ward_id) : null
  const verificationCount = resolution?.verification_count ?? 0
  const verifiedReadyToClose = issue.status === "resolved" && verificationCount > 0

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--sand)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-70" />
      <div className="pointer-events-none absolute -top-24 right-[-12%] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(228,95,90,0.35),transparent_70%)] blur-3xl" />

      <header className="relative page-shell-wide border-b border-[var(--stone)] pb-6 pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink-soft">Official update</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">{issue.title}</h1>
          </div>
          <Link
            href="/official"
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-[var(--stone)] bg-[var(--paper)] px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <section className="relative page-shell-wide grid gap-6 pb-20 pt-6 lg:grid-cols-[1fr_min(22rem,34vw)] lg:gap-8">
        <div className="space-y-4">
          <div className={panelShell}>
            <div className={panelHead}>
              <h2 className={panelTitle}>Record summary</h2>
            </div>
            <div className={panelBody}>
              {verifiedReadyToClose && (
                <div
                  className="mb-4 rounded-md border-2 border-[var(--teal)] bg-[color-mix(in_oklch,var(--teal)_22%,var(--paper)_78%)] px-3 py-2.5 text-center text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink)]"
                  role="status"
                >
                  Citizen verified ({verificationCount}) — you can close this signal when ready
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                <span className="rounded border border-[var(--stone)] bg-[var(--sand)]/50 px-2 py-0.5">
                  {issue.status.replace("_", " ")}
                </span>
                <span className="rounded border border-[var(--stone)] bg-[var(--sand)]/50 px-2 py-0.5">{issue.priority}</span>
                <span className="rounded border border-[var(--stone)] bg-[var(--sand)]/50 px-2 py-0.5">
                  Severity {issue.severity}
                </span>
                {wardName && (
                  <span className="rounded border border-[var(--stone)] bg-[var(--sand)]/50 px-2 py-0.5">Ward {wardName}</span>
                )}
              </div>
              <p className="mt-4 text-sm text-ink-soft">{issue.description}</p>
            </div>
          </div>

          <IssueRealtimePanels
            issueId={issue.id}
            initialIssue={issue}
            initialHistory={history}
            initialMedia={media}
            showStats={false}
            showHistory={true}
            showMedia={true}
          />
        </div>

        <aside className="space-y-4">
          <div className={panelShell}>
            <div className={panelHead}>
              <h3 className={panelTitle}>Update status</h3>
            </div>
            <div className={panelBody}>
              <p className="text-xs text-ink-soft">Add a note for the public dashboard.</p>
              <div className="mt-4">
                <StatusUpdateForm
                  issueId={issue.id}
                  currentStatus={issue.status}
                  officialId={officialId}
                  verificationCount={verificationCount}
                />
              </div>
            </div>
          </div>

          <IssueRealtimePanels
            issueId={issue.id}
            initialIssue={issue}
            initialHistory={history}
            initialMedia={media}
            showStats={true}
            showHistory={false}
            showMedia={false}
          />

          <div className={panelShell}>
            <div className={panelHead}>
              <h3 className={panelTitle}>Citizen verifications</h3>
            </div>
            <div className={panelBody}>
              <div className="flex items-center justify-between text-sm text-ink-soft">
                <span>Confirmed resolutions</span>
                <span className="font-mono font-semibold tabular-nums text-[var(--ink)]">{resolution?.verification_count ?? 0}</span>
              </div>
              <p className="mt-2 text-xs text-ink-soft">Count updates in real time as citizens verify.</p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import {
  getIssueWithHistory,
  getReportedIssueIdsForUser,
  getUpvotedIssueIdsForUser
} from "@/lib/db/issues"
import IssueActions from "@/app/citizen/issues/[id]/IssueActions"
import IssueRealtimePanels from "@/app/components/IssueRealtimePanels"
import VerifyResolution from "@/app/citizen/issues/[id]/VerifyResolution"
import { getWardName } from "@/lib/db/wards"

const panelShell = "overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm"
const panelHead = "border-b border-[var(--stone)] bg-[var(--sand)] px-4 py-3"
const panelTitle = "text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
const panelBody = "p-4"

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = auth()
  const { id } = await params
  const { issue, history, media, resolution } = await getIssueWithHistory(id)
  const [viewerUpvotes, viewerReports] = userId
    ? await Promise.all([
        getUpvotedIssueIdsForUser(userId, [id]),
        getReportedIssueIdsForUser(userId, [id])
      ])
    : [new Set<string>(), new Set<string>()]
  const initialHasUpvoted = viewerUpvotes.has(id)
  const initialHasReported = viewerReports.has(id)
  const wardName = issue.ward_id ? await getWardName(issue.ward_id) : null

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--sand)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-60" />
      <div className="pointer-events-none absolute -top-28 right-[-10%] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(30,122,117,0.35),transparent_70%)] blur-3xl" />

      <header className="relative page-shell-wide border-b border-[var(--stone)] pb-6 pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink-soft">Signal detail</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">{issue.title}</h1>
          </div>
          <Link
            href="/citizen"
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
              <div className="mt-4 font-mono text-xs tabular-nums text-ink-soft">
                Priority score: <span className="font-semibold text-[var(--ink)]">{issue.priority_score.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className={panelShell}>
            <div className={panelHead}>
              <h2 className={panelTitle}>Community actions</h2>
            </div>
            <div className={panelBody}>
              <p className="text-sm text-ink-soft">Upvote to raise urgency or add your report to this signal.</p>
              <div className="mt-4">
                <IssueActions
                  issueId={issue.id}
                  userId={userId}
                  initialUpvotes={issue.upvote_count}
                  initialReports={issue.report_count}
                  initialHasUpvoted={initialHasUpvoted}
                  initialHasReported={initialHasReported}
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
            showHistory={true}
            showMedia={true}
          />

          {issue.status === "resolved" && (
            <VerifyResolution issueId={issue.id} userId={userId} initialCount={resolution?.verification_count ?? 0} />
          )}
        </div>

        <aside className="space-y-4">
          <div className={panelShell}>
            <div className={panelHead}>
              <h3 className={panelTitle}>Location</h3>
            </div>
            <div className={panelBody}>
              <p className="text-sm text-ink-soft">{issue.address ?? "No address provided"}</p>
              <p className="mt-3 font-mono text-xs text-ink-soft tabular-nums">
                {(() => {
                  const loc = issue.location as unknown
                  if (!loc) return "Coordinates unavailable"
                  if (typeof loc === "string") {
                    const match = loc.match(/POINT\\(([-\\d.]+)\\s+([-\\d.]+)\\)/i)
                    if (match) {
                      return `Lat ${Number(match[2])}, Lng ${Number(match[1])}`
                    }
                    return "Coordinates unavailable"
                  }
                  if (typeof loc === "object" && loc !== null) {
                    const coords = (loc as { coordinates?: number[] }).coordinates
                    if (Array.isArray(coords) && coords.length >= 2) {
                      return `Lat ${coords[1]}, Lng ${coords[0]}`
                    }
                  }
                  return "Coordinates unavailable"
                })()}
              </p>
            </div>
          </div>
          <div className={panelShell}>
            <div className={panelHead}>
              <h3 className={panelTitle}>Created</h3>
            </div>
            <div className={panelBody}>
              <p className="font-mono text-sm text-ink-soft tabular-nums">{new Date(issue.created_at).toISOString().slice(0, 10)}</p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

"use client"

import { useMemo } from "react"
import Link from "next/link"
import type { IssueSummary } from "@/lib/db/issues"
import { IconArrowUpRight, IconChevronLeft, IconChevronRight, IconHome } from "@/app/official/(protected)/OfficialSidebarCollapseIcons"

export type OfficialQueueBuckets = {
  open: IssueSummary[]
  inProgress: IssueSummary[]
  resolvedUnverified: IssueSummary[]
  verifiedReadyToClose: IssueSummary[]
  closed: IssueSummary[]
}

type OfficialDashboardSidebarProps = {
  scopedIssues: IssueSummary[]
  wardMap: Record<string, string>
  buckets: OfficialQueueBuckets
  nextActionIssue: IssueSummary | undefined
  activeWardId: string
  collapsed: boolean
  onToggleCollapsed: () => void
}

export default function OfficialDashboardSidebar({
  scopedIssues,
  wardMap,
  buckets,
  nextActionIssue,
  activeWardId,
  collapsed,
  onToggleCollapsed
}: OfficialDashboardSidebarProps) {
  const total = scopedIssues.length
  const readyCount = buckets.verifiedReadyToClose.length

  const wardBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const issue of scopedIssues) {
      if (issue.ward_id) counts[issue.ward_id] = (counts[issue.ward_id] ?? 0) + 1
    }
    const denom = total || 1
    return Object.entries(counts)
      .map(([id, count]) => ({
        id,
        count,
        name: wardMap[id] ?? `Ward ${id.slice(0, 8)}…`,
        pct: Math.round((count / denom) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [scopedIssues, wardMap, total])

  const unassignedCount = useMemo(
    () => scopedIssues.filter((issue) => !issue.ward_id).length,
    [scopedIssues]
  )

  const scopeLabel = activeWardId ? wardMap[activeWardId] ?? activeWardId : "All wards"

  const maxWardCount = Math.max(1, ...wardBreakdown.map((w) => w.count))

  if (collapsed) {
    return (
      <aside
        className="sticky top-6 flex w-full flex-col items-center gap-4 border border-[var(--stone)] bg-[var(--paper)] py-4 pt-6 shadow-sm"
        aria-label="Context panel (collapsed)"
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--stone)] bg-[var(--sand)] text-[var(--ink)] transition-colors hover:bg-[color-mix(in_oklch,var(--stone)_40%,var(--paper)_60%)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
          aria-expanded={false}
          aria-controls="official-context-panel"
          title="Expand context panel"
        >
          <IconChevronLeft />
          <span className="sr-only">Expand context panel</span>
        </button>
        {readyCount > 0 && (
          <span
            className="flex h-7 min-w-7 items-center justify-center rounded-full border border-[var(--teal)] bg-[color-mix(in_oklch,var(--teal)_18%,var(--paper)_82%)] px-1 font-mono text-[0.6rem] font-bold tabular-nums text-[var(--ink)]"
            title={`${readyCount} verified — ready to close`}
          >
            {readyCount > 99 ? "99+" : readyCount}
          </span>
        )}
        {nextActionIssue && (
          <Link
            href={`/official/issues/${nextActionIssue.id}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--stone)] text-[var(--ink)] transition-colors hover:bg-[var(--sand)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
            title={`Next priority: ${nextActionIssue.title}`}
          >
            <IconArrowUpRight />
            <span className="sr-only">Open next priority</span>
          </Link>
        )}
        <Link
          href="/citizen"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--stone)] text-[var(--ink)] transition-colors hover:bg-[var(--sand)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
          title="Public signal board"
        >
          <IconHome />
          <span className="sr-only">Public signal board</span>
        </Link>
      </aside>
    )
  }

  return (
    <aside
      id="official-context-panel"
      className="min-w-0 lg:sticky lg:top-6 lg:pt-0"
    >
      <div className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm">
        {/* Panel header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--stone)] bg-[var(--sand)] px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Context panel
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Filter snapshot, ward load, and shortcuts. Aligns with the main roster scope.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="shrink-0 rounded-md border border-[var(--stone)] bg-[var(--paper)] p-2 text-[var(--ink)] transition-colors hover:bg-[color-mix(in_oklch,var(--stone)_25%,var(--paper)_75%)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
            aria-expanded={true}
            title="Collapse context panel"
          >
            <IconChevronRight />
            <span className="sr-only">Collapse context panel</span>
          </button>
        </div>

        {/* Scope summary */}
        <section className="border-b border-[var(--stone)] px-4 py-3">
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Active scope
          </h3>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Ward filter</dt>
              <dd className="max-w-[60%] text-right font-medium text-[var(--ink)]">{scopeLabel}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Records in scope</dt>
              <dd className="font-mono font-semibold tabular-nums text-[var(--ink)]">{total}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Unassigned ward</dt>
              <dd
                className={`font-mono font-semibold tabular-nums ${unassignedCount > 0 ? "text-amber-900" : "text-[var(--ink)]"}`}
              >
                {unassignedCount}
              </dd>
            </div>
          </dl>
        </section>

        {/* Attention */}
        {(buckets.verifiedReadyToClose.length > 0 || unassignedCount > 0) && (
          <section className="border-b border-[var(--stone)] px-4 py-3">
            <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Attention
            </h3>
            <ul className="mt-2 space-y-2 text-xs">
              {buckets.verifiedReadyToClose.length > 0 && (
                <li className="rounded border border-[var(--teal)]/40 bg-[color-mix(in_oklch,var(--teal)_10%,var(--paper)_90%)] px-2.5 py-2 text-[var(--ink)]">
                  <span className="font-semibold">{buckets.verifiedReadyToClose.length}</span> verified — ready to
                  close (citizen-confirmed).
                </li>
              )}
              {unassignedCount > 0 && (
                <li className="rounded border border-amber-700/25 bg-amber-50/80 px-2.5 py-2 text-amber-950">
                  <span className="font-semibold">{unassignedCount}</span> record{unassignedCount === 1 ? "" : "s"}{" "}
                  without ward assignment.
                </li>
              )}
            </ul>
          </section>
        )}

        {/* Ward distribution */}
        <section className="border-b border-[var(--stone)] px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Ward distribution
            </h3>
            <span className="font-mono text-[0.65rem] tabular-nums text-ink-soft">Top {wardBreakdown.length}</span>
          </div>
          {wardBreakdown.length === 0 ? (
            <p className="mt-3 text-xs text-ink-soft">No ward-tagged records in this scope.</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded border border-[var(--stone)]">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--stone)] bg-[var(--sand)]">
                    <th className="px-2 py-2 font-semibold uppercase tracking-[0.08em] text-ink-soft">Ward</th>
                    <th className="px-2 py-2 text-right font-semibold uppercase tracking-[0.08em] text-ink-soft">
                      #
                    </th>
                    <th className="px-2 py-2 text-right font-semibold uppercase tracking-[0.08em] text-ink-soft">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wardBreakdown.map((row) => (
                    <tr key={row.id} className="border-b border-[var(--stone)]/70 last:border-b-0">
                      <td className="max-w-[0] px-2 py-2">
                        <span className="block truncate font-medium text-[var(--ink)]" title={row.name}>
                          {row.name}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right font-mono tabular-nums text-[var(--ink)]">
                        {row.count}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right font-mono tabular-nums text-ink-soft">
                        {row.pct}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-[var(--stone)] bg-[var(--sand)]/50 px-2 py-2">
                <p className="text-[0.65rem] uppercase tracking-[0.08em] text-ink-soft">Relative load</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {wardBreakdown.slice(0, 6).map((row) => (
                    <div key={`bar-${row.id}`} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 truncate text-[0.65rem] text-ink-soft" title={row.name}>
                        {row.name}
                      </span>
                      <div className="h-1.5 min-w-0 flex-1 rounded-full bg-[var(--stone)]/40">
                        <div
                          className="h-1.5 rounded-full bg-[var(--ink)]/50"
                          style={{ width: `${Math.max(8, (row.count / maxWardCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Workflow snapshot */}
        <section className="border-b border-[var(--stone)] px-4 py-3">
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Workflow snapshot
          </h3>
          <ul className="mt-2 space-y-1.5 font-mono text-[0.7rem] tabular-nums text-[var(--ink)]">
            <li className="flex justify-between gap-2">
              <span className="text-ink-soft">Ready to close</span>
              <span className="font-semibold">{buckets.verifiedReadyToClose.length}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-ink-soft">Open</span>
              <span>{buckets.open.length}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-ink-soft">In progress</span>
              <span>{buckets.inProgress.length}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-ink-soft">Resolved — pending</span>
              <span>{buckets.resolvedUnverified.length}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-ink-soft">Closed</span>
              <span>{buckets.closed.length}</span>
            </li>
          </ul>
        </section>

        {/* Actions */}
        <section className="px-4 py-3">
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Actions</h3>
          <div className="mt-3 flex flex-col gap-2">
            {nextActionIssue ? (
              <Link
                href={`/official/issues/${nextActionIssue.id}`}
                className="inline-flex items-center justify-center rounded-md bg-[var(--ink)] px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--paper)]"
              >
                Open next priority
              </Link>
            ) : (
              <p className="text-xs text-ink-soft">No records in scope.</p>
            )}
            <Link
              href="/citizen"
              className="inline-flex items-center justify-center rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
            >
              Public signal board
            </Link>
          </div>
        </section>
      </div>
    </aside>
  )
}

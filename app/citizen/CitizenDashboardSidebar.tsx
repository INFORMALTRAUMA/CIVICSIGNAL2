"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import ResolvedSidebar from "@/app/citizen/ResolvedSidebar"
import {
  IconArrowUpRight,
  IconChevronLeft,
  IconChevronRight,
  IconHome
} from "@/app/official/(protected)/OfficialSidebarCollapseIcons"
import type { IssueRecord } from "@/lib/db/issues"

type Ward = { id: string; name: string }

type CitizenDashboardSidebarProps = {
  issues: IssueRecord[]
  activeWardId: string
  searchQuery: string
  queueLabel: string
  collapsed: boolean
  onToggleCollapsed: () => void
  closedArchiveCount: number
}

export default function CitizenDashboardSidebar({
  issues,
  activeWardId,
  searchQuery,
  queueLabel,
  collapsed,
  onToggleCollapsed,
  closedArchiveCount
}: CitizenDashboardSidebarProps) {
  const [wardMap, setWardMap] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch("/api/wards")
        const payload = await response.json().catch(() => null)
        if (!response.ok || cancelled) return
        const entries = (payload?.data ?? []) as Ward[]
        const map: Record<string, string> = {}
        for (const w of entries) map[w.id] = w.name
        if (!cancelled) setWardMap(map)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const total = issues.length
  const open = issues.filter((i) => i.status === "open").length
  const inProgress = issues.filter((i) => i.status === "in_progress").length
  const resolved = issues.filter((i) => i.status === "resolved").length

  const wardBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const issue of issues) {
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
  }, [issues, wardMap, total])

  const unassignedCount = useMemo(() => issues.filter((i) => !i.ward_id).length, [issues])
  const scopeLabel = activeWardId ? wardMap[activeWardId] ?? activeWardId : "All wards"
  const maxWardCount = Math.max(1, ...wardBreakdown.map((w) => w.count))

  const firstResolved = issues.find((i) => i.status === "resolved")

  if (collapsed) {
    return (
      <aside
        className="sticky top-6 flex w-full flex-col items-center gap-4 border border-[var(--stone)] bg-[var(--paper)] py-4 pt-6 shadow-sm"
        aria-label="Citizen context panel (collapsed)"
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--stone)] bg-[var(--sand)] text-[var(--ink)] transition-colors hover:bg-[color-mix(in_oklch,var(--stone)_40%,var(--paper)_60%)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
          aria-expanded={false}
          aria-controls="citizen-context-panel"
          title="Expand context panel"
        >
          <IconChevronLeft />
          <span className="sr-only">Expand context panel</span>
        </button>
        {resolved > 0 && (
          <span
            className="flex h-7 min-w-7 items-center justify-center rounded-full border border-[var(--coral)]/40 bg-[color-mix(in_oklch,var(--coral)_12%,var(--paper)_88%)] px-1 font-mono text-[0.6rem] font-bold tabular-nums text-[var(--ink)]"
            title={`${resolved} resolved in this view`}
          >
            {resolved > 99 ? "99+" : resolved}
          </span>
        )}
        {closedArchiveCount > 0 && (
          <Link
            href="/citizen/archive"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--stone)] text-[0.6rem] font-bold tabular-nums text-[var(--ink)] transition-colors hover:bg-[var(--sand)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
            title="Closed archive"
          >
            {closedArchiveCount > 99 ? "99+" : closedArchiveCount}
            <span className="sr-only">Closed archive</span>
          </Link>
        )}
        <Link
          href="/citizen/report"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--stone)] text-[var(--ink)] transition-colors hover:bg-[var(--sand)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
          title="New report"
        >
          <IconArrowUpRight />
          <span className="sr-only">New report</span>
        </Link>
        <Link
          href="/"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--stone)] text-[var(--ink)] transition-colors hover:bg-[var(--sand)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
          title="Site home"
        >
          <IconHome />
          <span className="sr-only">Site home</span>
        </Link>
      </aside>
    )
  }

  return (
    <aside id="citizen-context-panel" className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:pt-0">
      <div className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--stone)] bg-[var(--sand)] px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Context panel</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Ward load, scope, and shortcuts. Matches your current queue and filters.
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

        <section className="border-b border-[var(--stone)] px-4 py-3">
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Active scope</h3>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Queue</dt>
              <dd className="max-w-[55%] text-right font-medium text-[var(--ink)]">{queueLabel}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Ward filter</dt>
              <dd className="max-w-[55%] text-right font-medium text-[var(--ink)]">{scopeLabel}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Search</dt>
              <dd className="max-w-[55%] truncate text-right font-medium text-[var(--ink)]">
                {searchQuery.trim() ? searchQuery : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Signals in view</dt>
              <dd className="font-mono font-semibold tabular-nums text-[var(--ink)]">{total}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">No ward tag</dt>
              <dd
                className={`font-mono font-semibold tabular-nums ${unassignedCount > 0 ? "text-amber-900" : "text-[var(--ink)]"}`}
              >
                {unassignedCount}
              </dd>
            </div>
          </dl>
        </section>

        {unassignedCount > 0 && (
          <section className="border-b border-[var(--stone)] px-4 py-3">
            <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Attention</h3>
            <p className="mt-2 rounded border border-amber-700/25 bg-amber-50/80 px-2.5 py-2 text-xs text-amber-950">
              <span className="font-semibold">{unassignedCount}</span> signal{unassignedCount === 1 ? "" : "s"} without a
              ward tag in this view.
            </p>
          </section>
        )}

        <section className="border-b border-[var(--stone)] px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Ward distribution</h3>
            <span className="font-mono text-[0.65rem] tabular-nums text-ink-soft">Top {wardBreakdown.length}</span>
          </div>
          {wardBreakdown.length === 0 ? (
            <p className="mt-3 text-xs text-ink-soft">No ward-tagged signals in this view.</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded border border-[var(--stone)]">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--stone)] bg-[var(--sand)]">
                    <th className="px-2 py-2 font-semibold uppercase tracking-[0.08em] text-ink-soft">Ward</th>
                    <th className="px-2 py-2 text-right font-semibold uppercase tracking-[0.08em] text-ink-soft">#</th>
                    <th className="px-2 py-2 text-right font-semibold uppercase tracking-[0.08em] text-ink-soft">%</th>
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

        <section className="border-b border-[var(--stone)] px-4 py-3">
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Workflow snapshot</h3>
          <ul className="mt-2 space-y-1.5 font-mono text-[0.7rem] tabular-nums text-[var(--ink)]">
            <li className="flex justify-between gap-2">
              <span className="text-ink-soft">Open</span>
              <span className="font-semibold">{open}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-ink-soft">In progress</span>
              <span>{inProgress}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-ink-soft">Resolved</span>
              <span>{resolved}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-ink-soft">Closed (archive)</span>
              <span>{closedArchiveCount}</span>
            </li>
          </ul>
        </section>

        <section className="border-b border-[var(--stone)] px-4 py-3">
          <ResolvedSidebar issues={issues} embedded />
        </section>

        <section className="px-4 py-3">
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Verification checklist</h3>
          <ul className="mt-2 space-y-2 text-xs text-ink-soft">
            <li>Confirm location details on each signal before verifying.</li>
            <li>Attach a photo or short video when reporting.</li>
            <li>Upvote existing issues instead of duplicating.</li>
          </ul>
        </section>

        <section className="border-t border-[var(--stone)] px-4 py-3">
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Actions</h3>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/citizen/report"
              className="inline-flex items-center justify-center rounded-md bg-[var(--ink)] px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--paper)]"
            >
              New report
            </Link>
            {firstResolved && (
              <Link
                href={`/citizen/issues/${firstResolved.id}`}
                className="inline-flex items-center justify-center rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
              >
                Open a resolved signal
              </Link>
            )}
            <Link
              href="/citizen/archive"
              className="inline-flex items-center justify-center rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
            >
              Closed archive{closedArchiveCount > 0 ? ` (${closedArchiveCount})` : ""}
            </Link>
          </div>
        </section>
      </div>
    </aside>
  )
}

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import WardSelect from "@/app/citizen/WardSelect"
import OfficialDashboardSidebar from "@/app/official/(protected)/OfficialDashboardSidebar"
import { IconPanel } from "@/app/official/(protected)/OfficialSidebarCollapseIcons"
import type { IssueSummary } from "@/lib/db/issues"
import { formatShortDate } from "@/lib/format-date"
import type { IssueStatus } from "@/lib/db/types"

const OFFICIAL_SIDEBAR_STORAGE_KEY = "civic-official-sidebar-collapsed"

type QueueTabId = "ready" | "open" | "progress" | "resolved_pending" | "closed" | "all"

function partitionByQueue(issues: IssueSummary[]) {
  const open = issues.filter((i) => i.status === "open")
  const inProgress = issues.filter((i) => i.status === "in_progress")
  const resolvedUnverified = issues.filter(
    (i) => i.status === "resolved" && (i.verification_count ?? 0) === 0
  )
  const verifiedReadyToClose = issues.filter(
    (i) => i.status === "resolved" && (i.verification_count ?? 0) > 0
  )
  const closed = issues.filter((i) => i.status === "closed")
  return { open, inProgress, resolvedUnverified, verifiedReadyToClose, closed }
}

function workflowLabel(issue: IssueSummary): string {
  if (issue.status === "resolved" && (issue.verification_count ?? 0) > 0) return "Verified — close"
  if (issue.status === "resolved") return "Resolved — pending verification"
  if (issue.status === "in_progress") return "In progress"
  if (issue.status === "closed") return "Closed"
  return "Open"
}

function statusBadgeClass(status: IssueStatus): string {
  switch (status) {
    case "open":
      return "border-[var(--stone)] bg-[var(--paper)] text-[var(--ink)]"
    case "in_progress":
      return "border-amber-700/35 bg-amber-50 text-amber-950"
    case "resolved":
      return "border-[var(--teal)]/50 bg-[color-mix(in_oklch,var(--teal)_14%,var(--paper)_86%)] text-[var(--ink)]"
    case "closed":
      return "border-[var(--stone)] bg-[var(--sand)] text-ink-soft"
    default:
      return "border-[var(--stone)] bg-[var(--paper)]"
  }
}

type Ward = { id: string; name: string }

export default function OfficialDashboardClient({ initialIssues }: { initialIssues: IssueSummary[] }) {
  const [wardId, setWardId] = useState("")
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<QueueTabId>("ready")
  const [wardMap, setWardMap] = useState<Record<string, string>>({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(OFFICIAL_SIDEBAR_STORAGE_KEY) === "1") {
        setSidebarCollapsed(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(OFFICIAL_SIDEBAR_STORAGE_KEY, next ? "1" : "0")
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

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

  const scopedIssues = useMemo(() => {
    let rows = wardId ? initialIssues.filter((i) => i.ward_id === wardId) : initialIssues
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
      )
    }
    return rows
  }, [initialIssues, wardId, search])

  const buckets = useMemo(() => partitionByQueue(scopedIssues), [scopedIssues])

  const tabRows = useMemo(() => {
    switch (activeTab) {
      case "ready":
        return buckets.verifiedReadyToClose
      case "open":
        return buckets.open
      case "progress":
        return buckets.inProgress
      case "resolved_pending":
        return buckets.resolvedUnverified
      case "closed":
        return buckets.closed
      default:
        return scopedIssues
    }
  }, [activeTab, buckets, scopedIssues])

  const nextActionIssue =
    buckets.verifiedReadyToClose[0] ??
    buckets.open[0] ??
    buckets.inProgress[0] ??
    buckets.resolvedUnverified[0] ??
    scopedIssues[0]

  const tabs: { id: QueueTabId; label: string; count: number }[] = [
    { id: "ready", label: "Ready to close", count: buckets.verifiedReadyToClose.length },
    { id: "open", label: "Open", count: buckets.open.length },
    { id: "progress", label: "In progress", count: buckets.inProgress.length },
    { id: "resolved_pending", label: "Resolved — pending verification", count: buckets.resolvedUnverified.length },
    { id: "closed", label: "Closed", count: buckets.closed.length },
    { id: "all", label: "All", count: scopedIssues.length }
  ]

  const kpi = [
    { label: "Open", value: buckets.open.length },
    { label: "In progress", value: buckets.inProgress.length },
    { label: "Resolved — pending", value: buckets.resolvedUnverified.length },
    { label: "Ready to close", value: buckets.verifiedReadyToClose.length, highlight: true },
    { label: "Closed", value: buckets.closed.length }
  ]

  return (
    <section className="relative page-shell-wide flex flex-col gap-8 pb-20 lg:flex-row lg:items-start lg:gap-6 xl:gap-8">
      <div className="min-w-0 flex-1 space-y-0 transition-[flex] duration-200">
        {/* KPI strip — standard ops dashboard metrics row */}
        <div className="grid grid-cols-2 border border-[var(--stone)] bg-[var(--paper)] sm:grid-cols-3 lg:grid-cols-5">
          {kpi.map((item) => (
            <div
              key={item.label}
              className={`border-b border-[var(--stone)] p-4 lg:border-b-0 lg:border-r lg:last:border-r-0 ${
                item.highlight
                  ? "bg-[color-mix(in_oklch,var(--teal)_10%,var(--paper)_90%)]"
                  : ""
              }`}
            >
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{item.label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--ink)]">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex flex-col gap-4 border-b border-[var(--stone)] pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="grid w-full gap-3 sm:max-w-md">
            <label className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft" htmlFor="official-ward">
              Ward scope
            </label>
            <WardSelect value={wardId} onChange={setWardId} />
          </div>
          <div className="grid w-full gap-3 sm:max-w-md">
            <label className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft" htmlFor="official-search">
              Search roster
            </label>
            <input
              id="official-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, description, or ID"
              className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-sm outline-none ring-[var(--teal)] focus:ring-2"
            />
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:ml-auto">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] transition-colors hover:bg-[var(--sand)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
              aria-pressed={sidebarCollapsed}
              title={sidebarCollapsed ? "Expand context panel" : "Collapse context panel"}
            >
              <IconPanel className="h-4 w-4 shrink-0 opacity-70" />
              {sidebarCollapsed ? "Show panel" : "Hide panel"}
            </button>
            <p className="w-full text-xs text-ink-soft sm:w-auto sm:text-right">
              Showing <span className="font-mono font-semibold text-[var(--ink)]">{tabRows.length}</span> in view ·{" "}
              <span className="font-mono font-semibold text-[var(--ink)]">{scopedIssues.length}</span> in scope
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="mt-4 flex flex-wrap gap-1 border-b border-[var(--stone)]"
          role="tablist"
          aria-label="Workflow queue"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                  selected ? "text-[var(--ink)]" : "text-ink-soft hover:text-[var(--ink)]"
                }`}
              >
                <span className="whitespace-nowrap">
                  {tab.label}
                  <span className="ml-1.5 font-mono tabular-nums opacity-80">({tab.count})</span>
                </span>
                {selected && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ink)]" aria-hidden />
                )}
              </button>
            )
          })}
        </div>

        {/* Data table */}
        <div className="mt-4 overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--stone)] bg-[var(--sand)]">
                  <th scope="col" className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Signal
                  </th>
                  <th scope="col" className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Status
                  </th>
                  {activeTab === "all" && (
                    <th scope="col" className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                      Workflow
                    </th>
                  )}
                  <th scope="col" className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Priority
                  </th>
                  <th scope="col" className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Up / Rpt
                  </th>
                  <th scope="col" className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Verif.
                  </th>
                  <th scope="col" className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Ward
                  </th>
                  <th scope="col" className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Updated
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {tabRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeTab === "all" ? 9 : 8}
                      className="px-4 py-12 text-center text-sm text-ink-soft"
                    >
                      No records in this queue for the current scope.
                    </td>
                  </tr>
                ) : (
                  tabRows.map((issue) => (
                    <tr
                      key={issue.id}
                      className="border-b border-[var(--stone)]/80 transition-colors hover:bg-[color-mix(in_oklch,var(--sand)_65%,var(--paper)_35%)] last:border-b-0"
                    >
                      <td className="max-w-[220px] px-4 py-3 align-top">
                        <Link
                          href={`/official/issues/${issue.id}`}
                          className="font-medium text-[var(--ink)] underline-offset-2 hover:underline"
                        >
                          {issue.title}
                        </Link>
                        <p className="mt-0.5 font-mono text-[0.65rem] text-ink-soft tabular-nums">
                          {issue.id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">
                        <span
                          className={`inline-block rounded border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] ${statusBadgeClass(issue.status)}`}
                        >
                          {issue.status.replace("_", " ")}
                        </span>
                      </td>
                      {activeTab === "all" && (
                        <td className="max-w-[160px] px-4 py-3 align-top text-xs text-ink-soft">
                          {workflowLabel(issue)}
                        </td>
                      )}
                      <td className="whitespace-nowrap px-4 py-3 align-top font-mono tabular-nums text-[var(--ink)]">
                        {Number(issue.priority_score).toFixed(1)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs tabular-nums text-ink-soft">
                        {issue.upvote_count} / {issue.report_count}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs tabular-nums">
                        {issue.status === "resolved" || (issue.verification_count ?? 0) > 0
                          ? issue.verification_count ?? 0
                          : "—"}
                      </td>
                      <td className="max-w-[120px] truncate px-4 py-3 align-top text-xs text-ink-soft">
                        {issue.ward_id ? wardMap[issue.ward_id] ?? issue.ward_id.slice(0, 8) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-ink-soft">
                        {formatShortDate(issue.updated_at)}
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <Link
                          href={`/official/issues/${issue.id}`}
                          className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--teal)] hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {sidebarCollapsed ? (
        <>
          <div className="hidden shrink-0 lg:block lg:w-12">
            <OfficialDashboardSidebar
              scopedIssues={scopedIssues}
              wardMap={wardMap}
              buckets={buckets}
              nextActionIssue={nextActionIssue}
              activeWardId={wardId}
              collapsed
              onToggleCollapsed={toggleSidebar}
            />
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-[var(--stone)] bg-[var(--paper)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] lg:hidden"
            aria-controls="official-context-panel"
            title="Open context panel"
          >
            <IconPanel className="shrink-0 opacity-80" />
            Context
          </button>
        </>
      ) : (
        <div className="w-full shrink-0 lg:w-[380px] lg:max-w-[380px]">
          <OfficialDashboardSidebar
            scopedIssues={scopedIssues}
            wardMap={wardMap}
            buckets={buckets}
            nextActionIssue={nextActionIssue}
            activeWardId={wardId}
            collapsed={false}
            onToggleCollapsed={toggleSidebar}
          />
        </div>
      )}
    </section>
  )
}

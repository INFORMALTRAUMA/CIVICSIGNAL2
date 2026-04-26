"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import IssueFeed from "@/app/citizen/IssueFeed"
import CitizenDashboardSidebar from "@/app/citizen/CitizenDashboardSidebar"
import WardSelect from "@/app/citizen/WardSelect"
import { IconPanel } from "@/app/official/(protected)/OfficialSidebarCollapseIcons"
import type { IssueRecord } from "@/lib/db/issues"

const CITIZEN_CONTEXT_STORAGE_KEY = "civic-citizen-context-collapsed"

type QueueTabId = "all" | "open" | "in_progress" | "resolved"

function partitionCitizen(issues: IssueRecord[]) {
  return {
    open: issues.filter((i) => i.status === "open"),
    inProgress: issues.filter((i) => i.status === "in_progress"),
    resolved: issues.filter((i) => i.status === "resolved")
  }
}

export default function DashboardClient({
  initialIssues,
  closedCount
}: {
  initialIssues: IssueRecord[]
  closedCount: number
}) {
  const [issues, setIssues] = useState<IssueRecord[]>(initialIssues)
  const [wardId, setWardId] = useState("")
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<QueueTabId>("all")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { userId } = useAuth()

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(CITIZEN_CONTEXT_STORAGE_KEY) === "1") {
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
        localStorage.setItem(CITIZEN_CONTEXT_STORAGE_KEY, next ? "1" : "0")
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const buckets = useMemo(() => partitionCitizen(issues), [issues])

  const tabStatus = useMemo(() => {
    if (activeTab === "all") return ""
    return activeTab
  }, [activeTab])

  const scopedForTabs = useMemo(() => {
    switch (activeTab) {
      case "open":
        return buckets.open
      case "in_progress":
        return buckets.inProgress
      case "resolved":
        return buckets.resolved
      default:
        return issues
    }
  }, [activeTab, buckets, issues])

  const tabs: { id: QueueTabId; label: string; count: number }[] = [
    { id: "all", label: "All active", count: issues.length },
    { id: "open", label: "Open", count: buckets.open.length },
    { id: "in_progress", label: "In progress", count: buckets.inProgress.length },
    { id: "resolved", label: "Resolved", count: buckets.resolved.length }
  ]

  const queueLabel = tabs.find((t) => t.id === activeTab)?.label ?? "All active"

  const kpi = [
    { label: "Open", value: buckets.open.length },
    { label: "In progress", value: buckets.inProgress.length },
    { label: "Resolved", value: buckets.resolved.length },
    { label: "Closed (archive)", value: closedCount, href: "/citizen/archive" as const }
  ]

  return (
    <section className="relative page-shell-wide flex flex-col gap-8 pb-20 lg:flex-row lg:items-start lg:gap-6 xl:gap-8">
      <div className="min-w-0 flex-1 space-y-0 transition-[flex] duration-200">
        <div className="grid grid-cols-2 border border-[var(--stone)] bg-[var(--paper)] sm:grid-cols-4">
          {kpi.map((item) => (
            <div
              key={item.label}
              className="border-b border-[var(--stone)] p-4 sm:border-b-0 sm:border-r sm:last:border-r-0"
            >
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{item.label}</p>
              {"href" in item && item.href ? (
                <Link
                  href={item.href}
                  className="mt-1 block font-mono text-2xl font-semibold tabular-nums text-[var(--ink)] underline-offset-2 hover:underline"
                >
                  {item.value}
                </Link>
              ) : (
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--ink)]">{item.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-b border-[var(--stone)] pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="grid w-full gap-3 sm:max-w-xs">
            <label className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft" htmlFor="citizen-ward">
              Ward scope
            </label>
            <WardSelect
              id="citizen-ward"
              value={wardId}
              onChange={setWardId}
              className="w-full rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-sm outline-none ring-[var(--teal)] focus:ring-2"
            />
          </div>
          <div className="grid w-full gap-3 sm:max-w-md">
            <label className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft" htmlFor="citizen-search">
              Search roster
            </label>
            <input
              id="citizen-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, description, or ID"
              className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-sm outline-none ring-[var(--teal)] focus:ring-2"
            />
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto">
            <Link
              href="/citizen/report"
              className="inline-flex items-center justify-center rounded-md bg-[var(--ink)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)]"
            >
              New report
            </Link>
            <Link
              href="/citizen/archive"
              className="inline-flex items-center justify-center rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
            >
              Archive{closedCount > 0 ? ` (${closedCount})` : ""}
            </Link>
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
          </div>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-1 border-b border-[var(--stone)]"
          role="tablist"
          aria-label="Signal queue"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`citizen-tab-${tab.id}`}
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

        <div className="mt-4">
          <IssueFeed
            initialIssues={initialIssues}
            onIssuesChange={setIssues}
            userId={userId ?? null}
            excludeClosed
            title="Signal roster"
            subtitle="Live feed · priority and verification"
            filterWire={{ wardId, search, status: tabStatus, applyStatusToApi: false }}
            presentation="table"
          />
        </div>
      </div>

      <div
        className={`w-full shrink-0 transition-[width] duration-200 lg:w-[min(22rem,32vw)] xl:w-[min(24rem,30vw)] ${
          sidebarCollapsed ? "lg:w-[4.5rem] xl:w-[4.5rem]" : ""
        }`}
      >
        <CitizenDashboardSidebar
          issues={scopedForTabs}
          activeWardId={wardId}
          searchQuery={search}
          queueLabel={queueLabel}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebar}
          closedArchiveCount={closedCount}
        />
      </div>
    </section>
  )
}

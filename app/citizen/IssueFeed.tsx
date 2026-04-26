"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import SignalCard from "@/app/components/SignalCard"
import { createSupabaseBrowserAnonClient } from "@/lib/supabase/client"
import type { IssueRecord } from "@/lib/db/issues"
import type { IssueStatus } from "@/lib/db/types"
import WardSelect from "@/app/citizen/WardSelect"
import { formatShortDate } from "@/lib/format-date"

const statusOptionsAll = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" }
]

type IssueFeedProps = {
  initialIssues: IssueRecord[]
  onIssuesChange?: (issues: IssueRecord[]) => void
  userId: string | null
  /** Omit closed issues unless a specific status filter is chosen (main dashboard). */
  excludeClosed?: boolean
  /** Lock feed to one status and hide the status filter (e.g. closed archive). */
  lockedStatus?: IssueRecord["status"]
  /** Override section title */
  title?: string
  subtitle?: string
  /** Parent-owned filters (ops dashboard); hides inline status/search/ward row. */
  filterWire?: {
    wardId: string
    search: string
    status: string
    /** When false, `status` only filters rows locally so tab counts can use the full scoped fetch. */
    applyStatusToApi?: boolean
  }
  /** Tabular roster vs cards. */
  presentation?: "cards" | "table"
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

type Ward = {
  id: string
  name: string
}

export default function IssueFeed({
  initialIssues,
  onIssuesChange,
  userId,
  excludeClosed = false,
  lockedStatus,
  title = "Priority queue",
  subtitle = "Live sorting by impact",
  filterWire,
  presentation = "cards"
}: IssueFeedProps) {
  const [issues, setIssues] = useState<IssueRecord[]>(initialIssues)
  const [internalStatus, setInternalStatus] = useState("")
  const [internalSearch, setInternalSearch] = useState("")
  const [internalWardId, setInternalWardId] = useState("")
  const status = filterWire?.status ?? internalStatus
  const search = filterWire?.search ?? internalSearch
  const wardId = filterWire?.wardId ?? internalWardId
  const [radius, setRadius] = useState(500)
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(new Set())
  const [wardMap, setWardMap] = useState<Record<string, string>>({})
  const [verificationCounts, setVerificationCounts] = useState<Record<string, number>>({})

  const visibleIssues = useMemo(() => {
    if (filterWire && filterWire.applyStatusToApi === false && !lockedStatus) {
      const s = filterWire.status
      if (!s) return issues
      return issues.filter((i) => i.status === s)
    }
    return issues
  }, [issues, filterWire, lockedStatus])

  const maxScore = useMemo(() => {
    const values = visibleIssues.map((issue) => issue.priority_score)
    return values.length ? Math.max(...values) : 1
  }, [visibleIssues])

  const statusOptions = useMemo(
    () => (excludeClosed && !lockedStatus ? statusOptionsAll.filter((o) => o.value !== "closed") : statusOptionsAll),
    [excludeClosed, lockedStatus]
  )

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    const statusForApi =
      lockedStatus ??
      (filterWire && filterWire.applyStatusToApi === false ? "" : filterWire?.status ?? status)
    if (statusForApi) params.set("status", statusForApi)
    if (!lockedStatus && excludeClosed) params.set("excludeClosed", "true")
    if (search) params.set("search", search)
    if (wardId) params.set("wardId", wardId)
    if (lat && lng && radius) {
      params.set("lat", lat)
      params.set("lng", lng)
      params.set("radius", String(radius))
    }
    params.set("limit", "100")
    return params.toString()
  }, [status, search, wardId, lat, lng, radius, lockedStatus, excludeClosed, filterWire])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/issues?${queryString}`)
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load issues")
      }
      const data = payload.data ?? []
      setIssues(data)
      onIssuesChange?.(data)
    } catch {
      // Ignore for now
    } finally {
      setLoading(false)
    }
  }

  const fetchVerified = async (issueIds: string[]) => {
    if (!userId || issueIds.length === 0) return
    try {
      const results = await Promise.all(
        issueIds.map(async (id) => {
          const response = await fetch(`/api/issues/${id}/verification?userId=${userId}`)
          const payload = await response.json().catch(() => null)
          return response.ok && payload?.data?.verified ? id : null
        })
      )
      const verified = results.filter(Boolean) as string[]
      setVerifiedIds(new Set(verified))
    } catch {
      // Ignore
    }
  }

  const fetchWardMap = async () => {
    try {
      const response = await fetch("/api/wards")
      const payload = await response.json().catch(() => null)
      if (!response.ok) return
      const entries = (payload?.data ?? []) as Ward[]
      const map: Record<string, string> = {}
      for (const ward of entries) {
        map[ward.id] = ward.name
      }
      setWardMap(map)
    } catch {
      // Ignore
    }
  }

  const fetchVerificationCounts = async (issueIds: string[]) => {
    if (issueIds.length === 0) return
    try {
      const response = await fetch(`/api/issues/verifications?ids=${issueIds.join(",")}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok) return
      setVerificationCounts(payload?.data ?? {})
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    fetchIssues()
  }, [queryString])

  useEffect(() => {
    fetchWardMap()
  }, [])

  useEffect(() => {
    const supabase = createSupabaseBrowserAnonClient()
    const channel = supabase
      .channel("issues-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        () => {
          fetchIssues()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryString])

  useEffect(() => {
    if (!userId) return
    const resolvedIds = visibleIssues.filter((issue) => issue.status === "resolved").map((issue) => issue.id)
    fetchVerified(resolvedIds)
  }, [visibleIssues, userId])

  useEffect(() => {
    const ids = visibleIssues.map((issue) => issue.id)
    fetchVerificationCounts(ids)
  }, [visibleIssues])

  const handleUseLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((position) => {
      setLat(position.coords.latitude.toFixed(6))
      setLng(position.coords.longitude.toFixed(6))
    })
  }

  const handleVerify = async (issueId: string) => {
    if (!userId) return
    setVerifying(issueId)
    try {
      const response = await fetch(`/api/issues/${issueId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })
      if (!response.ok) {
        throw new Error("Unable to verify")
      }
      setVerifiedIds((current) => new Set(current).add(issueId))
      setVerificationCounts((current) => ({
        ...current,
        [issueId]: (current[issueId] ?? 0) + 1
      }))
    } catch {
      // Ignore for now
    } finally {
      setVerifying(null)
    }
  }

  const showInlineFilters = !filterWire

  return (
    <div
      className={
        filterWire
          ? "space-y-0"
          : "space-y-0 overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] p-6 shadow-sm"
      }
    >
      <div className={`flex flex-wrap items-center justify-between gap-3 ${filterWire ? "border-b border-[var(--stone)] pb-4" : ""}`}>
        <div>
          <h2 className={filterWire ? "text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft" : "text-lg font-semibold"}>
            {title}
          </h2>
          {!filterWire && <p className="mt-1 text-xs uppercase tracking-[0.3em] text-ink-soft">{subtitle}</p>}
          {filterWire && <p className="mt-1 text-xs text-ink-soft">{subtitle}</p>}
        </div>
        {showInlineFilters && (
          <div className="flex flex-wrap items-center gap-3">
            {!lockedStatus && (
              <select
                value={status}
                onChange={(event) => setInternalStatus(event.target.value)}
                className="w-full rounded-full border border-[var(--ink)] bg-[var(--paper)] px-4 py-2 text-xs uppercase tracking-[0.2em] sm:w-auto"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <input
              value={search}
              onChange={(event) => setInternalSearch(event.target.value)}
              placeholder="Search"
              className="w-full rounded-full border border-[var(--ink)] bg-[var(--paper)] px-4 py-2 text-xs sm:w-auto"
            />
            <WardSelect value={wardId} onChange={setInternalWardId} />
          </div>
        )}
      </div>

      <details className={`${filterWire ? "mt-4" : "mt-4"} group rounded-md border border-[var(--stone)] bg-[var(--sand)]/30`}>
        <summary className="cursor-pointer select-none px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Location filters
        </summary>
        <div className="grid gap-3 border-t border-[var(--stone)] px-4 py-4 md:grid-cols-[1fr_1fr_auto]">
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-soft">Latitude</label>
            <input
              value={lat}
              onChange={(event) => setLat(event.target.value)}
              placeholder="12.9716"
              className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-xs outline-none ring-[var(--teal)] focus:ring-2"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-soft">Longitude</label>
            <input
              value={lng}
              onChange={(event) => setLng(event.target.value)}
              placeholder="77.5946"
              className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-xs outline-none ring-[var(--teal)] focus:ring-2"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-soft">Radius (m)</label>
            <input
              type="range"
              min={100}
              max={5000}
              step={100}
              value={radius}
              onChange={(event) => setRadius(Number(event.target.value))}
              className="w-full accent-[var(--teal)]"
            />
            <div className="text-xs text-ink-soft">{radius} meters</div>
          </div>
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleUseLocation}
              className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] transition hover:bg-[var(--sand)]"
            >
              Use my location
            </button>
          </div>
        </div>
      </details>

      {loading && <p className="mt-3 text-xs uppercase tracking-[0.2em] text-ink-soft">Refreshing...</p>}

      {visibleIssues.length === 0 ? (
        <div
          className={`mt-6 border border-dashed border-[var(--stone)] text-center ${presentation === "table" ? "rounded-md p-10" : "rounded-md p-8"}`}
        >
          <p className="text-sm text-ink-soft">
            {lockedStatus === "closed"
              ? "No closed signals in the archive yet."
              : "No signals yet. Start by reporting or upvoting an issue."}
          </p>
        </div>
      ) : presentation === "table" ? (
        <div className="mt-4 overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--stone)] bg-[var(--sand)]">
                  <th className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Signal</th>
                  <th className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Status</th>
                  <th className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Priority</th>
                  <th className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Up / Rpt</th>
                  <th className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Verif.</th>
                  <th className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Ward</th>
                  <th className="px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Updated</th>
                  <th className="px-4 py-3 text-right text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="border-b border-[var(--stone)]/80 transition-colors hover:bg-[color-mix(in_oklch,var(--sand)_65%,var(--paper)_35%)] last:border-b-0"
                  >
                    <td className="max-w-[200px] px-4 py-3 align-top">
                      <Link
                        href={`/citizen/issues/${issue.id}`}
                        className="font-medium text-[var(--ink)] underline-offset-2 hover:underline"
                      >
                        {issue.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-[0.65rem] text-ink-soft tabular-nums">{issue.id.slice(0, 8)}…</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] ${statusBadgeClass(issue.status)}`}
                      >
                        {issue.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono tabular-nums text-[var(--ink)]">
                      {issue.priority_score.toFixed(1)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs tabular-nums text-ink-soft">
                      {issue.upvote_count} / {issue.report_count}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs tabular-nums text-ink-soft">
                      {verificationCounts[issue.id] ?? "—"}
                    </td>
                    <td className="max-w-[100px] px-4 py-3 align-top text-xs text-ink-soft">
                      <span className="block truncate" title={issue.ward_id ? wardMap[issue.ward_id] : undefined}>
                        {issue.ward_id ? wardMap[issue.ward_id] ?? "—" : "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-ink-soft">
                      {formatShortDate(issue.updated_at)}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      {issue.status === "resolved" && userId && !verifiedIds.has(issue.id) ? (
                        <button
                          type="button"
                          onClick={() => handleVerify(issue.id)}
                          disabled={verifying === issue.id}
                          className="rounded-md bg-[var(--ink)] px-2.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--paper)] disabled:opacity-60"
                        >
                          {verifying === issue.id ? "…" : "Verify"}
                        </button>
                      ) : (
                        <Link
                          href={`/citizen/issues/${issue.id}`}
                          className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--ink)] underline-offset-2 hover:underline"
                        >
                          Open
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleIssues.map((issue) => (
            <SignalCard
              key={issue.id}
              issue={issue}
              href={`/citizen/issues/${issue.id}`}
              maxScore={maxScore}
              wardName={issue.ward_id ? wardMap[issue.ward_id] ?? "Ward" : null}
            >
              {verificationCounts[issue.id] !== undefined && (
                <div className="mb-3 text-xs uppercase tracking-[0.2em] text-ink-soft">
                  Verified {verificationCounts[issue.id]}
                </div>
              )}
              {issue.status === "resolved" && userId && !verifiedIds.has(issue.id) && (
                <div className="rounded-md border border-[var(--stone)] bg-[var(--paper)] p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="uppercase tracking-[0.2em] text-ink-soft">Resolved? Verify</span>
                    <button
                      type="button"
                      onClick={() => handleVerify(issue.id)}
                      disabled={verifying === issue.id}
                      className="rounded-full bg-[var(--ink)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--paper)] disabled:opacity-60"
                    >
                      {verifying === issue.id ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </div>
              )}
            </SignalCard>
          ))}
        </div>
      )}
    </div>
  )
}

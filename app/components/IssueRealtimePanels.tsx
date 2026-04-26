"use client"

import { useEffect, useState } from "react"
import { createSupabaseBrowserAnonClient } from "@/lib/supabase/client"
import MediaGallery from "@/app/components/MediaGallery"
import type { IssueMedia, IssueRecord, IssueStatusHistory } from "@/lib/db/issues"

type IssueRealtimePanelsProps = {
  issueId: string
  initialIssue: IssueRecord
  initialHistory: IssueStatusHistory[]
  initialMedia: IssueMedia[]
  showStats?: boolean
  showHistory?: boolean
  showMedia?: boolean
}

const panelShell = "overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm"
const panelHead = "border-b border-[var(--stone)] bg-[var(--sand)] px-4 py-3"
const panelTitle = "text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
const panelBody = "p-4"

export default function IssueRealtimePanels({
  issueId,
  initialIssue,
  initialHistory,
  initialMedia,
  showStats = true,
  showHistory = true,
  showMedia = true
}: IssueRealtimePanelsProps) {
  const [issue, setIssue] = useState<IssueRecord>(initialIssue)
  const [history, setHistory] = useState<IssueStatusHistory[]>(initialHistory)
  const [media, setMedia] = useState<IssueMedia[]>(initialMedia)

  useEffect(() => {
    const supabase = createSupabaseBrowserAnonClient()
    const channel = supabase
      .channel(`issue-detail-${issueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues", filter: `id=eq.${issueId}` },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issue_status_history", filter: `issue_id=eq.${issueId}` },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issue_media", filter: `issue_id=eq.${issueId}` },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issue_resolutions", filter: `issue_id=eq.${issueId}` },
        () => refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [issueId])

  const refresh = async () => {
    const response = await fetch(`/api/issues/${issueId}/detail`)
    if (!response.ok) return
    const payload = await response.json()
    if (!payload?.data) return
    setIssue(payload.data.issue)
    setHistory(payload.data.history)
    setMedia(payload.data.media)
  }

  return (
    <div className="space-y-4">
      {showStats && (
        <div className={panelShell}>
          <div className={panelHead}>
            <h3 className={panelTitle}>Signal stats</h3>
          </div>
          <div className={`${panelBody} grid gap-3 sm:grid-cols-3`}>
            <div className="rounded-md border border-[var(--stone)] bg-[var(--sand)]/40 p-3">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Upvotes</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--ink)]">{issue.upvote_count}</p>
            </div>
            <div className="rounded-md border border-[var(--stone)] bg-[var(--sand)]/40 p-3">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Reports</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--ink)]">{issue.report_count}</p>
            </div>
            <div className="rounded-md border border-[var(--stone)] bg-[var(--sand)]/40 p-3">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Priority</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--ink)]">
                {issue.priority_score.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className={panelShell}>
          <div className={panelHead}>
            <h2 className={panelTitle}>Status updates</h2>
          </div>
          <div className={panelBody}>
            {history.length === 0 ? (
              <p className="text-sm text-ink-soft">No updates posted yet.</p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {history.map((entry) => (
                  <div key={entry.id} className="rounded-md border border-[var(--stone)] bg-[var(--sand)]/30 p-3">
                    <div className="flex items-center justify-between text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                      <span>{entry.status.replace("_", " ")}</span>
                      <span className="font-mono tabular-nums">
                        {new Date(entry.created_at).toISOString().replace("T", " ").slice(0, 19)}
                      </span>
                    </div>
                    {entry.note && <p className="mt-2 text-sm text-ink-soft">{entry.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showMedia && (
        <div className={panelShell}>
          <div className={panelHead}>
            <h2 className={panelTitle}>Media</h2>
          </div>
          <div className={panelBody}>
            {media.length === 0 ? (
              <p className="text-sm text-ink-soft">No photos or videos attached yet.</p>
            ) : (
              <MediaGallery items={media} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

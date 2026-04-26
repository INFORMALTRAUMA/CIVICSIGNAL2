"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"

type IssueActionsProps = {
  issueId: string
  userId?: string | null
  initialUpvotes: number
  initialReports: number
  initialHasUpvoted?: boolean
  initialHasReported?: boolean
}

const btnSecondary =
  "rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] transition hover:bg-[var(--sand)] disabled:opacity-50"
const btnPrimary =
  "rounded-md bg-[var(--ink)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)] disabled:opacity-50"

export default function IssueActions({
  issueId,
  userId: userIdProp,
  initialUpvotes,
  initialReports,
  initialHasUpvoted = false,
  initialHasReported = false
}: IssueActionsProps) {
  const { userId, isLoaded, isSignedIn } = useAuth()
  const effectiveUserId = userIdProp ?? userId
  const isAuthenticated = Boolean(effectiveUserId) || (isLoaded && isSignedIn)
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [reports, setReports] = useState(initialReports)
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted)
  const [hasReported, setHasReported] = useState(initialHasReported)
  const [busy, setBusy] = useState<"upvote" | "report" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const send = async (action: "upvote" | "report") => {
    if (!isLoaded) {
      setError("Loading session. Try again.")
      return
    }
    if (!isAuthenticated || !effectiveUserId) {
      setError("Sign in to continue.")
      return
    }
    setError(null)
    setBusy(action)
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: effectiveUserId })
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error((payload as { error?: string } | null)?.error ?? "Request failed")
      }
      if (action === "upvote") {
        const created = (payload as { created?: boolean } | null)?.created !== false
        if (created) setUpvotes((value) => value + 1)
        setHasUpvoted(true)
      }
      if (action === "report") {
        const created = (payload as { created?: boolean } | null)?.created !== false
        if (created) setReports((value) => value + 1)
        setHasReported(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => send("upvote")} disabled={busy === "upvote" || hasUpvoted} className={btnSecondary}>
          {busy === "upvote" ? "Upvoting..." : hasUpvoted ? `Upvoted (${upvotes})` : `Upvote (${upvotes})`}
        </button>
        <button type="button" onClick={() => send("report")} disabled={busy === "report" || hasReported} className={btnPrimary}>
          {busy === "report" ? "Reporting..." : hasReported ? `Reported (${reports})` : `Report (${reports})`}
        </button>
      </div>
      {error && <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-red-700">{error}</p>}
    </div>
  )
}

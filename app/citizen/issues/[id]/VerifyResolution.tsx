"use client"

import { useEffect, useState } from "react"
import { SignInButton, useAuth } from "@clerk/nextjs"
import { createSupabaseBrowserAnonClient } from "@/lib/supabase/client"

export default function VerifyResolution({
  issueId,
  initialCount,
  userId: userIdProp
}: {
  issueId: string
  initialCount: number
  userId?: string | null
}) {
  const { userId, isLoaded, isSignedIn } = useAuth()
  const effectiveUserId = userIdProp ?? userId
  const isAuthenticated = Boolean(effectiveUserId) || (isLoaded && isSignedIn)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [alreadyVerified, setAlreadyVerified] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserAnonClient()
    const channel = supabase
      .channel(`issue-resolution-${issueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issue_resolutions", filter: `issue_id=eq.${issueId}` },
        (payload) => {
          const next = payload.new as { verification_count?: number }
          if (typeof next?.verification_count === "number") {
            setCount(next.verification_count)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [issueId])

  useEffect(() => {
    const check = async () => {
      if (!isLoaded || !isAuthenticated || !effectiveUserId) return
      const response = await fetch(`/api/issues/${issueId}/verification?userId=${effectiveUserId}`)
      const payload = await response.json().catch(() => null)
      if (response.ok && payload?.data?.verified) {
        setAlreadyVerified(true)
      }
    }
    check()
  }, [issueId, effectiveUserId, isLoaded, isAuthenticated])

  const handleVerify = async () => {
    if (!isLoaded) {
      setError("Loading session. Try again.")
      return
    }
    if (!isAuthenticated || !effectiveUserId) {
      setError("Sign in to verify.")
      return
    }
    if (alreadyVerified) return
    setError(null)
    setSuccess(false)
    setBusy(true)
    try {
      const response = await fetch(`/api/issues/${issueId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: effectiveUserId })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? "Unable to verify")
      }
      setSuccess(true)
      setAlreadyVerified(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm">
      <div className="border-b border-[var(--stone)] bg-[var(--sand)] px-4 py-3">
        <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Resolution verification</h3>
      </div>
      <div className="p-4">
        <p className="text-sm text-ink-soft">Confirm if this issue has been resolved in your area.</p>
        {!isLoaded && <p className="mt-4 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Loading session…</p>}
        {isLoaded && !isAuthenticated && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em]">Sign in to verify.</span>
            <SignInButton mode="modal">
              <button className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]">
                Sign in
              </button>
            </SignInButton>
          </div>
        )}
        {isLoaded && isAuthenticated && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            <span className="rounded border border-[var(--stone)] bg-[var(--sand)]/50 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.1em]">
              {count} confirmations
            </span>
            <button
              type="button"
              onClick={handleVerify}
              disabled={busy || alreadyVerified}
              className="rounded-md bg-[var(--ink)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)] disabled:opacity-60"
            >
              {alreadyVerified ? "Verified" : busy ? "Verifying..." : "Verify resolution"}
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-red-700">{error}</p>}
        {success && <p className="mt-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-green-700">Thanks for confirming.</p>}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"

type StatusUpdateFormProps = {
  issueId: string
  currentStatus: string
  officialId: string | null
  verificationCount: number
}

const statuses = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" }
]

const inputClass =
  "rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-sm outline-none ring-[var(--teal)] focus:ring-2"

export default function StatusUpdateForm({
  issueId,
  currentStatus,
  officialId,
  verificationCount
}: StatusUpdateFormProps) {
  const [status, setStatus] = useState(currentStatus)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!officialId) {
      setError("Sign in to update status.")
      return
    }

    if (status === "closed" && verificationCount === 0) {
      setError("Cannot close issue until citizens verify the resolution.")
      return
    }

    setError(null)
    setSuccess(false)
    setBusy(true)

    try {
      const response = await fetch("/api/issues/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          status,
          note: note || null,
          changedBy: officialId
        })
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update status")
      }
      setSuccess(true)
      setNote("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="grid gap-2 text-sm">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Status</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
          {statuses.map((item) => {
            const isDisabled = item.value === "closed" && verificationCount === 0 && currentStatus !== "closed"
            return (
              <option key={item.value} value={item.value} disabled={isDisabled}>
                {item.label}
                {isDisabled ? " (requires citizen verification)" : ""}
              </option>
            )
          })}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Public note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          className={inputClass}
          placeholder="Share progress details for residents."
        />
      </label>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy}
        className="rounded-md bg-[var(--ink)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)] disabled:opacity-60"
      >
        {busy ? "Updating..." : "Post update"}
      </button>

      {error && <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-red-700">{error}</p>}
      {success && <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-green-700">Update posted.</p>}
    </div>
  )
}

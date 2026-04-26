"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import MapPicker from "@/app/citizen/report/MapPicker"
import { createIssueAction } from "@/app/actions/issues"

type DuplicateMatch = {
  issue_id: string
  title: string
  description: string
  similarity: number
  distance_m: number
  priority_score: number
  status: string
  upvote_count: number
  report_count: number
  viewer_has_upvoted?: boolean
  viewer_has_reported?: boolean
}

export default function ReportForm() {
  const router = useRouter()
  const { userId, isLoaded, isSignedIn } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState(3)
  const [address, setAddress] = useState("")
  const [coords, setCoords] = useState<{ lat: number | ""; lng: number | "" }>({ lat: "", lng: "" })

  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [duplicateCheckCompleted, setDuplicateCheckCompleted] = useState(false)
  const [upvotingId, setUpvotingId] = useState<string | null>(null)
  const [upvoteError, setUpvoteError] = useState<string | null>(null)
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [showSuccessPrompt, setShowSuccessPrompt] = useState(false)
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null)

  const queryText = useMemo(() => [title, description].filter(Boolean).join(" ").trim(), [title, description])

  // Reset duplicate check when relevant fields change
  const resetDuplicateCheck = () => {
    setDuplicateCheckCompleted(false)
    setDuplicates([])
    setCheckError(null)
  }

  // Auto-reset when form fields change
  useEffect(() => {
    if (duplicateCheckCompleted) {
      resetDuplicateCheck()
    }
  }, [title, description, coords.lat, coords.lng])

  const handleDuplicateCheck = async () => {
    setCheckError(null)
    if (!queryText || queryText.length < 3) {
      setCheckError("Add a title or description first.")
      return
    }
    if (coords.lat === "" || coords.lng === "") {
      setCheckError("Pin the location before checking duplicates.")
      return
    }

    setChecking(true)
    try {
      const params = new URLSearchParams({
        lat: String(coords.lat),
        lng: String(coords.lng),
        query: queryText,
        radius: "300",
        threshold: "0.2"
      })
      if (userId) params.set("viewerId", userId)
      const response = await fetch(`/api/issues/duplicates?${params.toString()}`)
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to check duplicates")
      }
      setDuplicates(payload.data ?? [])
      setDuplicateCheckCompleted(true)
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : "Unable to check duplicates")
    } finally {
      setChecking(false)
    }
  }

  const handleUpvote = async (issueId: string) => {
    if (!userId) {
      setUpvoteError("Sign in to upvote.")
      return
    }
    if (!issueId) {
      setUpvoteError("Invalid issue ID.")
      return
    }
    setUpvoteError(null)
    setUpvotingId(issueId)
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upvote", userId })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? "Unable to upvote")
      }
      const payload = (await response.json().catch(() => null)) as { created?: boolean } | null
      const created = payload?.created !== false
      setDuplicates((current) =>
        current.map((match) =>
          match.issue_id === issueId
            ? {
                ...match,
                upvote_count: created ? match.upvote_count + 1 : match.upvote_count,
                viewer_has_upvoted: true
              }
            : match
        )
      )
    } catch (error) {
      setUpvoteError(error instanceof Error ? error.message : "Unable to upvote")
    } finally {
      setUpvotingId(null)
    }
  }

  const handleReportDuplicate = async (issueId: string) => {
    if (!userId) {
      setReportError("Sign in to report.")
      return
    }
    if (!issueId) {
      setReportError("Invalid issue ID.")
      return
    }
    
    setReportError(null)
    setReportingId(issueId)
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "report",
          userId,
          note: "Reported as duplicate from report form."
        })
      })
      const payload = (await response.json().catch(() => null)) as { error?: string; created?: boolean } | null
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to report")
      }
      const created = payload?.created !== false
      setReportError(null)
      setConfirmingId(null)
      setDuplicates((current) =>
        current.map((match) =>
          match.issue_id === issueId
            ? {
                ...match,
                report_count: created ? match.report_count + 1 : match.report_count,
                viewer_has_reported: true
              }
            : match
        )
      )
      setTimeout(() => {
        setReportError(created ? "Successfully reported as duplicate!" : "You already reported this signal.")
        setTimeout(() => setReportError(null), 3000)
      }, 100)
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Unable to report")
    } finally {
      setReportingId(null)
    }
  }

  const handleMediaUpload = async (issueId: string) => {
    if (mediaFiles.length === 0) return
    if (!userId) {
      setUploadError("Sign in to upload media.")
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const uploaded: string[] = []
      for (const file of mediaFiles) {
        const formData = new FormData()
        formData.set("issueId", issueId)
        formData.set("file", file)
        formData.set("contentType", file.type)
        formData.set("userId", userId)

        const response = await fetch("/api/issues/media", { method: "POST", body: formData })
        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(payload?.error ?? "Upload failed")
        }
        if (payload?.data?.url) uploaded.push(payload.data.url)
      }
      setUploadedUrls(uploaded)
      setMediaFiles([])
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const fieldClass =
    "rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-sm outline-none ring-[var(--teal)] focus:ring-2"

  return (
    <div>
      <form
        action={async (formData) => {
          setSubmitError(null)
          setSubmitSuccess(null)
          if (!isLoaded) {
            setSubmitError("Loading user session. Please retry.")
            return
          }
          if (!isSignedIn || !userId) {
            setSubmitError("Sign in to submit a signal.")
            return
          }
          if (!duplicateCheckCompleted) {
            setSubmitError("Please check for duplicates before submitting.")
            return
          }
          if (duplicates.length > 0) {
            setSubmitError("Similar issues found. Please report as duplicate or modify your report.")
            return
          }
        try {
          const result = await createIssueAction(formData)
          if (!result.ok) {
            setSubmitError(
              result.error?.fieldErrors
                ? `Validation error: ${JSON.stringify(result.error.fieldErrors)}`
                : "Unable to submit. Please check required fields."
            )
            return
          }
          if (!result.data?.id) {
            setSubmitError("Submission succeeded but no issue id was returned.")
            return
          }
          await handleMediaUpload(result.data.id)
          setSubmittedIssueId(result.data.id)
          setShowSuccessPrompt(true)
          setSubmitSuccess("Signal submitted successfully.")
          return
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : "Submission failed.")
        }
      }}
        className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm"
      >
      <div className="border-b border-[var(--stone)] bg-[var(--sand)] px-4 py-3 sm:px-6">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Signal intake</p>
        <p className="mt-1 text-xs text-ink-soft">Complete all steps before submitting.</p>
      </div>
      <div className="space-y-6 p-6 sm:p-8">
      <input type="hidden" name="createdBy" value={userId ?? ""} />
      <div className="grid gap-6 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Title
          <input
            name="title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={fieldClass}
            placeholder="Open manhole near Central Market"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Severity (1-5)
          <input
            name="severity"
            type="number"
            min={1}
            max={5}
            value={severity}
            onChange={(event) => setSeverity(Number(event.target.value))}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm">
        Description
        <textarea
          name="description"
          required
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={fieldClass}
          placeholder="What is happening? Include landmarks, time, and impact."
        />
      </label>

      <MapPicker value={coords} onChange={setCoords} />

      <label className="grid gap-2 text-sm">
        Address (optional)
        <input
          name="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className={fieldClass}
          placeholder="Street, locality"
        />
      </label>

      <div className="border-t border-[var(--stone)] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Upload photos or videos</p>
            <p className="text-xs text-ink-soft">Attach proof to strengthen the signal.</p>
          </div>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(event) => setMediaFiles(Array.from(event.target.files ?? []))}
            className="text-xs"
          />
        </div>
        {mediaFiles.length > 0 && (
          <p className="mt-3 text-xs text-ink-soft">Selected {mediaFiles.length} file(s).</p>
        )}
        {uploading && <p className="mt-3 text-xs text-ink-soft">Uploading media...</p>}
        {uploadError && <p className="mt-3 text-xs uppercase tracking-[0.2em] text-red-700">{uploadError}</p>}
        {uploadedUrls.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Uploaded:</p>
            <ul className="space-y-1 text-xs text-ink-soft">
              {uploadedUrls.map((url) => (
                <li key={url} className="truncate">{url}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--stone)] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Check for duplicates *</p>
            <p className="text-xs text-ink-soft">Required: We look for similar reports within 300m using text similarity.</p>
            {duplicateCheckCompleted && duplicates.length === 0 && (
              <p className="mt-1 text-xs text-green-700">No duplicates found. You can proceed with submission.</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleDuplicateCheck}
            className={`rounded-md px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] ${
              duplicateCheckCompleted && duplicates.length === 0
                ? "border border-green-700/30 bg-green-50 text-green-900"
                : "border border-[var(--stone)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--sand)]"
            }`}
            disabled={checking}
          >
            {checking ? "Checking..." : (duplicateCheckCompleted && duplicates.length === 0 ? "Completed" : "Check")}
          </button>
        </div>
        {checkError && <p className="mt-3 text-xs uppercase tracking-[0.2em] text-red-700">{checkError}</p>}
        {upvoteError && <p className="mt-3 text-xs uppercase tracking-[0.2em] text-red-700">{upvoteError}</p>}
        {reportError && <p className="mt-3 text-xs uppercase tracking-[0.2em] text-red-700">{reportError}</p>}
        {duplicates.length > 0 ? (
          <div key="duplicates-container">
            <div className="mt-4 rounded-md border-2 border-red-300 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">
                {duplicates.length} similar issue{duplicates.length > 1 ? 's' : ''} found nearby
              </p>
              <p className="mt-1 text-xs text-red-700">
                Please report as duplicate or modify your report details to continue.
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {duplicates.map((match, index) => (
                <div key={`duplicate-${match.issue_id || index}-${index}`} className="rounded-md border border-[var(--stone)] bg-[var(--sand)]/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{match.title}</p>
                    <span className="text-xs font-semibold">{match.similarity.toFixed(2)}</span>
                  </div>
                  <p className="mt-2 text-xs text-ink-soft line-clamp-2">{match.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                    <span>{Math.round(match.distance_m)}m away</span>
                    <span>{match.upvote_count} upvotes</span>
                    <span>{match.report_count} reports</span>
                    <span className="rounded-full border border-[var(--stone)] px-3 py-1 uppercase tracking-[0.2em]">
                      {match.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpvote(match.issue_id)}
                        disabled={upvotingId === match.issue_id || match.viewer_has_upvoted}
                        className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)] disabled:opacity-50"
                      >
                        {upvotingId === match.issue_id
                          ? "Upvoting..."
                          : match.viewer_has_upvoted
                            ? "Upvoted"
                            : "Upvote this signal"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(match.issue_id)}
                        disabled={reportingId === match.issue_id || match.viewer_has_reported}
                        className="rounded-md bg-[var(--ink)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)] disabled:opacity-50"
                      >
                        {match.viewer_has_reported ? "Reported" : "Report as duplicate"}
                      </button>
                    </div>
                    {confirmingId === match.issue_id && !match.viewer_has_reported && (
                      <div className="rounded-md border border-[var(--stone)] bg-[var(--paper)] p-4 text-sm">
                        <p className="font-semibold">Confirm duplicate report?</p>
                        <p className="mt-2 text-xs text-ink-soft">
                          This will add your report to the existing signal instead of creating a new one.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleReportDuplicate(match.issue_id)}
                            disabled={reportingId === match.issue_id}
                            className="rounded-md bg-[var(--ink)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)]"
                          >
                            {reportingId === match.issue_id ? "Reporting..." : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !checking && <p className="mt-3 text-xs text-ink-soft">No nearby duplicates found.</p>
        )}
      </div>

      {submitError && <p className="text-xs uppercase tracking-[0.2em] text-red-700">{submitError}</p>}
      {submitSuccess && <p className="text-xs uppercase tracking-[0.2em] text-green-700">{submitSuccess}</p>}

        <div className="flex flex-wrap gap-3 border-t border-[var(--stone)] pt-6">
          <button
            type="submit"
            className={`rounded-md px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] ${
              duplicateCheckCompleted && duplicates.length === 0
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "cursor-not-allowed bg-[var(--stone)]/50 text-ink-soft"
            }`}
            disabled={!duplicateCheckCompleted || duplicates.length > 0}
          >
            {(() => {
              if (duplicateCheckCompleted && duplicates.length === 0) {
                return "Submit signal"
              } else if (duplicates.length > 0) {
                return "Duplicates found - cannot submit"
              } else {
                return "Check duplicates first"
              }
            })()}
          </button>
          <Link
            href="/citizen"
            className="inline-flex items-center justify-center rounded-md border border-[var(--stone)] bg-[var(--paper)] px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
          >
            Cancel
          </Link>
        </div>
      </div>
      </form>

      {showSuccessPrompt && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm">
            <div className="border-b border-[var(--stone)] bg-[var(--sand)] px-4 py-3">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Signal received</p>
            </div>
            <div className="space-y-4 p-6 sm:p-8">
              <h3 className="font-serif text-2xl font-semibold leading-tight">Your civic signal has been submitted.</h3>
              <p className="text-sm text-ink-soft">
                What would you like to do next? You can track this signal live or continue reporting.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => (submittedIssueId ? router.push(`/citizen/issues/${submittedIssueId}`) : null)}
                  className="rounded-md bg-[var(--ink)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)]"
                >
                  Track this signal
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/citizen")}
                  className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
                >
                  Go to dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessPrompt(false)}
                  className="rounded-md border border-[var(--stone)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft hover:bg-[var(--sand)]"
                >
                  Report another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

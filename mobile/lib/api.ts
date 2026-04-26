import { Platform } from "react-native"
import { API_BASE_URL } from "@/lib/config"

export type Issue = {
  id: string
  title: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority_score: number
  upvote_count: number
  report_count: number
  ward_id: string | null
  created_at?: string
  /** Present when loading with `viewerId` (Supabase auth uid). */
  viewer_has_upvoted?: boolean
  viewer_has_reported?: boolean
}

export type DuplicateMatch = {
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

const networkHint = (attemptedUrl: string) => {
  const usesLoopback = /localhost|127\.0\.0\.1/.test(attemptedUrl)
  const deviceNote =
    Platform.OS !== "web" && usesLoopback
      ? "\n\n- Start Next from repo root: pnpm dev\n- On a real phone, set mobile/.env EXPO_PUBLIC_API_BASE_URL to http://YOUR_LAN_IP:3000 (same Wi‑Fi as this device), then npx expo start -c"
      : "\n\nStart Next from repo root: pnpm dev"
  return `Could not reach:\n${attemptedUrl}${deviceNote}`
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch {
    throw new Error(networkHint(url))
  }
}

export type FetchIssuesParams = {
  limit?: number
  /** Omit closed issues when no explicit status is set (citizen active board). */
  excludeClosed?: boolean
  status?: Issue["status"]
  search?: string
  wardId?: string
}

function buildIssuesQueryString(params: FetchIssuesParams) {
  const sp = new URLSearchParams()
  if (params.limit !== undefined) sp.set("limit", String(params.limit))
  if (params.excludeClosed) sp.set("excludeClosed", "true")
  if (params.status) sp.set("status", params.status)
  if (params.search?.trim()) sp.set("search", params.search.trim())
  if (params.wardId) sp.set("wardId", params.wardId)
  return sp.toString()
}

export async function fetchIssues(params: FetchIssuesParams | number = {}) {
  const p: FetchIssuesParams = typeof params === "number" ? { limit: params } : params
  const qs = buildIssuesQueryString({ limit: 20, ...p })
  const response = await apiFetch(`${API_BASE_URL}/api/issues?${qs}`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load issues")
  }
  return (payload?.data ?? []) as Issue[]
}

export async function fetchIssueCountByStatus(status: Issue["status"]): Promise<number> {
  const response = await apiFetch(`${API_BASE_URL}/api/issues/count?status=${encodeURIComponent(status)}`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load issue count")
  }
  return Number(payload?.data?.count ?? 0)
}

export async function fetchIssueById(id: string, viewerId?: string | null): Promise<Issue> {
  const qs = viewerId?.trim() ? `?viewerId=${encodeURIComponent(viewerId.trim())}` : ""
  const response = await apiFetch(`${API_BASE_URL}/api/issues/${id}${qs}`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load issue")
  }
  return payload?.data
}

export async function upvoteIssue(issueId: string, userId: string): Promise<{ created: boolean }> {
  const response = await apiFetch(`${API_BASE_URL}/api/issues/${issueId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "upvote", userId })
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to upvote")
  }
  return { created: payload?.created !== false }
}

export async function reportIssueDuplicate(
  issueId: string,
  userId: string,
  note = "Reported as duplicate from mobile report flow."
): Promise<{ created: boolean }> {
  const response = await apiFetch(`${API_BASE_URL}/api/issues/${issueId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "report", userId, note })
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to report")
  }
  return { created: payload?.created !== false }
}

export type FetchDuplicatesParams = {
  lat: number
  lng: number
  query: string
  viewerId?: string
  radius?: number
  threshold?: number
}

function normalizeDuplicateRow(row: Record<string, unknown>): DuplicateMatch | null {
  const issue_id =
    typeof row.issue_id === "string"
      ? row.issue_id
      : typeof row.id === "string"
        ? row.id
        : null
  if (!issue_id) return null
  return {
    issue_id,
    title: typeof row.title === "string" ? row.title : "",
    description: typeof row.description === "string" ? row.description : "",
    similarity: typeof row.similarity === "number" ? row.similarity : 0,
    distance_m: typeof row.distance_m === "number" ? row.distance_m : 0,
    priority_score: typeof row.priority_score === "number" ? row.priority_score : 0,
    status: typeof row.status === "string" ? row.status : "open",
    upvote_count: typeof row.upvote_count === "number" ? row.upvote_count : 0,
    report_count: typeof row.report_count === "number" ? row.report_count : 0,
    viewer_has_upvoted: Boolean(row.viewer_has_upvoted),
    viewer_has_reported: Boolean(row.viewer_has_reported)
  }
}

export async function fetchDuplicateMatches(params: FetchDuplicatesParams): Promise<DuplicateMatch[]> {
  const sp = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    query: params.query.trim(),
    radius: String(params.radius ?? 300),
    threshold: String(params.threshold ?? 0.2)
  })
  if (params.viewerId?.trim()) sp.set("viewerId", params.viewerId.trim())
  const response = await apiFetch(`${API_BASE_URL}/api/issues/duplicates?${sp.toString()}`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to check duplicates")
  }
  const rows = Array.isArray(payload?.data) ? (payload.data as Record<string, unknown>[]) : []
  return rows.map(normalizeDuplicateRow).filter((m): m is DuplicateMatch => m !== null)
}

export async function createIssue(input: {
  title: string
  description: string
  severity: number
  lat: number
  lng: number
  createdBy: string
  address?: string
}) {
  const response = await apiFetch(`${API_BASE_URL}/api/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to submit signal")
  }
  return payload?.data as Issue
}

export async function fetchIssueVerificationCount(issueId: string): Promise<number> {
  const response = await apiFetch(`${API_BASE_URL}/api/issues/verifications?ids=${issueId}`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load verification count")
  }
  return Number(payload?.data?.[issueId] ?? 0)
}

export async function fetchUserVerificationStatus(issueId: string, userId: string): Promise<boolean> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/issues/${issueId}/verification?userId=${encodeURIComponent(userId)}`
  )
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load verification status")
  }
  return Boolean(payload?.data?.verified)
}

export async function verifyIssueResolution(issueId: string, userId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/api/issues/${issueId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to verify issue")
  }
}

type MediaUploadAsset = {
  uri: string
  fileName?: string | null
  mimeType?: string | null
  type?: string | null
}

const inferMimeType = (asset: MediaUploadAsset) => {
  if (asset.mimeType) return asset.mimeType
  if (asset.type === "video") return "video/mp4"
  return "image/jpeg"
}

const inferFileName = (asset: MediaUploadAsset, index: number) => {
  if (asset.fileName) return asset.fileName
  const ext = asset.type === "video" ? "mp4" : "jpg"
  return `upload-${Date.now()}-${index}.${ext}`
}

export async function uploadIssueMedia(input: {
  issueId: string
  userId: string
  assets: MediaUploadAsset[]
}): Promise<string[]> {
  const urls: string[] = []

  for (let index = 0; index < input.assets.length; index += 1) {
    const asset = input.assets[index]
    const formData = new FormData()
    formData.append("issueId", input.issueId)
    formData.append("userId", input.userId)
    formData.append("contentType", inferMimeType(asset))
    formData.append(
      "file",
      {
        uri: asset.uri,
        name: inferFileName(asset, index),
        type: inferMimeType(asset)
      } as unknown as Blob
    )

    const response = await apiFetch(`${API_BASE_URL}/api/issues/media`, {
      method: "POST",
      body: formData
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(payload?.error ?? "Failed to upload media")
    }
    if (payload?.data?.url) {
      urls.push(String(payload.data.url))
    }
  }

  return urls
}

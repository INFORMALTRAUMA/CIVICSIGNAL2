import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { toGeoPoint } from "@/lib/db/geo"
import type { GeoJSONPoint } from "@/lib/db/geo"
import type { IssueStatus, IssuePriority } from "@/lib/db/types"

export type IssueRecord = {
  id: string
  title: string
  description: string
  location: GeoJSONPoint
  address: string | null
  ward_id: string | null
  status: IssueStatus
  priority: IssuePriority
  severity: number
  priority_score: number
  upvote_count: number
  report_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export type IssueSummary = Pick<
  IssueRecord,
  | "id"
  | "title"
  | "description"
  | "ward_id"
  | "status"
  | "priority_score"
  | "upvote_count"
  | "report_count"
  | "updated_at"
> & {
  /** From issue_resolutions when joined (official queue). */
  verification_count?: number
}

export type IssueStatusHistory = {
  id: string
  issue_id: string
  status: IssueStatus
  note: string | null
  changed_by: string | null
  created_at: string
}

export type IssueResolution = {
  issue_id: string
  resolved_by: string
  resolved_at: string
  verification_count: number
  resolution_note: string | null
}

export type IssueMedia = {
  id: string
  issue_id: string
  storage_bucket: string
  storage_path: string
  media_type: string
  created_at: string
  public_url: string
}

export async function listIssues(params: {
  status?: IssueStatus
  wardId?: string
  search?: string
  limit?: number
  offset?: number
  /** If true and status is unset, exclude closed issues from results. */
  excludeClosed?: boolean
}) {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from("issues")
    .select("*")
    .order("priority_score", { ascending: false })

  if (params.status) {
    query = query.eq("status", params.status)
  } else if (params.excludeClosed) {
    query = query.neq("status", "closed")
  }
  if (params.wardId) query = query.eq("ward_id", params.wardId)
  if (params.search) query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  if (params.limit !== undefined) query = query.limit(params.limit)
  if (params.offset !== undefined) query = query.range(params.offset, params.offset + (params.limit ?? 20) - 1)

  const { data, error } = await query
  if (error) throw error
  return data as IssueRecord[]
}

export async function countIssuesByStatus(status: IssueStatus): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const { count, error } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .eq("status", status)
  if (error) throw error
  return count ?? 0
}

export async function listIssuesAdmin(params: {
  status?: IssueStatus
  wardId?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const supabase = createSupabaseAdminClient()
  let query = supabase
    .from("issues")
    .select("*")
    .order("priority_score", { ascending: false })

  if (params.status) query = query.eq("status", params.status)
  if (params.wardId) query = query.eq("ward_id", params.wardId)
  if (params.search) query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  if (params.limit !== undefined) query = query.limit(params.limit)
  if (params.offset !== undefined) query = query.range(params.offset, params.offset + (params.limit ?? 20) - 1)

  const { data, error } = await query
  if (error) throw error
  return data as IssueRecord[]
}

type IssueSummaryRow = {
  id: string
  title: string
  description: string
  ward_id: string | null
  status: IssueStatus
  priority_score: number
  upvote_count: number
  report_count: number
  updated_at: string
  issue_resolutions: { verification_count: number } | null
}

export async function listIssuesAdminSummary(params: {
  status?: IssueStatus
  wardId?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const supabase = createSupabaseAdminClient()
  let query = supabase
    .from("issues")
    .select(
      "id,title,description,ward_id,status,priority_score,upvote_count,report_count,updated_at,issue_resolutions(verification_count)"
    )
    .order("priority_score", { ascending: false })

  if (params.status) query = query.eq("status", params.status)
  if (params.wardId) query = query.eq("ward_id", params.wardId)
  if (params.search) query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  if (params.limit !== undefined) query = query.limit(params.limit)
  if (params.offset !== undefined) query = query.range(params.offset, params.offset + (params.limit ?? 20) - 1)

  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []) as IssueSummaryRow[]
  return rows.map((row) => {
    const { issue_resolutions: res, ...rest } = row
    return {
      ...rest,
      verification_count: res?.verification_count ?? 0
    } satisfies IssueSummary
  })
}

export async function listIssuesWithinRadius(params: {
  lat: number
  lng: number
  radius: number
  status?: IssueStatus
  wardId?: string
  search?: string
  limit?: number
  excludeClosed?: boolean
}) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("issues_within_radius", {
    lat: params.lat,
    lng: params.lng,
    radius_m: params.radius,
    status_filter: params.status ?? null,
    search_text: params.search ?? null,
    ward_filter: params.wardId ?? null
  })
  if (error) throw error
  let rows = (data ?? []) as IssueRecord[]
  if (params.excludeClosed && !params.status) {
    rows = rows.filter((issue) => issue.status !== "closed")
  }
  if (params.limit !== undefined) {
    rows = rows.slice(0, params.limit)
  }
  return rows
}

export async function getIssue(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("issues").select("*").eq("id", id).single()
  if (error) throw error
  return data as IssueRecord
}

export async function getIssueWithHistory(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data: issue, error: issueError } = await supabase.from("issues").select("*").eq("id", id).single()
  if (issueError) throw issueError

  const { data: history, error: historyError } = await supabase
    .from("issue_status_history")
    .select("*")
    .eq("issue_id", id)
    .order("created_at", { ascending: false })
  if (historyError) throw historyError

  const { data: media, error: mediaError } = await supabase
    .from("issue_media")
    .select("*")
    .eq("issue_id", id)
    .order("created_at", { ascending: false })
  if (mediaError) throw mediaError

  const { data: resolution, error: resolutionError } = await supabase
    .from("issue_resolutions")
    .select("*")
    .eq("issue_id", id)
    .maybeSingle()
  if (resolutionError) throw resolutionError

  const mediaWithUrls =
    media?.map((item) => ({
      ...item,
      public_url: supabase.storage.from(item.storage_bucket).getPublicUrl(item.storage_path).data.publicUrl
    })) ?? []

  return {
    issue: issue as IssueRecord,
    history: (history ?? []) as IssueStatusHistory[],
    media: mediaWithUrls as IssueMedia[],
    resolution: (resolution as IssueResolution) ?? null
  }
}

export async function getIssueWithHistoryAdmin(id: string) {
  const supabase = createSupabaseAdminClient()
  const [issueResult, historyResult, mediaResult, resolutionResult] = await Promise.all([
    supabase.from("issues").select("*").eq("id", id).single(),
    supabase.from("issue_status_history").select("*").eq("issue_id", id).order("created_at", { ascending: false }),
    supabase.from("issue_media").select("*").eq("issue_id", id).order("created_at", { ascending: false }),
    supabase.from("issue_resolutions").select("*").eq("issue_id", id).maybeSingle()
  ])

  if (issueResult.error) throw issueResult.error
  if (historyResult.error) throw historyResult.error
  if (mediaResult.error) throw mediaResult.error
  if (resolutionResult.error) throw resolutionResult.error

  const issue = issueResult.data
  const history = historyResult.data
  const media = mediaResult.data
  const resolution = resolutionResult.data

  const mediaWithUrls =
    media?.map((item) => ({
      ...item,
      public_url: supabase.storage.from(item.storage_bucket).getPublicUrl(item.storage_path).data.publicUrl
    })) ?? []

  return {
    issue: issue as IssueRecord,
    history: (history ?? []) as IssueStatusHistory[],
    media: mediaWithUrls as IssueMedia[],
    resolution: (resolution as IssueResolution) ?? null
  }
}

export async function addResolutionVerification(issueId: string, userId: string) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from("issue_verifications")
    .upsert({ issue_id: issueId, user_id: userId }, { onConflict: "issue_id,user_id", ignoreDuplicates: true })
  if (error) throw error
}

export async function createIssue(input: {
  title: string
  description: string
  lat: number
  lng: number
  address?: string | null
  wardId?: string | null
  severity?: number
  createdBy: string
}) {
  const supabase = createSupabaseAdminClient()
  const payload = {
    title: input.title,
    description: input.description,
    location: `SRID=4326;POINT(${input.lng} ${input.lat})`,
    address: input.address ?? null,
    ward_id: input.wardId ?? null,
    severity: input.severity ?? 3,
    created_by: input.createdBy
  }

  const { data, error } = await supabase.from("issues").insert(payload).select("*").single()
  if (error) throw error
  return data as IssueRecord
}

export async function updateIssue(
  id: string,
  changes: {
    title?: string
    description?: string
    status?: IssueStatus
    priority?: IssuePriority
    severity?: number
    address?: string | null
    wardId?: string | null
  }
) {
  const supabase = createSupabaseAdminClient()
  const payload = {
    title: changes.title,
    description: changes.description,
    status: changes.status,
    priority: changes.priority,
    severity: changes.severity,
    address: changes.address,
    ward_id: changes.wardId
  }

  const { data, error } = await supabase.from("issues").update(payload).eq("id", id).select("*").single()
  if (error) throw error
  return data as IssueRecord
}

/** Returns whether a new upvote row was inserted (false if this user already upvoted the issue). */
export async function addUpvote(issueId: string, userId: string): Promise<{ created: boolean }> {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from("issue_upvotes").insert({ issue_id: issueId, user_id: userId })
  if (!error) return { created: true }
  const msg = `${error.message ?? ""} ${error.details ?? ""}`
  if (error.code === "23505" || /duplicate key|unique constraint/i.test(msg)) return { created: false }
  throw error
}

export async function getUpvotedIssueIdsForUser(userId: string, issueIds: string[]): Promise<Set<string>> {
  if (issueIds.length === 0) return new Set()
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("issue_upvotes")
    .select("issue_id")
    .eq("user_id", userId)
    .in("issue_id", issueIds)
  if (error) throw error
  return new Set((data ?? []).map((r: { issue_id: string }) => r.issue_id))
}

export async function getReportedIssueIdsForUser(userId: string, issueIds: string[]): Promise<Set<string>> {
  if (issueIds.length === 0) return new Set()
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("issue_reports")
    .select("issue_id")
    .eq("reporter_id", userId)
    .in("issue_id", issueIds)
  if (error) throw error
  return new Set((data ?? []).map((r: { issue_id: string }) => r.issue_id))
}

/** Returns whether a new report row was inserted (false if this user already reported this issue). */
export async function addReport(issueId: string, userId: string, note?: string): Promise<{ created: boolean }> {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from("issue_reports")
    .insert({ issue_id: issueId, reporter_id: userId, note: note ?? null })
  if (!error) return { created: true }
  const msg = `${error.message ?? ""} ${error.details ?? ""}`
  if (error.code === "23505" || /duplicate key|unique constraint/i.test(msg)) return { created: false }
  throw error
}

export async function addStatusHistory(
  issueId: string,
  status: IssueStatus,
  note?: string | null,
  changedBy?: string | null
) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from("issue_status_history").insert({
    issue_id: issueId,
    status,
    note: note ?? null,
    changed_by: changedBy ?? null
  })
  if (error) throw error
}

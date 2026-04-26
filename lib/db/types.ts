export type IssueStatus = "open" | "in_progress" | "resolved" | "closed"
export type IssuePriority = "low" | "medium" | "high" | "critical"

export type GeoPoint = {
  lat: number
  lng: number
}

export type Issue = {
  id: string
  title: string
  description: string
  location: GeoPoint
  address?: string | null
  wardId?: string | null
  status: IssueStatus
  priority: IssuePriority
  priorityScore: number
  upvotes: number
  reports: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type IssueUpvote = {
  issueId: string
  userId: string
  createdAt: string
}

export type IssueResolution = {
  issueId: string
  resolvedBy: string
  resolvedAt: string
  verificationCount: number
}

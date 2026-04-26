import { z } from "zod"

export const issueStatusSchema = z.enum(["open", "in_progress", "resolved", "closed"])
export const issuePrioritySchema = z.enum(["low", "medium", "high", "critical"])

export const createIssueSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(2000),
  lat: z.number().finite(),
  lng: z.number().finite(),
  address: z.string().max(255).optional().nullable(),
  wardId: z.string().uuid().optional().nullable(),
  severity: z.number().int().min(1).max(5).optional(),
  createdBy: z.string().min(1)
})

export const updateIssueSchema = z.object({
  title: z.string().min(3).max(140).optional(),
  description: z.string().min(10).max(2000).optional(),
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  severity: z.number().int().min(1).max(5).optional(),
  address: z.string().max(255).optional().nullable(),
  wardId: z.string().uuid().optional().nullable()
})

export const statusHistorySchema = z.object({
  issueId: z.string().uuid(),
  status: issueStatusSchema,
  note: z.string().max(1000).optional().nullable(),
  changedBy: z.string().min(1).optional().nullable()
})

export const listIssuesQuerySchema = z.object({
  status: issueStatusSchema.optional(),
  wardId: z.string().uuid().optional(),
  search: z.string().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  lat: z.coerce.number().finite().optional(),
  lng: z.coerce.number().finite().optional(),
  radius: z.coerce.number().int().min(50).max(10000).optional(),
  /** When true and status is not set, omit closed issues (active dashboard feed). */
  excludeClosed: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1")
})

export const duplicateQuerySchema = z.object({
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
  query: z.string().min(3).max(240),
  radius: z.coerce.number().int().min(50).max(5000).optional(),
  threshold: z.coerce.number().min(0).max(1).optional(),
  /** Clerk user id — when set, each duplicate row includes viewer_has_upvoted */
  viewerId: z.string().min(1).optional()
})

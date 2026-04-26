"use server"

import { revalidatePath } from "next/cache"
import { createIssue, updateIssue, addUpvote, addReport } from "@/lib/db/issues"
import { createIssueSchema, updateIssueSchema } from "@/lib/validators/issues"

export async function createIssueAction(formData: FormData) {
  const payload = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    lat: Number(formData.get("lat")),
    lng: Number(formData.get("lng")),
    address: formData.get("address") ? String(formData.get("address")) : null,
    wardId: formData.get("wardId") ? String(formData.get("wardId")) : null,
    severity: formData.get("severity") ? Number(formData.get("severity")) : undefined,
    createdBy: String(formData.get("createdBy") ?? "")
  }

  const parsed = createIssueSchema.safeParse(payload)
  if (!parsed.success) {
    // Validation failed - error details returned to client
    return { ok: false, error: parsed.error.flatten() }
  }

  const issue = await createIssue(parsed.data)
  revalidatePath("/citizen")
  return { ok: true, data: issue }
}

export async function updateIssueAction(id: string, formData: FormData) {
  const payload = {
    title: formData.get("title") ? String(formData.get("title")) : undefined,
    description: formData.get("description") ? String(formData.get("description")) : undefined,
    status: formData.get("status") ? String(formData.get("status")) : undefined,
    priority: formData.get("priority") ? String(formData.get("priority")) : undefined,
    severity: formData.get("severity") ? Number(formData.get("severity")) : undefined,
    address: formData.get("address") ? String(formData.get("address")) : undefined,
    wardId: formData.get("wardId") ? String(formData.get("wardId")) : undefined
  }

  const parsed = updateIssueSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten() }
  }

  const issue = await updateIssue(id, parsed.data)
  revalidatePath("/citizen")
  return { ok: true, data: issue }
}

export async function upvoteIssueAction(issueId: string, userId: string) {
  await addUpvote(issueId, userId)
  revalidatePath("/citizen")
  revalidatePath(`/citizen/issues/${issueId}`)
}

export async function reportIssueAction(issueId: string, userId: string, note?: string) {
  await addReport(issueId, userId, note)
  revalidatePath("/citizen")
  revalidatePath(`/citizen/issues/${issueId}`)
}

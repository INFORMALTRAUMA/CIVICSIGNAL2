import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const formData = await request.formData()
  const issueId = (formData as any).get("issueId") as string | null
  const file = (formData as any).get("file") as File | null
  const contentType = (formData as any).get("contentType") as string | null
  const userId = (formData as any).get("userId") as string | null

  if (typeof issueId !== "string" || !(file instanceof File) || typeof userId !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const bucket = "issue-media"
  const fileExt = file.name.split(".").pop() || "bin"
  const path = `${issueId}/${crypto.randomUUID()}.${fileExt}`

  const supabase = createSupabaseAdminClient()
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: typeof contentType === "string" ? contentType : file.type })

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed", details: uploadError.message }, { status: 500 })
  }

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path)

  const { error: dbError } = await supabase.from("issue_media").insert({
    issue_id: issueId,
    storage_bucket: bucket,
    storage_path: path,
    media_type: file.type || "application/octet-stream",
    uploader_id: userId
  })

  if (dbError) {
    return NextResponse.json({ error: "Failed to save media record", details: dbError.message }, { status: 500 })
  }

  return NextResponse.json({
    data: {
      bucket,
      path,
      url: publicUrl.publicUrl
    }
  })
}

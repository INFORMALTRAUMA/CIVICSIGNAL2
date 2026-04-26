"use client"

import { useEffect, useMemo, useState } from "react"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export default function OfficialAuthActions({
  compact = false,
  showUserInitial = false
}: {
  compact?: boolean
  /** Collapsed rail: show account initial in a circle (industrial shell pattern) */
  showUserInitial?: boolean
}) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [email, setEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setEmail(data.user?.email ?? null)
    })
    return () => {
      active = false
    }
  }, [supabase])

  const handleSignOut = async () => {
    setBusy(true)
    await supabase.auth.signOut()
    router.replace("/official/login")
  }

  return (
    <div
      className={
        compact && showUserInitial
          ? "flex flex-col items-center gap-2.5"
          : compact
            ? "flex items-center justify-center"
            : "flex items-center gap-3"
      }
    >
      {showUserInitial && email && (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[0.7rem] font-bold uppercase text-[var(--paper)]"
          title={email}
        >
          {email.trim().charAt(0) || "?"}
        </div>
      )}
      {!compact && email && (
        <span className="max-w-[140px] truncate text-xs uppercase tracking-[0.2em] text-ink-soft">{email}</span>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={busy}
        className={
          compact
            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--stone)] bg-[var(--paper)] text-[var(--ink)] transition hover:bg-[var(--sand)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
            : "rounded-full border border-[var(--ink)] px-4 py-2 text-xs uppercase tracking-[0.2em]"
        }
        title={compact ? "Sign out" : undefined}
      >
        {busy ? (
          compact ? (
            "..."
          ) : (
            "Signing out..."
          )
        ) : compact ? (
          <LogOut size={14} />
        ) : (
          "Sign out"
        )}
      </button>
    </div>
  )
}

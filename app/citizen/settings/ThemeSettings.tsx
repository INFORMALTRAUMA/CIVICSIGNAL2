"use client"

import { useEffect, useState } from "react"
import { applyTheme, defaultTheme, isThemeId, themeEvent, themeOptions } from "@/lib/theme"

export default function ThemeSettings() {
  const [active, setActive] = useState(defaultTheme)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/user-settings", { cache: "no-store" })
      const payload = await response.json().catch(() => null)
      if (response.ok && isThemeId(payload?.data?.theme)) {
        setActive(payload.data.theme)
        applyTheme(payload.data.theme, true)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      if (isThemeId(detail)) {
        setActive(detail)
      }
    }
    window.addEventListener(themeEvent, handler)
    return () => window.removeEventListener(themeEvent, handler)
  }, [])

  const updateTheme = async (themeId: string) => {
    if (!isThemeId(themeId)) return
    setActive(themeId)
    setMessage(null)
    applyTheme(themeId, true)
    setSaving(true)
    try {
      const response = await fetch("/api/user-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeId })
      })
      if (!response.ok) {
        throw new Error("Unable to save")
      }
      setMessage("Theme saved to your profile.")
    } catch {
      setMessage("Theme saved locally, but sync failed.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm">
      <div className="border-b border-[var(--stone)] bg-[var(--sand)] px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Theme</h2>
            <p className="mt-1 text-sm text-ink-soft">Palette for your workspace.</p>
          </div>
          <span className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink-soft">
            Profile sync
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {themeOptions.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => updateTheme(theme.id)}
              className={`group rounded-md border px-4 py-4 text-left transition ${
                active === theme.id
                  ? "border-[var(--ink)] bg-[var(--sand)]/40 shadow-sm"
                  : "border-[var(--stone)] bg-[var(--paper)] hover:border-[var(--ink)]/25"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{theme.label}</p>
                  <p className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink-soft">{theme.hint}</p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] ${
                    active === theme.id ? "bg-[var(--ink)] text-[var(--paper)]" : "border border-[var(--stone)] text-ink-soft"
                  }`}
                >
                  {active === theme.id ? "Active" : "Select"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <span className="h-5 rounded-sm" style={{ backgroundColor: theme.palette.ink }} />
                <span className="h-5 rounded-sm" style={{ backgroundColor: theme.palette.teal }} />
                <span className="h-5 rounded-sm" style={{ backgroundColor: theme.palette.sun }} />
                <span className="h-5 rounded-sm" style={{ backgroundColor: theme.palette.coral }} />
              </div>
            </button>
          ))}
        </div>

        {message && <p className="mt-4 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">{message}</p>}
        {saving && <p className="mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Saving…</p>}
      </div>
    </div>
  )
}

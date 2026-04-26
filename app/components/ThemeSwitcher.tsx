"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { applyTheme, defaultTheme, isThemeId, themeEvent, themeOptions, themeStorageKey } from "@/lib/theme"

export default function ThemeSwitcher({ placement = "fixed" }: { placement?: "fixed" | "inline" }) {
  const [active, setActive] = useState(defaultTheme)
  const [hydrated, setHydrated] = useState(false)
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(themeStorageKey) : null
    const next = isThemeId(stored) ? stored : defaultTheme
    setActive(next)
    applyTheme(next, Boolean(stored))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || !isLoaded || !isSignedIn) return
    const load = async () => {
      const response = await fetch("/api/user-settings", { cache: "no-store" })
      const payload = await response.json().catch(() => null)
      if (!response.ok) return
      const theme = payload?.data?.theme
      if (isThemeId(theme) && theme !== active) {
        setActive(theme)
        applyTheme(theme, true)
      }
    }
    load()
  }, [hydrated, isLoaded, isSignedIn, active])

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

  const persistTheme = async (themeId: string) => {
    if (!isLoaded || !isSignedIn) return
    await fetch("/api/user-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: themeId })
    }).catch(() => null)
  }

  return (
    <div className={placement === "fixed" ? "fixed bottom-4 right-4 z-50" : "relative"}>
      <div className="flex items-center gap-2 rounded-md border border-[var(--stone)] bg-[var(--paper)] px-2 py-2 shadow-sm">
        <span className="hidden text-[0.6rem] uppercase tracking-[0.35em] text-ink-soft sm:inline">Theme</span>
        <div className="flex items-center gap-1">
          {themeOptions.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setActive(theme.id)
                applyTheme(theme.id, true)
                persistTheme(theme.id)
              }}
              aria-pressed={active === theme.id}
              type="button"
              className={`rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] transition ${
                active === theme.id
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "border border-[var(--stone)] text-ink-soft"
              }`}
            >
              <span className="hidden sm:inline">{theme.label}</span>
              <span className="sm:hidden">{theme.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

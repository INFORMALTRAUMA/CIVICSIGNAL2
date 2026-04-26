"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type AuthMode = "signin" | "signup"

export default function OfficialLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const redirectParam = searchParams.get("redirect") || searchParams.get("redirect_url") || "/official"
  const redirectPath = useMemo(() => {
    if (!redirectParam) return "/official"
    if (typeof window === "undefined") return redirectParam
    try {
      if (redirectParam.startsWith("http")) {
        const url = new URL(redirectParam)
        if (url.origin === window.location.origin) {
          return `${url.pathname}${url.search}${url.hash}` || "/official"
        }
      }
    } catch {
      // ignore invalid redirect param
    }
    return redirectParam
  }, [redirectParam])

  const [mode, setMode] = useState<AuthMode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace(redirectPath)
      }
    }
    check()
  }, [supabase, router, redirectPath])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user && !data.session) {
          setNotice("Check your email to confirm the account, then sign in.")
          setMode("signin")
          return
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      router.replace(redirectPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--sand)] text-[var(--ink)] px-4 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute -top-24 right-[-10%] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(30,122,117,0.35),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-25%] left-[-10%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(240,198,106,0.45),transparent_70%)] blur-3xl" />

      <div className="relative w-full max-w-md overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm">
        <div className="border-b border-[var(--stone)] bg-[var(--sand)] px-4 py-3">
          <div className="inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-[var(--teal)]" />
            Official access
          </div>
        </div>
        <div className="p-6">
        <h1 className="text-2xl font-semibold">Command login</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {mode === "signin"
            ? "Sign in with your official credentials."
            : "Create an official account for this dashboard."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="grid gap-2 text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-sm outline-none ring-[var(--teal)] focus:ring-2"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-sm outline-none ring-[var(--teal)] focus:ring-2"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-[var(--ink)] px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)] disabled:opacity-60"
          >
            {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {notice && <p className="mt-4 text-xs uppercase tracking-[0.2em] text-green-700">{notice}</p>}
        {error && <p className="mt-4 text-xs uppercase tracking-[0.2em] text-red-700">{error}</p>}

        <div className="mt-6 text-xs text-ink-soft">
          {mode === "signin" ? (
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="underline underline-offset-4"
            >
              Need an official account? Create one
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="underline underline-offset-4"
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
        </div>
      </div>
    </main>
  )
}

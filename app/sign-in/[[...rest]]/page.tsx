"use client"

import { SignIn, useAuth } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"

export default function SignInPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const redirectUrl = useMemo(() => searchParams.get("redirect_url") || "/citizen", [searchParams])
  const redirectPath = useMemo(() => {
    if (!redirectUrl) return "/citizen"
    try {
      if (redirectUrl.startsWith("http")) {
        const url = new URL(redirectUrl)
        if (url.origin === window.location.origin) {
          return `${url.pathname}${url.search}${url.hash}` || "/citizen"
        }
      }
    } catch {
      // fall through to raw redirectUrl
    }
    return redirectUrl
  }, [redirectUrl])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    router.replace(redirectPath)
  }, [isLoaded, isSignedIn, redirectPath, router])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--sand)] text-[var(--ink)] px-4 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-70" />
      <div className="pointer-events-none absolute -top-24 right-[-12%] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(228,95,90,0.35),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-25%] left-[-10%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(30,122,117,0.35),transparent_70%)] blur-3xl" />

      <div className="relative w-full max-w-md overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] shadow-sm">
        <div className="border-b border-[var(--stone)] bg-[var(--sand)] px-4 py-3">
          <div className="inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-[var(--coral)]" />
            Citizen access
          </div>
        </div>
        <div className="p-6">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">Access Civic Signal with your account.</p>
        <div className="mt-6">
          <SignIn routing="hash" forceRedirectUrl={redirectPath} fallbackRedirectUrl="/citizen" />
        </div>
        </div>
      </div>
    </main>
  )
}

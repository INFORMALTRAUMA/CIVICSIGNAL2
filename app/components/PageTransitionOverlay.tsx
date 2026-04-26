"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

export default function PageTransitionOverlay() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const timerRef = useRef<number | null>(null)
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    const lastPath = lastPathRef.current
    lastPathRef.current = pathname

    if (
      (lastPath === "/" && (pathname.startsWith("/citizen") || pathname.startsWith("/official"))) ||
      ((lastPath?.startsWith("/citizen") || lastPath?.startsWith("/official")) && pathname === "/")
    ) {
      setActive(true)
      if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setActive(false), 3000)
    }

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [pathname])

  if (!active) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(30,122,117,0.12),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(240,198,106,0.2),transparent_55%),radial-gradient(circle_at_50%_80%,rgba(228,95,90,0.15),transparent_55%),var(--sand)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[var(--sand)] opacity-0 animate-fade-up" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(30,122,117,0.55),rgba(240,198,106,0.75),rgba(228,95,90,0.65))] opacity-60 animate-wipe" />
      <div className="absolute inset-0 bg-white/70 mix-blend-soft-light animate-flash" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.7),transparent_55%)] animate-iris" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0 animate-fade-up" />

      <div className="absolute -top-24 right-[-10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(30,122,117,0.35),transparent_70%)] blur-3xl animate-orbit" />
      <div className="absolute bottom-[-25%] left-[-12%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(240,198,106,0.4),transparent_70%)] blur-3xl animate-orbit" style={{ animationDuration: "12s" }} />
      <div className="absolute inset-y-0 left-[-20%] w-[60%] bg-[linear-gradient(90deg,rgba(30,122,117,0.2),transparent)] opacity-70 blur-2xl animate-horizon-pan" />

      <div className="relative">
        <div className="absolute -inset-20 rounded-full border border-[var(--stone)] opacity-30 animate-orbit" style={{ animationDuration: "14s" }} />
        <div className="absolute -inset-10 rounded-full border border-[var(--stone)] opacity-40 animate-orbit" style={{ animationDuration: "9s" }} />
        <div className="absolute -inset-16 rounded-full border border-[var(--stone)] opacity-20" />

        <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-[var(--stone)] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.65),rgba(255,255,255,0.2))] shadow-[var(--shadow-deep)] animate-zoom-bloom">
          <div className="absolute inset-0 rounded-full border border-[var(--stone)] animate-orbit">
            <span className="absolute left-1/2 top-0 -translate-x-1/2 h-3 w-3 rounded-full bg-[var(--coral)] shadow-[0_0_12px_rgba(228,95,90,0.65)]" />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[var(--teal)] shadow-[0_0_12px_rgba(30,122,117,0.55)]" />
          </div>
          <div className="absolute inset-6 rounded-full border border-[var(--stone)] opacity-70 animate-orbit" style={{ animationDuration: "6s" }} />

          <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden">
            <div className="h-full bg-[linear-gradient(90deg,transparent,var(--coral),transparent)] animate-sweep" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(30,122,117,0.2),transparent_70%)] animate-pulse" />
          </div>

          <div className="text-center">
            <p className="text-xs font-condensed text-ink-soft">Transitioning</p>
            <h1 className="mt-2 font-display text-2xl">Civic Signal</h1>
            <p className="mt-3 text-xs text-ink-soft">Synchronizing live signals</p>
          </div>
        </div>
      </div>
    </div>
  )
}

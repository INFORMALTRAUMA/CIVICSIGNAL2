"use client"

import { useState } from "react"

export default function HomeIntroOverlay() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[var(--sand)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,122,117,0.15),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(240,198,106,0.2),transparent_55%),radial-gradient(circle_at_50%_80%,rgba(228,95,90,0.18),transparent_55%)]" />
      <div className="absolute inset-y-0 left-[-25%] w-[60%] bg-[linear-gradient(120deg,rgba(240,198,106,0.55),transparent)] opacity-90 blur-2xl animate-stage-sweep" />
      <div className="absolute inset-y-0 left-0 w-[55%] bg-[var(--sand)] animate-curtain-left" />
      <div className="absolute inset-y-0 right-0 w-[55%] bg-[var(--sand)] animate-curtain-right" />

      <div className="relative text-center">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div
            className="h-[520px] w-[520px] rounded-full border border-[var(--stone)] opacity-30 animate-orbit"
            style={{ animationDuration: "14s" }}
          />
        </div>
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div
            className="h-[360px] w-[360px] rounded-full border border-[var(--stone)] opacity-40 animate-orbit"
            style={{ animationDuration: "9s" }}
          />
        </div>
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[240px] w-[240px] rounded-full border border-[var(--stone)] opacity-20" />
        </div>

        <div className="relative rounded-md border border-[var(--stone)] bg-[var(--paper)]/95 px-10 py-12 shadow-sm animate-intro-burst sm:px-12 sm:py-14">
          <p className="text-xs font-condensed text-ink-soft">Welcome to</p>
          <h1 className="mt-4 font-display text-7xl tracking-tight md:text-9xl animate-text-shock animate-micro-rumble">
            Civic Signal
          </h1>
          <p className="mt-4 text-sm text-ink-soft">Your city, clearly ranked</p>
          <div className="mx-auto mt-6 h-1.5 w-36 rounded-full bg-[linear-gradient(90deg,var(--teal),var(--sun),var(--coral))]" />
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="pointer-events-auto mt-8 rounded-md bg-[var(--ink)] px-5 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)]"
          >
            Click to continue
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center">
        <p className="text-xs font-condensed text-ink-soft">Civic intelligence, amplified</p>
      </div>
    </div>
  )
}

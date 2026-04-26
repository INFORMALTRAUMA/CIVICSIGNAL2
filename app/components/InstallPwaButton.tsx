"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export default function InstallPwaButton({
  className = "",
  variant = "default"
}: {
  className?: string
  /** Narrow sidebar: icon-only control that fits a fixed rail width */
  variant?: "default" | "rail"
}) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsInstalled(standalone)

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setInstallEvent(null)
      setShowIosHint(false)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (isInstalled) return

    if (installEvent) {
      await installEvent.prompt()
      const result = await installEvent.userChoice
      if (result.outcome === "accepted") {
        setIsInstalled(true)
      }
      setInstallEvent(null)
      return
    }

    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    if (isIOS) {
      setShowIosHint(true)
    }
  }

  if (isInstalled) return null

  if (variant === "rail") {
    return (
      <div className="relative flex justify-center">
        <button
          type="button"
          onClick={handleInstall}
          title="Install app"
          aria-label="Install app"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] transition hover:bg-[var(--sand)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] ${className}`.trim()}
        >
          <Download size={18} strokeWidth={2} aria-hidden />
        </button>
        {showIosHint && (
          <div className="absolute left-[calc(100%+0.5rem)] top-1/2 z-20 w-64 -translate-y-1/2 rounded-lg border border-[var(--stone)] bg-[var(--paper)] p-3 text-xs text-ink-soft shadow-lg">
            On iPhone/iPad: tap Share, then Add to Home Screen.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleInstall}
        className={`rounded-full border border-[var(--ink)] px-4 py-2 text-xs uppercase tracking-[0.2em] ${className}`.trim()}
      >
        Install app
      </button>
      {showIosHint && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-72 rounded-md border border-[var(--stone)] bg-[var(--paper)] p-3 text-xs text-ink-soft shadow-sm">
          On iPhone/iPad: tap Share, then choose Add to Home Screen.
        </div>
      )}
    </div>
  )
}

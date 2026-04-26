"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, Globe2, Home, LayoutDashboard } from "lucide-react"
import OfficialAuthActions from "@/app/official/OfficialAuthActions"
import ThemeSwitcher from "@/app/components/ThemeSwitcher"
import InstallPwaButton from "@/app/components/InstallPwaButton"

const navItems = [
  { href: "/official", label: "Command", icon: LayoutDashboard },
  { href: "/citizen", label: "Public board", icon: Globe2 },
  { href: "/", label: "Site home", icon: Home }
]

const storageKey = "civic-sidebar-collapsed"

function isNavActive(href: string, pathname: string) {
  if (href === "/official") return pathname === "/official" || pathname.startsWith("/official/")
  if (href === "/citizen") return pathname.startsWith("/citizen")
  return pathname === href
}

export default function OfficialNav() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null
    setCollapsed(stored === "true")
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") return
    const width = collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-expanded-width)"
    document.documentElement.style.setProperty("--sidebar-width", width)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, String(collapsed))
    }
  }, [collapsed])

  const navLinkClass = (href: string, collapsedOnlyIcon: boolean) => {
    const active = isNavActive(href, pathname)
    if (collapsedOnlyIcon) {
      return `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
        active
          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
          : "border-transparent text-ink-soft hover:border-[var(--stone)] hover:bg-[var(--surface-muted)]"
      }`
    }
    return `group flex items-center gap-3 rounded-md border px-3 py-3 text-sm font-semibold transition ${
      active
        ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] shadow-[var(--shadow-soft)]"
        : "border-transparent text-ink-soft hover:border-[var(--stone)] hover:bg-[var(--surface-muted)]"
    }`
  }

  return (
    <>
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col lg:border-r lg:border-[var(--stone)] lg:bg-[color-mix(in_oklch,var(--sand)_35%,var(--paper)_65%)]"
        style={{ width: "var(--sidebar-width)" }}
      >
        {collapsed ? (
          <div className="flex h-full min-h-0 flex-col items-center px-2 py-5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--teal)]" aria-hidden />

            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="mt-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--stone)] bg-[var(--paper)] text-[var(--ink)] shadow-sm transition hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={16} strokeWidth={2.5} aria-hidden />
            </button>

            <p
              className="mt-5 select-none text-[0.62rem] font-bold uppercase tracking-[0.28em] text-ink-soft"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              Official
            </p>

            <nav className="mt-6 flex w-full flex-col items-center gap-2.5" aria-label="Official navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(item.href, true)}
                  title={item.label}
                >
                  <item.icon size={18} strokeWidth={isNavActive(item.href, pathname) ? 2.25 : 2} />
                  <span className="sr-only">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="min-h-4 flex-1" aria-hidden />

            <div className="flex w-full flex-col items-center gap-3 border-t border-[var(--stone)]/70 pt-4">
              <InstallPwaButton variant="rail" />
              <OfficialAuthActions compact showUserInitial />
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col px-4 py-6">
            <div className="flex items-center gap-3 text-lg font-semibold">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--teal)]" />
              Civic Signal
            </div>

            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="mt-6 flex w-fit items-center justify-center rounded-full border border-[var(--stone)] bg-[var(--paper)] p-2 text-ink-soft shadow-sm transition hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} strokeWidth={2.5} aria-hidden />
            </button>

            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ink-soft">Official workspace</p>

            <nav className="mt-6 flex flex-col gap-2" aria-label="Official navigation">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={navLinkClass(item.href, false)} title={item.label}>
                  <item.icon
                    size={18}
                    className={isNavActive(item.href, pathname) ? "text-[var(--paper)]" : "text-ink-soft"}
                  />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-6 rounded-md border border-[var(--stone)] bg-[var(--surface-muted)] p-4">
              <InstallPwaButton className="w-full px-4 py-2 text-[0.62rem]" />
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-ink-soft">Signed in</p>
              <div className="mt-2">
                <OfficialAuthActions />
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="hidden lg:fixed lg:bottom-6 lg:right-6 lg:z-40 lg:block">
        <ThemeSwitcher placement="inline" />
      </div>

      <div className="sticky top-0 z-40 border-b border-[var(--stone)] bg-[var(--paper)] backdrop-blur lg:hidden">
        <div className="page-shell-wide flex items-center justify-between py-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--teal)]" />
            Civic Signal
          </div>
          <div className="flex items-center gap-2">
            <InstallPwaButton />
            <ThemeSwitcher placement="inline" />
            <OfficialAuthActions />
          </div>
        </div>
        <div className="page-shell-wide pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                  isNavActive(item.href, pathname)
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                    : "border-[var(--stone)] bg-[var(--surface-muted)] text-ink-soft"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

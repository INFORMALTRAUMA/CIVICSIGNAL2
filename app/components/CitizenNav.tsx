"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, FilePlus2, Home, LayoutDashboard, LogOut, SlidersHorizontal } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton, useUser } from "@clerk/nextjs"
import InstallPwaButton from "@/app/components/InstallPwaButton"
import ThemeSwitcher from "@/app/components/ThemeSwitcher"

const navItems = [
  { href: "/citizen", label: "Dashboard", icon: LayoutDashboard },
  { href: "/citizen/report", label: "Report", icon: FilePlus2 },
  { href: "/citizen/settings", label: "Settings", icon: SlidersHorizontal },
  { href: "/", label: "Site home", icon: Home }
]

/** Separate from official nav so rail width prefs do not fight across areas. */
const storageKey = "civic-citizen-nav-collapsed"

function isNavActive(href: string, pathname: string) {
  if (href === "/citizen") return pathname === "/citizen" || pathname.startsWith("/citizen/")
  return pathname === href
}

export default function CitizenNav() {
  const { user } = useUser()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const displayName =
    user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || "Citizen"
  const initial =
    (user?.firstName?.trim().charAt(0) ||
      user?.username?.trim().charAt(0) ||
      user?.primaryEmailAddress?.emailAddress?.trim().charAt(0) ||
      "?").toUpperCase()

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
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--coral)]" aria-hidden />

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
              Citizen
            </p>

            <nav className="mt-6 flex w-full flex-col items-center gap-2.5" aria-label="Citizen navigation">
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
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-bold text-[var(--paper)]"
                    title="Sign in"
                  >
                    →
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[0.7rem] font-bold uppercase text-[var(--paper)]"
                  title={displayName}
                >
                  {initial}
                </div>
                <SignOutButton signOutOptions={{ redirectUrl: "/citizen" }}>
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--stone)] bg-[var(--paper)] text-[var(--ink)] transition hover:bg-[var(--sand)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
                    title="Log out"
                  >
                    <LogOut size={14} aria-hidden />
                  </button>
                </SignOutButton>
              </SignedIn>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col px-4 py-6">
            <div className="flex items-center gap-3 text-lg font-semibold">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--coral)]" />
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

            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ink-soft">Citizen workspace</p>

            <nav className="mt-6 flex flex-col gap-2" aria-label="Citizen navigation">
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
              <SignedOut>
                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-ink-soft">Citizen access</p>
                <SignInButton mode="modal">
                  <button className="mt-4 w-full rounded-full bg-[var(--ink)] px-4 py-2 text-xs uppercase tracking-[0.25em] text-[var(--paper)]">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-ink-soft">Signed in</p>
                <div className="mt-3 flex items-center gap-3">
                  <UserButton afterSignOutUrl="/citizen" />
                  <span className="text-sm font-semibold">{displayName}</span>
                </div>
                <SignOutButton signOutOptions={{ redirectUrl: "/citizen" }}>
                  <button className="mt-4 w-full rounded-full border border-[var(--ink)] px-4 py-2 text-xs uppercase tracking-[0.25em]">
                    Log out
                  </button>
                </SignOutButton>
              </SignedIn>
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
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--coral)]" />
            Civic Signal
          </div>
          <div className="flex items-center gap-2">
            <InstallPwaButton />
            <ThemeSwitcher placement="inline" />
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full bg-[var(--ink)] px-3 py-2 text-xs uppercase tracking-[0.25em] text-[var(--paper)]">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/citizen" />
            </SignedIn>
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

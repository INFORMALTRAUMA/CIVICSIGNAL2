import Link from "next/link"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import ThemeSettings from "@/app/citizen/settings/ThemeSettings"

export default function CitizenSettingsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--sand)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none absolute -top-24 right-[-10%] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(30,122,117,0.35),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-12%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(240,198,106,0.4),transparent_70%)] blur-3xl" />

      <header className="relative page-shell-narrow border-b border-[var(--stone)] pb-6 pt-8 lg:pt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink-soft">User settings</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">Personalize your signal view</h1>
            <p className="mt-1 text-sm text-ink-soft">Theme and display preferences for your citizen workspace.</p>
          </div>
          <Link
            href="/citizen"
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-[var(--stone)] bg-[var(--paper)] px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <section className="relative page-shell-narrow pb-20 pt-6">
        <SignedOut>
          <div className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold">Sign in to update your settings</h2>
            <p className="mt-3 text-sm text-ink-soft">
              Your theme preferences sync with your account so every device stays aligned.
            </p>
            <div className="mt-6">
              <SignInButton mode="modal">
                <button className="rounded-md bg-[var(--ink)] px-5 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)]">
                  Continue
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <ThemeSettings />
        </SignedIn>
      </section>
    </main>
  )
}

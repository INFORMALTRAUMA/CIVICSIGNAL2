import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { countIssuesByStatus, listIssues } from "@/lib/db/issues"
import DashboardClient from "@/app/citizen/DashboardClient"

export default async function CitizenDashboard() {
  const [issues, closedCount] = await Promise.all([
    listIssues({ limit: 100, excludeClosed: true }),
    countIssuesByStatus("closed")
  ])
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--sand)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-70" />
      <div className="pointer-events-none absolute -top-24 right-[-8%] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(30,122,117,0.3),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(240,198,106,0.4),transparent_70%)] blur-3xl" />

      <header className="relative page-shell-wide border-b border-[var(--stone)] pb-6 pt-8 lg:pt-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink-soft">
              Citizen workspace · Signal board
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">Neighborhood Signal Board</h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-soft">
              Live KPIs, workflow tabs, and a tabular roster. Ward context and shortcuts stay in the right-hand panel.
            </p>
          </div>
        </div>
      </header>

      <SignedOut>
        <section className="page-shell-narrow pb-20 pt-2">
          <div className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] p-8 shadow-sm">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Access</p>
            <h2 className="mt-2 text-xl font-semibold">Sign in to view your local signal feed</h2>
            <p className="mt-3 text-sm text-ink-soft">
              We keep civic reports tied to real communities and verified residents. Sign in to report, upvote, and
              track issues in your ward.
            </p>
            <div className="mt-6">
              <SignInButton mode="modal">
                <button className="rounded-md bg-[var(--ink)] px-5 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)]">
                  Continue
                </button>
              </SignInButton>
            </div>
          </div>
        </section>
      </SignedOut>

      <SignedIn>
        <DashboardClient initialIssues={issues} closedCount={closedCount} />
      </SignedIn>
    </main>
  )
}

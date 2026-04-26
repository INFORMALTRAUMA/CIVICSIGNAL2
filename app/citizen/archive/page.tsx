import Link from "next/link"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { listIssues } from "@/lib/db/issues"
import ArchiveClient from "@/app/citizen/archive/ArchiveClient"

export default async function ClosedArchivePage() {
  const closedIssues = await listIssues({ status: "closed", limit: 50 })

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--sand)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-70" />
      <div className="pointer-events-none absolute -top-24 right-[-8%] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(30,122,117,0.2),transparent_70%)] blur-3xl" />

      <SignedOut>
        <section className="page-shell-narrow py-10 pb-20">
          <div className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] p-8 shadow-sm">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Access</p>
            <h2 className="mt-2 text-xl font-semibold">Sign in to view closed signals</h2>
            <p className="mt-3 text-sm text-ink-soft">The closed archive is available to signed-in residents.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <SignInButton mode="modal">
                <button className="rounded-md bg-[var(--ink)] px-5 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--paper)]">
                  Continue
                </button>
              </SignInButton>
              <Link
                href="/citizen"
                className="inline-flex items-center justify-center rounded-md border border-[var(--stone)] bg-[var(--paper)] px-5 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
              >
                Citizen home
              </Link>
            </div>
          </div>
        </section>
      </SignedOut>

      <SignedIn>
        <ArchiveClient initialIssues={closedIssues} />
      </SignedIn>
    </main>
  )
}

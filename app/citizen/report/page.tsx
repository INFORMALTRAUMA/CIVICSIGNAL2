import Link from "next/link"
import ReportForm from "@/app/citizen/report/ReportForm"

export default function ReportIssuePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--sand)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none absolute -top-28 right-[-12%] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(240,198,106,0.5),transparent_70%)] blur-3xl" />
      <header className="relative page-shell-narrow border-b border-[var(--stone)] pb-6 pt-8 lg:pt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink-soft">New signal · Intake</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">Report a civic issue</h1>
            <p className="mt-1 text-sm text-ink-soft">Pin the location, describe the issue, attach evidence, and clear duplicate check.</p>
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
        <ReportForm />
      </section>
    </main>
  )
}

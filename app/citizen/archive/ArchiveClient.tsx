"use client"

import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import IssueFeed from "@/app/citizen/IssueFeed"
import type { IssueRecord } from "@/lib/db/issues"

export default function ArchiveClient({ initialIssues }: { initialIssues: IssueRecord[] }) {
  const { userId } = useAuth()

  return (
    <section className="relative page-shell-wide pb-20 pt-6 lg:pt-8">
      <header className="border-b border-[var(--stone)] pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink-soft">Archive</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">Closed signals</h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-soft">
              Requests marked closed are kept here so your main board stays focused on active work.
            </p>
          </div>
          <Link
            href="/citizen"
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-[var(--stone)] bg-[var(--paper)] px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
          >
            Back to board
          </Link>
        </div>
      </header>

      <div className="mt-6">
        <IssueFeed
          initialIssues={initialIssues}
          userId={userId ?? null}
          lockedStatus="closed"
          title="Closed roster"
          subtitle="Historical civic signals · read-only queue"
          presentation="table"
        />
      </div>
    </section>
  )
}

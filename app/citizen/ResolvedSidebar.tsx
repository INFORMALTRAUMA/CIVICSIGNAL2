"use client"

import Link from "next/link"
import type { IssueRecord } from "@/lib/db/issues"

export default function ResolvedSidebar({
  issues,
  embedded = false
}: {
  issues: IssueRecord[]
  /** Strip outer card; use inside ops context panel. */
  embedded?: boolean
}) {
  const resolved = issues.filter((issue) => issue.status === "resolved").slice(0, 5)

  const titleClass = embedded
    ? "text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
    : "text-base font-semibold"

  const inner = (
    <>
      <h3 className={titleClass}>Recently resolved</h3>
      {resolved.length === 0 ? (
        <p className={embedded ? "mt-2 text-xs text-ink-soft" : "mt-3 text-sm text-ink-soft"}>
          No resolved signals in this view.
        </p>
      ) : (
        <div className={embedded ? "mt-2 space-y-2" : "mt-4 space-y-3"}>
          {resolved.map((issue) => (
            <Link
              key={issue.id}
              href={`/citizen/issues/${issue.id}`}
              className={
                embedded
                  ? "block rounded-md border border-[var(--stone)] bg-[var(--sand)]/40 px-2.5 py-2 text-xs transition hover:bg-[var(--sand)]"
                  : "block rounded-md border border-[var(--stone)] bg-[var(--paper)] p-3 text-sm shadow-sm transition hover:border-[var(--ink)]/15"
              }
            >
              <p className="font-semibold text-[var(--ink)]">{issue.title}</p>
              <p className="mt-0.5 text-[0.65rem] text-ink-soft">{issue.upvote_count} upvotes</p>
            </Link>
          ))}
        </div>
      )}
    </>
  )

  if (embedded) return inner

  return (
    <div className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--sand)]/40 p-6 shadow-sm">{inner}</div>
  )
}

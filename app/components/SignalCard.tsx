import Link from "next/link"
import ImpactMeter from "@/app/components/ImpactMeter"

export type SignalCardIssue = {
  id: string
  title: string
  description: string
  status: string
  priority_score: number
  upvote_count: number
  report_count: number
}

type SignalCardProps = {
  issue: SignalCardIssue
  href: string
  maxScore: number
  wardName?: string | null
  statusHint?: string
  /** Prominent banner (e.g. citizen-verified resolution on official queue). */
  highlightBadge?: string
  children?: React.ReactNode
}

const hashToSeed = (value: string) => {
  let seed = 0
  for (let i = 0; i < value.length; i += 1) {
    seed = (seed * 31 + value.charCodeAt(i)) % 100000
  }
  return seed
}

const makeSparkline = (seed: number, points = 7) => {
  const values: number[] = []
  let current = seed % 60
  for (let i = 0; i < points; i += 1) {
    current = (current * 17 + 13) % 100
    values.push(20 + (current % 60))
  }
  return values
}

export default function SignalCard({
  issue,
  href,
  maxScore,
  wardName,
  statusHint,
  highlightBadge,
  children
}: SignalCardProps) {
  const seed = hashToSeed(issue.id)
  const values = makeSparkline(seed)
  const max = Math.max(...values, 1)
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100
      const y = 100 - (value / max) * 100
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className="rounded-md border border-[var(--stone)] bg-[var(--paper)] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Link href={href} className="text-sm font-semibold hover:underline">
          {issue.title}
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <polyline
                fill="none"
                stroke="var(--teal)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
          <span className="rounded-full bg-[var(--ink)] px-3 py-1 text-[0.65rem] font-condensed text-[var(--paper)]">
            {issue.priority_score.toFixed(1)}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-soft line-clamp-2">{issue.description}</p>
      {highlightBadge && (
        <div
          className="mt-3 rounded-md border-2 border-[var(--teal)] bg-[color-mix(in_oklch,var(--teal)_22%,var(--paper)_78%)] px-3 py-2 text-center text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] shadow-sm"
          role="status"
        >
          {highlightBadge}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
        <span className="chip">{issue.status.replace("_", " ")}</span>
        {statusHint && (
          <span className="rounded-full border border-[var(--stone)] bg-[color-mix(in_oklch,var(--sun)_20%,var(--paper)_80%)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink)]">
            {statusHint}
          </span>
        )}
        {wardName && <span className="chip">{wardName}</span>}
        <span>{issue.upvote_count} upvotes</span>
        <span>{issue.report_count} reports</span>
      </div>
      <div className="mt-4">
        <ImpactMeter score={issue.priority_score} maxScore={maxScore} />
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

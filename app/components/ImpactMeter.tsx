type ImpactMeterProps = {
  score: number
  maxScore: number
}

export default function ImpactMeter({ score, maxScore }: ImpactMeterProps) {
  const safeMax = Math.max(1, maxScore)
  const pct = Math.min(100, Math.max(6, (score / safeMax) * 100))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-condensed text-ink-soft">
        <span>Impact</span>
        <span className="font-metric">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-muted)]">
        <div
          className="h-2 rounded-full bg-[linear-gradient(90deg,var(--teal),var(--sun),var(--coral))]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

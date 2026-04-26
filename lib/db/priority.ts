export type PriorityInputs = {
  upvotes: number
  reports: number
  ageHours: number
  severity: number
  resolutionVerifications: number
}

export function calculateCivicPriorityScore({
  upvotes,
  reports,
  ageHours,
  severity,
  resolutionVerifications
}: PriorityInputs): number {
  const voteSignal = Math.log10(Math.max(1, upvotes + reports))
  const freshness = 1 / Math.max(1, ageHours / 24)
  const severityBoost = Math.min(5, Math.max(1, severity))
  const verificationPenalty = Math.min(1, resolutionVerifications / 10)

  const score = (voteSignal * 10 + severityBoost * 5) * freshness
  return Math.max(0, score * (1 - verificationPenalty))
}

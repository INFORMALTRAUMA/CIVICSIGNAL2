/**
 * Fixed locale + UTC so server and client render the same string (avoids hydration mismatch).
 * DB timestamps are typically stored in UTC.
 */
export function formatShortDate(iso: string | undefined): string {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "—"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC"
    }).format(d)
  } catch {
    return "—"
  }
}

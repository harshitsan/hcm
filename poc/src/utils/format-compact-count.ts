/**
 * Formats counts for display in tight spaces (e.g. donut charts) to avoid overlap.
 * 3+ digits get compacted: 1000+ → "1k+", 5000+ → "5k+", 10000+ → "10k+".
 */
export function formatCompactCount(value: number): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return '0'
  if (n < 1000) return String(Math.round(n))
  if (n >= 10000) return '10K+'
  if (n >= 5000) return '5K+'
  return '1K+'
}

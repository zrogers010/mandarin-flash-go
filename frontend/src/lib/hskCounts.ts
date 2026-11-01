/** Format an API word count for the quiz level picker. */
export function formatWordCount(n?: number): string {
  if (n == null || Number.isNaN(n)) return '… words'
  return `${n.toLocaleString('en-US')} words`
}

/** Go json-encodes map[int]int keys as strings. */
export function hskCountAt(
  counts: Record<string, number> | Record<number, number> | undefined,
  level: number,
): number | undefined {
  if (!counts) return undefined
  const rec = counts as Record<string | number, number>
  return rec[level] ?? rec[String(level)]
}

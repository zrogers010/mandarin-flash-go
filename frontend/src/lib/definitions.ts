/**
 * Parse a definition string into distinct meaning groups.
 * Uses "|" as the primary group separator (CC-CEDICT grouped format),
 * falling back to ";" for older data that hasn't been re-imported.
 */
export function parseDefinitions(english: string): string[] {
  if (english.includes('|')) {
    return english
      .split('|')
      .map(d => d.trim())
      .filter(Boolean)
  }
  return english
    .split(';')
    .map(d => d.trim())
    .filter(Boolean)
}

/**
 * Get a short display string for compact contexts (cards, quiz options).
 * Shows up to maxDefs groups joined by "; ".
 */
export function shortDefinition(english: string, maxDefs = 3): string {
  const defs = parseDefinitions(english)
  if (defs.length <= maxDefs) return defs.join('; ')
  return defs.slice(0, maxDefs).join('; ') + '...'
}

/**
 * Get the primary (first) definition group for quiz/flashcard contexts.
 */
export function primaryDefinition(english: string): string {
  return parseDefinitions(english)[0] || english
}

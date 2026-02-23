/**
 * Parse a semicolon-separated definition string into individual definitions.
 * e.g. "to love; to be fond of; affection" -> ["to love", "to be fond of", "affection"]
 */
export function parseDefinitions(english: string): string[] {
  return english
    .split(';')
    .map(d => d.trim())
    .filter(Boolean)
}

/**
 * Get a short display string for compact contexts (cards, quiz options).
 * Shows up to maxDefs definitions joined by "; ".
 */
export function shortDefinition(english: string, maxDefs = 3): string {
  const defs = parseDefinitions(english)
  if (defs.length <= maxDefs) return defs.join('; ')
  return defs.slice(0, maxDefs).join('; ') + '...'
}

/**
 * Get the primary (first) definition for quiz/flashcard contexts.
 */
export function primaryDefinition(english: string): string {
  return parseDefinitions(english)[0] || english
}

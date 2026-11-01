import { describe, it, expect } from 'vitest'
import { formatWordCount, hskCountAt } from '../lib/hskCounts'

describe('formatWordCount', () => {
  it('uses live API totals instead of hardcoded copy', () => {
    expect(formatWordCount(150)).toBe('150 words')
    expect(formatWordCount(2499)).toBe('2,499 words')
    expect(formatWordCount(undefined)).toBe('… words')
  })

  it('reads Go JSON map keys as strings or numbers', () => {
    expect(hskCountAt({ '2': 150 }, 2)).toBe(150)
    expect(hskCountAt({ 2: 150 }, 2)).toBe(150)
  })
})

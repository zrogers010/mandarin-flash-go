import { describe, it, expect, vi, beforeEach } from 'vitest'
import { guestStorage } from '../lib/guestStorage'
import { api } from '../lib/api'

describe('Guest Progress Merge', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should detect guest progress', () => {
    const guestData = {
      completed_quizzes: ['quiz_1'],
      seen_words: ['word-id-1', 'word-id-2'],
      quiz_results: [
        {
          quiz_type: 'practice' as const,
          total: 10,
          correct: 8,
          answers: {},
          timestamp: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
    }

    guestStorage.saveProgress(guestData)
    expect(guestStorage.hasProgress()).toBe(true)

    const summary = guestStorage.getSummary()
    expect(summary?.quizzes).toBe(1)
    expect(summary?.words).toBe(2)
  })

  it('should merge guest progress on login', async () => {
    const guestData = {
      completed_quizzes: ['quiz_1'],
      seen_words: ['word-id-1'],
      quiz_results: [
        {
          quiz_type: 'practice' as const,
          total: 10,
          correct: 8,
          answers: {},
          timestamp: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
    }

    guestStorage.saveProgress(guestData)

    // Mock API call
    const mockPost = vi.spyOn(api, 'post').mockResolvedValue({
      data: {
        message: 'Guest progress merged successfully',
        words_added: 1,
        quizzes_merged: 1,
      },
    })

    // Simulate merge
    const data = guestStorage.getProgress()
    await api.post('/auth/merge-guest-progress', { guest_data: data })
    guestStorage.clearProgress()

    expect(mockPost).toHaveBeenCalledWith('/auth/merge-guest-progress', {
      guest_data: guestData,
    })
    expect(guestStorage.hasProgress()).toBe(false)
  })

  it('should clear progress after successful merge', () => {
    guestStorage.initProgress()
    guestStorage.recordSeenWords(['word-1', 'word-2'])
    
    expect(guestStorage.hasProgress()).toBe(true)
    
    guestStorage.clearProgress()
    
    expect(guestStorage.hasProgress()).toBe(false)
    expect(guestStorage.getProgress()).toBeNull()
  })
})

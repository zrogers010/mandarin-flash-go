/**
 * Guest Mode: Local storage for unauthenticated users
 * 
 * Allows users to try quizzes and lessons before signing up.
 * Progress is stored in localStorage and merged into their account on signup.
 */

const GUEST_PROGRESS_KEY = 'mandarinflash_guest_progress'

export interface GuestQuizResult {
  quiz_type: 'practice' | 'scored'
  hsk_level?: number
  total: number
  correct: number
  answers: Record<string, string>
  timestamp: string
}

export interface GuestProgress {
  completed_quizzes: string[]
  seen_words: string[]
  quiz_results: GuestQuizResult[]
  created_at: string
}

export const guestStorage = {
  /**
   * Get guest progress from localStorage
   */
  getProgress(): GuestProgress | null {
    try {
      const stored = localStorage.getItem(GUEST_PROGRESS_KEY)
      if (!stored) return null
      return JSON.parse(stored)
    } catch (error) {
      console.error('Failed to load guest progress:', error)
      return null
    }
  },

  /**
   * Save guest progress to localStorage
   */
  saveProgress(progress: GuestProgress): void {
    try {
      localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(progress))
    } catch (error) {
      console.error('Failed to save guest progress:', error)
    }
  },

  /**
   * Initialize guest progress if it doesn't exist
   */
  initProgress(): GuestProgress {
    let progress = this.getProgress()
    if (!progress) {
      progress = {
        completed_quizzes: [],
        seen_words: [],
        quiz_results: [],
        created_at: new Date().toISOString(),
      }
      this.saveProgress(progress)
    }
    return progress
  },

  /**
   * Record a completed quiz
   */
  recordQuiz(result: GuestQuizResult): void {
    const progress = this.initProgress()
    progress.quiz_results.push(result)
    progress.completed_quizzes.push(`quiz_${result.timestamp}`)
    this.saveProgress(progress)
  },

  /**
   * Record seen vocabulary
   */
  recordSeenWords(wordIds: string[]): void {
    const progress = this.initProgress()
    progress.seen_words = [...new Set([...progress.seen_words, ...wordIds])]
    this.saveProgress(progress)
  },

  /**
   * Clear guest progress (after merge or logout)
   */
  clearProgress(): void {
    try {
      localStorage.removeItem(GUEST_PROGRESS_KEY)
    } catch (error) {
      console.error('Failed to clear guest progress:', error)
    }
  },

  /**
   * Check if user has guest progress
   */
  hasProgress(): boolean {
    const progress = this.getProgress()
    return progress !== null && (
      progress.completed_quizzes.length > 0 ||
      progress.seen_words.length > 0 ||
      progress.quiz_results.length > 0
    )
  },

  /**
   * Get summary of guest progress for display
   */
  getSummary(): { quizzes: number; words: number } | null {
    const progress = this.getProgress()
    if (!progress) return null
    
    return {
      quizzes: progress.quiz_results.length,
      words: progress.seen_words.length,
    }
  },
}

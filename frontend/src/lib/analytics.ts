/**
 * Google Analytics 4 event tracking
 * 
 * Tracks key funnel events for MandarinFlash:
 * - signup_start, signup_complete
 * - onboarding_complete
 * - first_lesson_complete
 * - verify_email
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

export const analytics = {
  /**
   * Track signup start (when user lands on signup page)
   */
  trackSignupStart() {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'signup_start', {
        event_category: 'engagement',
        event_label: 'User started signup flow',
      })
    }
  },

  /**
   * Track successful signup
   */
  trackSignupComplete(email: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'signup_complete', {
        event_category: 'engagement',
        event_label: 'User completed signup',
        user_id: email, // Hashed by GA4
      })
    }
  },

  /**
   * Track onboarding completion
   */
  trackOnboardingComplete(data: {
    learning_goal: string
    current_level?: number
    daily_goal: number
  }) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_complete', {
        event_category: 'engagement',
        event_label: 'User completed onboarding',
        learning_goal: data.learning_goal,
        current_level: data.current_level || 0,
        daily_goal: data.daily_goal,
      })
    }
  },

  /**
   * Track first lesson/quiz completion
   */
  trackFirstLessonComplete(type: 'quiz' | 'lesson') {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'first_lesson_complete', {
        event_category: 'engagement',
        event_label: `User completed first ${type}`,
        lesson_type: type,
      })
    }
  },

  /**
   * Track email verification
   */
  trackVerifyEmail() {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'verify_email', {
        event_category: 'engagement',
        event_label: 'User verified their email',
      })
    }
  },

  /**
   * Track quiz completion
   */
  trackQuizComplete(data: {
    type: 'practice' | 'scored'
    hsk_level?: number
    score: number
    total: number
  }) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'quiz_complete', {
        event_category: 'engagement',
        event_label: `Quiz completed: ${data.type}`,
        quiz_type: data.type,
        hsk_level: data.hsk_level || 0,
        score: data.score,
        total: data.total,
        percentage: Math.round((data.score / data.total) * 100),
      })
    }
  },

  /**
   * Track page view (called automatically by router)
   */
  trackPageView(page: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: page,
      })
    }
  },
}

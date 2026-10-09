import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

interface OnboardingData {
  learning_goal: string
  current_hsk_level: number | null
  target_hsk_level: number | null
  daily_minutes_goal: number
  timezone: string
}

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    learning_goal: '',
    current_hsk_level: null,
    target_hsk_level: null,
    daily_minutes_goal: 15,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const goals = [
    { id: 'beginner', label: 'Complete Beginner', description: 'Start from scratch' },
    { id: 'travel', label: 'Travel & Tourism', description: 'Essential phrases for trips' },
    { id: 'business', label: 'Business Chinese', description: 'Professional communication' },
    { id: 'hsk_exam', label: 'HSK Exam Prep', description: 'Pass official tests' },
    { id: 'fluency', label: 'Full Fluency', description: 'Master the language' },
  ]

  const hskLevels = [
    { level: 0, label: 'Complete Beginner', words: '0 words' },
    { level: 1, label: 'HSK 1', words: '150 words' },
    { level: 2, label: 'HSK 2', words: '300 words' },
    { level: 3, label: 'HSK 3', words: '600 words' },
    { level: 4, label: 'HSK 4', words: '1,200 words' },
    { level: 5, label: 'HSK 5', words: '2,500 words' },
    { level: 6, label: 'HSK 6', words: '5,000+ words' },
  ]

  const dailyGoals = [
    { minutes: 5, label: '5 min/day', description: 'Light practice' },
    { minutes: 10, label: '10 min/day', description: 'Steady progress' },
    { minutes: 15, label: '15 min/day', description: 'Recommended' },
    { minutes: 20, label: '20 min/day', description: 'Serious learner' },
    { minutes: 30, label: '30 min/day', description: 'Fast progress' },
  ]

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      await api.post('/auth/onboarding', { ...data, timezone })
      
      // Track onboarding completion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'onboarding_complete', {
          event_category: 'engagement',
          learning_goal: data.learning_goal,
          current_level: data.current_hsk_level,
          daily_goal: data.daily_minutes_goal,
        })
      }

      // Merge guest progress if it exists
      await mergeGuestProgressIfExists()

      // Redirect to dashboard
      navigate('/practice')
    } catch (error) {
      console.error('Onboarding error:', error)
      setIsLoading(false)
      // Still navigate to practice even if onboarding save fails
      navigate('/practice')
    }
  }

  const mergeGuestProgressIfExists = async () => {
    try {
      const { guestStorage } = await import('../lib/guestStorage')
      if (guestStorage.hasProgress()) {
        const guestData = guestStorage.getProgress()
        if (guestData) {
          await api.post('/auth/merge-guest-progress', { guest_data: guestData })
          guestStorage.clearProgress()
          
          const summary = guestStorage.getSummary()
          if (summary && (summary.quizzes > 0 || summary.words > 0)) {
            console.log(`✅ Progress saved: ${summary.quizzes} quizzes, ${summary.words} words`)
          }
        }
      }
    } catch (error) {
      console.error('Failed to merge guest progress:', error)
    }
  }

  const canProceed = () => {
    if (step === 1) return data.learning_goal !== ''
    if (step === 2) return data.current_hsk_level !== null
    if (step === 3) return true
    return false
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {step} of 3
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round((step / 3) * 100)}% complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Step 1: Learning Goal */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What's your learning goal?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This helps us customize your experience
              </p>

              <div className="space-y-3">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setData({ ...data, learning_goal: goal.id })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      data.learning_goal === goal.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {goal.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {goal.description}
                        </div>
                      </div>
                      {data.learning_goal === goal.id && (
                        <CheckCircleIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Current Level */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What's your current level?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We'll start you at the right difficulty
              </p>

              <div className="space-y-3">
                {hskLevels.map((level) => (
                  <button
                    key={level.level}
                    onClick={() => {
                      setData({
                        ...data,
                        current_hsk_level: level.level,
                        target_hsk_level: level.level < 6 ? level.level + 1 : 6,
                      })
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      data.current_hsk_level === level.level
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {level.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {level.words}
                        </div>
                      </div>
                      {data.current_hsk_level === level.level && (
                        <CheckCircleIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Daily Goal */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Set your daily goal
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Consistency beats intensity — start small!
              </p>

              <div className="space-y-3">
                {dailyGoals.map((goal) => (
                  <button
                    key={goal.minutes}
                    onClick={() => setData({ ...data, daily_minutes_goal: goal.minutes })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      data.daily_minutes_goal === goal.minutes
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {goal.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {goal.description}
                        </div>
                      </div>
                      {data.daily_minutes_goal === goal.minutes && (
                        <CheckCircleIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Setting up...
                </span>
              ) : step === 3 ? (
                "Let's Go!"
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { FireIcon, AcademicCapIcon, ClockIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

interface DailyStats {
  today_minutes: number
  today_cards_reviewed: number
  today_new_words: number
  today_goal_met: boolean
  daily_goal: number
  streak_days: number
  reviews_due: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    
    // Track dashboard view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: 'Dashboard',
        page_location: window.location.href,
      })
    }
  }, [])

  const loadStats = async () => {
    try {
      const response = await api.get('/daily-stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  const progress = stats ? Math.min((stats.today_minutes / stats.daily_goal) * 100, 100) : 0
  const hasActivity = stats && (stats.today_minutes > 0 || stats.today_cards_reviewed > 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Today
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Daily Goal Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Daily Goal
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {stats?.today_minutes || 0} / {stats?.daily_goal || 15} minutes
            </p>
          </div>
          {stats?.today_goal_met ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="h-6 w-6" />
              <span className="font-semibold">Complete!</span>
            </div>
          ) : (
            <ClockIcon className="h-8 w-8 text-gray-400" />
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-500 ${
              stats?.today_goal_met ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.today_cards_reviewed || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.today_new_words || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">New Words</div>
          </div>
          <div className="text-center flex items-center justify-center">
            <FireIcon className="h-5 w-5 text-orange-500 mr-1" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.streak_days || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Due */}
      {stats && stats.reviews_due > 0 && (
        <Link
          to="/review"
          className="block bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 mb-6 hover:from-emerald-600 hover:to-teal-700 transition-all"
        >
          <div className="flex items-center justify-between text-white">
            <div>
              <h3 className="text-xl font-semibold mb-1">Reviews Ready!</h3>
              <p className="text-emerald-100">{stats.reviews_due} cards due for review</p>
            </div>
            <ArrowRightIcon className="h-8 w-8" />
          </div>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/flashcards"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Practice Quiz</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Test your knowledge</p>
            </div>
          </div>
        </Link>

        <Link
          to="/vocabulary"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Browse Vocabulary</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Explore HSK words</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Empty State */}
      {!hasActivity && (
        <div className="mt-8 text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
          <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Ready to start learning?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Begin your Chinese journey today. Take a quiz or review your vocabulary to start building your streak!
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/flashcards"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Start a Quiz
            </Link>
            <Link
              to="/learn/new"
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Learn New Words
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

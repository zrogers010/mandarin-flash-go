import { Link } from 'react-router-dom'
import { BookOpen, Brain, ArrowRight, BarChart3 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { SEO } from '@/components/SEO'

const hskLevels = [
  {
    level: 1,
    words: '150',
    description: 'Basic greetings, numbers, dates, and simple everyday phrases.',
    difficulty: 'Beginner',
    color: 'bg-green-500',
  },
  {
    level: 2,
    words: '300',
    description: 'Shopping, dining, transportation, and basic conversational topics.',
    difficulty: 'Beginner',
    color: 'bg-green-600',
  },
  {
    level: 3,
    words: '600',
    description: 'Travel, hobbies, work, and expressing opinions in everyday life.',
    difficulty: 'Intermediate',
    color: 'bg-yellow-500',
  },
  {
    level: 4,
    words: '1,200',
    description: 'Abstract topics, news, culture, and fluent discussion of familiar subjects.',
    difficulty: 'Upper Intermediate',
    color: 'bg-orange-500',
  },
  {
    level: 5,
    words: '2,500',
    description: 'Reading newspapers, giving speeches, and expressing yourself with precision.',
    difficulty: 'Advanced',
    color: 'bg-red-500',
  },
  {
    level: 6,
    words: '5,000',
    description: 'Near-native comprehension of written and spoken Chinese across all domains.',
    difficulty: 'Proficient',
    color: 'bg-red-700',
  },
]

export function HSKHub() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-8">
      <SEO
        title="HSK Study Guide"
        description="Study for the HSK exam with MandarinFlash. Browse vocabulary for HSK levels 1-6, practice with flashcards, and track your progress."
      />
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          HSK Study Guide
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          The HSK (汉语水平考试) is China's standardized Mandarin proficiency test. Choose a level
          below to browse vocabulary, practice with flashcards, or test yourself with quizzes.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/vocabulary" className="card hover:shadow-md transition-shadow group text-center">
          <BookOpen className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">Browse All Vocabulary</h3>
          <p className="text-gray-500 text-sm mt-1">Search and filter across all HSK levels</p>
        </Link>
        <Link to="/flashcards" className="card hover:shadow-md transition-shadow group text-center">
          <Brain className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">Practice Flashcards</h3>
          <p className="text-gray-500 text-sm mt-1">Drill vocabulary with interactive cards</p>
        </Link>
        {isAuthenticated ? (
          <Link to="/progress" className="card hover:shadow-md transition-shadow group text-center">
            <BarChart3 className="w-8 h-8 text-primary-800 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">Your Progress</h3>
            <p className="text-gray-500 text-sm mt-1">Review scores and track improvement</p>
          </Link>
        ) : (
          <Link to="/signup" className="card hover:shadow-md transition-shadow group text-center">
            <BarChart3 className="w-8 h-8 text-primary-800 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">Track Progress</h3>
            <p className="text-gray-500 text-sm mt-1">Sign up to save your quiz scores</p>
          </Link>
        )}
      </div>

      {/* HSK Levels */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">HSK Levels</h2>
        <div className="grid gap-4">
          {hskLevels.map(({ level, words, description, difficulty, color }) => (
            <div key={level} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-lg">{level}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">HSK Level {level}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-gray-500">~{words} words</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-500">{difficulty}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-shrink-0">
                  <Link
                    to={`/vocabulary?hsk_level=${level}`}
                    className="btn-outline text-sm py-1.5 px-3"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                    Vocab
                  </Link>
                  <Link
                    to={`/flashcards?hsk_level=${level}`}
                    className="btn-primary text-sm py-1.5 px-3"
                  >
                    <Brain className="w-3.5 h-3.5 mr-1.5" />
                    Practice
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About HSK */}
      <div className="card space-y-4">
        <h2 className="text-xl font-bold text-gray-900">About the HSK Exam</h2>
        <div className="text-gray-600 text-sm leading-relaxed space-y-3">
          <p>
            The HSK (Hànyǔ Shuǐpíng Kǎoshì, 汉语水平考试) is the standardized test of Mandarin
            Chinese proficiency for non-native speakers. It is administered by Hanban, a division
            of the Chinese Ministry of Education, and is recognized internationally by universities
            and employers.
          </p>
          <p>
            The test has 6 levels, from HSK 1 (beginner) to HSK 6 (advanced). Each level tests
            listening, reading, and (at levels 3+) writing skills. Passing higher HSK levels can
            qualify you for Chinese university admission and professional opportunities.
          </p>
          <p>
            MandarinFlash covers vocabulary for all 6 HSK levels with interactive flashcards,
            scored quizzes, and spaced repetition to help you study efficiently.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/flashcards" className="btn-primary">
            Start Practicing
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}

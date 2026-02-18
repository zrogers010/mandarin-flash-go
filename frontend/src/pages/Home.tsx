import { Link } from 'react-router-dom'
import { BookOpen, Brain, Search, BarChart3, ArrowRight, Zap } from 'lucide-react'

const features = [
  {
    name: 'HSK Vocabulary',
    description: 'Browse thousands of words across HSK levels 1-5 with pinyin, tones, and example sentences in Chinese and English.',
    icon: BookOpen,
    href: '/vocabulary',
    color: 'bg-primary-600',
  },
  {
    name: 'Flashcards & Quizzes',
    description: 'Drill vocabulary with interactive flashcards or test yourself with scored multiple-choice quizzes.',
    icon: Brain,
    href: '/flashcards',
    color: 'bg-secondary-600',
  },
  {
    name: 'Dictionary',
    description: 'Look up any word instantly -- search by Chinese characters, pinyin, or English meaning.',
    icon: Search,
    href: '/dictionary',
    color: 'bg-primary-800',
  },
  {
    name: 'Track Progress',
    description: 'See your quiz scores, review the words you get wrong, and watch your Mandarin improve over time.',
    icon: BarChart3,
    href: '/progress',
    color: 'bg-secondary-700',
  },
]

export function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-50 border border-secondary-200 rounded-full text-secondary-700 text-sm font-medium mb-2">
          <Zap className="w-3.5 h-3.5" />
          Chinese-English learning, powered by HSK
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gradient">
          Learn Chinese in a Flash
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Master Mandarin Chinese with flashcards, quizzes, and a built-in dictionary -- all organized by HSK level so you learn the right words at the right time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/flashcards" className="btn-primary inline-flex items-center">
            Start Practicing
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link to="/vocabulary" className="btn-outline inline-flex items-center">
            Browse Vocabulary
            <BookOpen className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.name}
            to={feature.href}
            className="card hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${feature.color} text-white`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {feature.name}
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>

      {/* HSK Levels Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-center mb-2">HSK Vocabulary Coverage</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Pick a level to start studying</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          {[1, 2, 3, 4, 5].map((level) => (
            <Link
              key={level}
              to={`/vocabulary?hsk_level=${level}`}
              className="space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="text-2xl font-bold text-secondary-600 group-hover:text-secondary-700 transition-colors">
                HSK {level}
              </div>
              <div className="text-sm text-gray-600">
                {level === 1 && '~150 words'}
                {level === 2 && '~300 words'}
                {level === 3 && '~600 words'}
                {level === 4 && '~1,200 words'}
                {level === 5 && '~2,500 words'}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 
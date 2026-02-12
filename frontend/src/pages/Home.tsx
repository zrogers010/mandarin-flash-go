import { Link } from 'react-router-dom'
import { BookOpen, Brain, Search, MessageCircle, ArrowRight } from 'lucide-react'

const features = [
  {
    name: 'Vocabulary Practice',
    description: 'Master HSK levels 1-6 with definitions, pinyin, tones, and example sentences.',
    icon: BookOpen,
    href: '/vocabulary',
    color: 'bg-blue-500',
  },
  {
    name: 'Flashcards',
    description: 'Practice vocabulary with interactive flashcards or take multiple choice quizzes.',
    icon: Brain,
    href: '/flashcards',
    color: 'bg-green-500',
  },
  {
    name: 'Dictionary Lookup',
    description: 'Search any HSK word and find definitions with sample sentences.',
    icon: Search,
    href: '/dictionary',
    color: 'bg-purple-500',
  },
  {
    name: 'AI Chat Practice',
    description: 'Practice Chinese conversation with our fluent AI assistant.',
    icon: MessageCircle,
    href: '/chat',
    color: 'bg-orange-500',
  },
]

export function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-gradient">
          Master Chinese with HSK
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your comprehensive platform for learning Chinese vocabulary, taking quizzes, 
          looking up words, and practicing conversation with AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/vocabulary" className="btn-primary inline-flex items-center">
            Start Learning
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link to="/flashcards" className="btn-outline inline-flex items-center">
            Practice Flashcards
            <Brain className="ml-2 w-4 h-4" />
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

      {/* Stats Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-center mb-8">HSK Vocabulary Coverage</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-center">
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <Link
              key={level}
              to={`/vocabulary?hsk_level=${level}`}
              className="space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="text-2xl font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
                HSK {level}
              </div>
              <div className="text-sm text-gray-600">
                {level === 1 && '150 words'}
                {level === 2 && '300 words'}
                {level === 3 && '600 words'}
                {level === 4 && '1200 words'}
                {level === 5 && '2500 words'}
                {level === 6 && '5000 words'}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 
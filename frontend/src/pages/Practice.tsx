import { Link } from 'react-router-dom'
import { Brain, Search, MessageCircle, ArrowRight, Sparkles, BookOpen, CalendarClock } from 'lucide-react'
import { SEO } from '@/components/SEO'

const tools = [
  {
    name: 'Flashcards & Quizzes',
    description: 'Drill vocabulary with interactive flashcards in practice mode or challenge yourself with scored multiple-choice quizzes. Supports HSK levels 1–5 and lesson-specific vocabulary.',
    icon: Brain,
    href: '/flashcards',
    color: 'bg-secondary-600',
    cta: 'Start Flashcards',
  },
  {
    name: 'Smart Review',
    description: 'Spaced repetition schedules each word for review right before you\'d forget it. Grade yourself after each card and the schedule adapts to you.',
    icon: CalendarClock,
    href: '/review',
    color: 'bg-primary-600',
    cta: 'Review Due Words',
  },
  {
    name: 'Dictionary',
    description: 'Look up any Chinese word by character, pinyin, or English meaning. Every entry includes tone-marked pinyin, audio pronunciation, and example sentences.',
    icon: Search,
    href: '/dictionary',
    color: 'bg-primary-800',
    cta: 'Open Dictionary',
  },
  {
    name: 'AI Chinese Tutor',
    description: 'Practice real conversation with an AI-powered tutor — instant corrections, explanations, and personalized guidance. Launching soon.',
    icon: MessageCircle,
    href: '/chat',
    color: 'bg-purple-600',
    cta: 'Learn More',
    badge: 'Coming Soon',
  },
]

const quickStart = [
  { name: 'HSK 1 Flashcards', href: '/flashcards?hsk_level=1', label: 'Beginner' },
  { name: 'HSK 2 Flashcards', href: '/flashcards?hsk_level=2', label: 'Beginner' },
  { name: 'HSK 3 Flashcards', href: '/flashcards?hsk_level=3', label: 'Intermediate' },
  { name: 'HSK 4 Flashcards', href: '/flashcards?hsk_level=4', label: 'Upper Int.' },
  { name: 'HSK 5 Flashcards', href: '/flashcards?hsk_level=5', label: 'Advanced' },
]

export function Practice() {
  return (
    <div className="space-y-10">
      <SEO
        title="Practice Mandarin"
        description="Practice Mandarin Chinese with flashcards, quizzes, a searchable dictionary, and an AI-powered conversation tutor."
      />

      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-50 text-secondary-700 rounded-full text-sm font-medium">
          <Brain className="w-4 h-4" />
          Practice Tools
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          Practice Mandarin Chinese
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Reinforce your learning with interactive tools — flashcards for drilling vocabulary,
          a comprehensive dictionary, and an AI tutor for real conversation practice.
        </p>
      </div>

      <div className="grid gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.name}
            to={tool.href}
            className="card hover:shadow-md transition-shadow group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`w-14 h-14 ${tool.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <tool.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {tool.name}
                  </h2>
                  {tool.badge && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      {tool.badge}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mt-1">
                  {tool.description}
                </p>
              </div>
              <div className="flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700 flex-shrink-0">
                {tool.cta}
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Quick Start Flashcards</h2>
            <p className="text-gray-500 text-sm mt-1">Jump straight into practice by HSK level</p>
          </div>
          <Link to="/hsk" className="text-primary-600 hover:text-primary-700 text-sm font-medium hidden sm:flex items-center gap-1">
            HSK Guide
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickStart.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center group"
            >
              <div className="text-lg font-bold text-secondary-600 group-hover:text-secondary-700 transition-colors">
                {item.name.replace(' Flashcards', '')}
              </div>
              <div className="text-xs text-gray-500 mt-1">{item.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-secondary-600 to-secondary-800 rounded-xl p-5 sm:p-8 text-white text-center space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold">Looking for Vocabulary?</h2>
        <p className="text-secondary-100 max-w-xl mx-auto text-sm sm:text-base">
          Browse HSK vocabulary lists, explore lesson-specific words, or search the full dictionary.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <Link to="/hsk" className="inline-flex items-center justify-center gap-2 bg-white text-secondary-700 font-medium px-5 py-2.5 rounded-lg hover:bg-secondary-50 transition-colors text-sm">
            <BookOpen className="w-4 h-4" />
            HSK Study Guide
          </Link>
          <Link to="/learn" className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm">
            Browse Lessons
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

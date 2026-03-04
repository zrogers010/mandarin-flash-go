import { Link } from 'react-router-dom'
import { BookOpen, Brain, Search, BarChart3, ArrowRight, Sparkles, MessageCircle, CheckCircle2, Volume2, BookTemplate, GraduationCap } from 'lucide-react'
import { SEO } from '@/components/SEO'

const features = [
  {
    name: 'HSK Vocabulary',
    description: 'Browse thousands of words across HSK levels 1–6 with pinyin, tones, and example sentences.',
    icon: BookOpen,
    href: '/hsk',
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
    name: 'Interactive Pinyin Chart',
    description: 'Master pronunciation with our audio-enabled chart covering all 400+ Mandarin syllables.',
    icon: Volume2,
    href: '/pinyin',
    color: 'bg-purple-600',
  },
  {
    name: 'Lessons & Grammar',
    description: 'Structured lessons on grammar patterns and topic vocabulary for food, travel, and more.',
    icon: BookTemplate,
    href: '/lessons',
    color: 'bg-orange-500',
  },
  {
    name: 'Dictionary',
    description: 'Search by Chinese characters, pinyin, or English meaning to find any word instantly.',
    icon: Search,
    href: '/dictionary',
    color: 'bg-primary-800',
  },
  {
    name: 'Track Progress',
    description: 'Review quiz scores, revisit missed words, and watch your Mandarin improve over time.',
    icon: BarChart3,
    href: '/progress',
    color: 'bg-secondary-700',
  },
]

const highlights = [
  'Interactive flashcards and scored quizzes',
  'Audio pronunciation for every word',
  'Grammar and topic-based lessons',
  'HSK 1–6 vocabulary coverage',
  'AI-powered Chinese tutor',
  'Free to use — no paywall',
]

const hskLevels = [
  { level: 1, words: '150' },
  { level: 2, words: '300' },
  { level: 3, words: '600' },
  { level: 4, words: '1,200' },
  { level: 5, words: '2,500' },
]

const lessonHighlights = [
  { name: 'Greetings & Intros', href: '/lessons/greetings-and-introductions', category: 'Topic' },
  { name: 'Food & Dining', href: '/lessons/food-and-dining', category: 'Topic' },
  { name: 'Travel', href: '/lessons/travel-and-transportation', category: 'Topic' },
  { name: 'Basic Sentence Structure', href: '/lessons/basic-sentence-structure', category: 'Grammar' },
  { name: 'Measure Words', href: '/lessons/measure-words', category: 'Grammar' },
  { name: 'Question Patterns', href: '/lessons/question-particles', category: 'Grammar' },
]

export function Home() {
  return (
    <div className="space-y-10 sm:space-y-16">
      <SEO description="Free Mandarin Chinese learning platform with interactive flashcards, HSK vocabulary, pinyin chart, grammar lessons, AI tutor, and more." />
      {/* Hero */}
      <section className="text-center space-y-5 sm:space-y-6 pt-2 sm:pt-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
          Master Mandarin Chinese{' '}
          <span className="text-gradient">in a Flash</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          The free, data-driven platform for learning Mandarin. Interactive flashcards, structured
          lessons, an AI tutor, and comprehensive HSK coverage — everything you need in one place.
        </p>

        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-gray-600 max-w-2xl mx-auto">
          {highlights.map((text) => (
            <li key={text} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
              {text}
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <Link to="/flashcards" className="btn-primary text-base px-6 py-3 inline-flex items-center justify-center">
            Start Flashcards
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link to="/pinyin" className="btn-outline text-base px-6 py-3 inline-flex items-center justify-center">
            Pinyin Chart
            <Volume2 className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="sr-only">Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature) => (
            <Link
              key={feature.name}
              to={feature.href}
              className="card hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center space-x-3 mb-3">
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
      </section>

      {/* Lessons Preview */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Structured Lessons</h2>
            <p className="text-gray-500 text-sm mt-1">Grammar patterns and topic vocabulary to accelerate your learning</p>
          </div>
          <Link to="/lessons" className="text-primary-600 hover:text-primary-700 text-sm font-medium hidden sm:flex items-center gap-1">
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lessonHighlights.map((lesson) => (
            <Link
              key={lesson.name}
              to={lesson.href}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                lesson.category === 'Grammar' ? 'bg-purple-100' : 'bg-orange-100'
              }`}>
                {lesson.category === 'Grammar'
                  ? <BookTemplate className="w-4 h-4 text-purple-600" />
                  : <GraduationCap className="w-4 h-4 text-orange-600" />
                }
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                  {lesson.name}
                </div>
                <div className="text-xs text-gray-500">{lesson.category}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="sm:hidden mt-4 text-center">
          <Link to="/lessons" className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center gap-1">
            View All Lessons
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* HSK Levels */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl sm:text-2xl font-bold">HSK Vocabulary Coverage</h2>
          <Link to="/hsk" className="text-primary-600 hover:text-primary-700 text-sm font-medium hidden sm:flex items-center gap-1">
            HSK Guide
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-gray-500 mb-6 sm:mb-8 text-sm">Pick a level to start studying</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-6 text-center">
          {hskLevels.map(({ level, words }) => (
            <Link
              key={level}
              to={`/vocabulary?hsk_level=${level}`}
              className="space-y-1 p-3 sm:p-4 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors group"
            >
              <div className="text-xl sm:text-2xl font-bold text-secondary-600 group-hover:text-secondary-700 transition-colors">
                HSK {level}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">~{words} words</div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Chatbot Teaser */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-xl p-5 sm:p-8 text-white text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-sm font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered
        </div>
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" />
          <h2 className="text-xl sm:text-2xl font-bold">AI Chinese Tutor</h2>
        </div>
        <p className="text-primary-100 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
          Practice conversation in real-time with our AI-powered chatbot. Get instant feedback,
          corrections, and personalized guidance — like having a private tutor available 24/7.
        </p>
        <Link to="/chat" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm">
          Try AI Tutor
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Bottom CTA */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ready to Get Started?</h2>
        <p className="text-gray-600 max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
          Create a free account to track your progress, save quiz scores, and pick up where you left off.
        </p>
        <p className="text-xl sm:text-2xl chinese-text">加油 (jiāyóu) — Let's do this!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <Link to="/signup" className="btn-primary inline-flex items-center justify-center">
            Sign Up Free
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link to="/flashcards" className="btn-outline inline-flex items-center justify-center">
            Start Practicing
            <Brain className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

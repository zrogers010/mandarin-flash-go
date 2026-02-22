import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Brain, Search, BarChart3, ArrowRight, Zap, X, Sparkles, MessageCircle, Users, SlidersHorizontal, TrendingUp } from 'lucide-react'

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

const whyChoose = [
  {
    name: 'User-Friendly Interface',
    description: 'Our platform is designed to be intuitive and easy-to-use, ensuring a seamless learning experience.',
    icon: SlidersHorizontal,
  },
  {
    name: 'Adaptive Learning',
    description: 'MandarinFlash adjusts to your unique learning style, making it the perfect study companion.',
    icon: TrendingUp,
  },
  {
    name: 'Progress Tracking',
    description: 'Keep track of your achievements and watch your Chinese skills soar with our progress tracking tools.',
    icon: BarChart3,
  },
  {
    name: 'Community Support',
    description: 'Join our active community of learners and share your experiences, challenges, and successes.',
    icon: Users,
  },
]

function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('mf_welcome_dismissed') === '1'
  })

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem('mf_welcome_dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-lg">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-white/20 rounded-xl flex-shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Welcome to the New MandarinFlash!</h2>
          <p className="text-primary-100 text-sm leading-relaxed">
            We've rebuilt MandarinFlash from the ground up with a faster, more modern experience. Here's what's new:
          </p>
          <ul className="text-sm text-primary-50 space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-secondary-400 rounded-full flex-shrink-0" />
              Scored quizzes with detailed results -- see exactly which words you got wrong
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-secondary-400 rounded-full flex-shrink-0" />
              Progress tracking -- your quiz history and stats are saved to your account
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-secondary-400 rounded-full flex-shrink-0" />
              Improved dictionary with search by Chinese, pinyin, or English
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-secondary-400 rounded-full flex-shrink-0" />
              Faster flashcards and a cleaner design throughout
            </li>
          </ul>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center px-4 py-2 bg-white text-primary-700 font-semibold text-sm rounded-lg hover:bg-primary-50 transition-colors"
            >
              Create an Account
              <ArrowRight className="ml-1.5 w-4 h-4" />
            </Link>
            <span className="text-primary-200 text-sm self-center">
              Previous accounts didn't carry over -- sign up to start tracking your progress.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Home() {
  return (
    <div className="space-y-12">
      <WelcomeBanner />

      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-50 border border-secondary-200 rounded-full text-secondary-700 text-sm font-medium mb-2">
          <Zap className="w-3.5 h-3.5" />
          Master Chinese HSK vocabulary through interactive flashcards
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gradient">
          Welcome to Mandarin Flash!
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Master Chinese HSK vocabulary through interactive flashcards, quizzes, and our comprehensive dictionary -- all organized by HSK level so you learn the right words at the right time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/flashcards" className="btn-primary inline-flex items-center">
            Get Started with Flashcards
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link to="/dictionary" className="btn-outline inline-flex items-center">
            Explore the Dictionary
            <Search className="ml-2 w-4 h-4" />
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

      {/* Flashcards & Quizzes Spotlight */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary-600 text-white rounded-xl">
              <Brain className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Interactive Flashcard Quizzes</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Our flashcards cover all levels of the HSK vocabulary list. Learn at your own pace and track your progress easily. Customize your learning experience with various options and settings.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Test your knowledge with engaging quizzes. Choose from multiple-choice questions, fill-in-the-blank exercises, and more -- a great way to reinforce your learning and track your improvement over time.
          </p>
          <Link to="/flashcards" className="btn-primary inline-flex items-center mt-2">
            Get Started with Flashcards
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-800 text-white rounded-xl">
              <Search className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Comprehensive Dictionary</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Our Mandarin dictionary is designed specifically for HSK learners. Easily search and explore the vocabulary list, with example sentences, pinyin, and detailed word breakdowns.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Search by Chinese characters, pinyin, or English meaning to quickly find exactly what you're looking for.
          </p>
          <Link to="/dictionary" className="btn-outline inline-flex items-center mt-2">
            Explore the Dictionary
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
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

      {/* Chatbot Teaser */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-xl p-8 text-white text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-sm font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Coming Soon
        </div>
        <div className="flex items-center justify-center gap-3">
          <MessageCircle className="w-8 h-8" />
          <h2 className="text-2xl font-bold">AI Chinese Tutor Chatbot</h2>
        </div>
        <p className="text-primary-100 max-w-2xl mx-auto leading-relaxed">
          Soon, you'll be able to practice your Chinese in real-time with our AI-powered chatbot. Get instant feedback and personalized guidance from a virtual Chinese tutor.
        </p>
      </div>

      {/* Why Choose MandarinFlash */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose MandarinFlash?</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChoose.map((item) => (
            <div key={item.name} className="card text-center space-y-3">
              <div className="inline-flex p-3 bg-primary-50 text-primary-600 rounded-xl mx-auto">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Get Started Today!</h2>
        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Embark on your journey to mastering Mandarin Chinese with MandarinFlash. Sign up for a free account and unlock a world of interactive flashcards, quizzes, and learning tools.
        </p>
        <p className="text-2xl chinese-text">加油 (jiāyóu) -- Let's do this!</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Link to="/signup" className="btn-primary inline-flex items-center">
            Sign Up Free
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link to="/flashcards" className="btn-outline inline-flex items-center">
            Start Practicing
            <Brain className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
} 
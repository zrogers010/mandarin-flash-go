import { Link } from 'react-router-dom'

const learnLinks = [
  { name: 'Pinyin Chart', href: '/pinyin' },
  { name: 'Grammar Lessons', href: '/lessons/grammar' },
  { name: 'Topic Lessons', href: '/lessons/topics' },
  { name: 'All Lessons', href: '/lessons' },
]

const hskLinks = [
  { name: 'HSK Guide', href: '/hsk' },
  { name: 'HSK 1', href: '/vocabulary?hsk_level=1' },
  { name: 'HSK 2', href: '/vocabulary?hsk_level=2' },
  { name: 'HSK 3', href: '/vocabulary?hsk_level=3' },
  { name: 'HSK 4', href: '/vocabulary?hsk_level=4' },
  { name: 'HSK 5', href: '/vocabulary?hsk_level=5' },
]

const practiceLinks = [
  { name: 'Flashcards', href: '/flashcards' },
  { name: 'Dictionary', href: '/dictionary' },
  { name: 'AI Tutor', href: '/chat' },
  { name: 'Progress', href: '/progress' },
]

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-3">
              <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-gold font-bold text-xs">闪</span>
              </div>
              <span className="text-lg font-bold text-gradient">MandarinFlash</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Free, data-driven Mandarin learning with AI-powered tools and interactive flashcards.
            </p>
          </div>

          {/* Learn */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Learn</h3>
            <ul className="space-y-2">
              {learnLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* HSK */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">HSK</h3>
            <ul className="space-y-2">
              {hskLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Practice */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Practice</h3>
            <ul className="space-y-2">
              {practiceLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} MandarinFlash. Learn Mandarin Chinese the smart way.
          </p>
        </div>
      </div>
    </footer>
  )
}

import { ReactNode, useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Brain, Search, MessageCircle, User, LogOut, LogIn, UserPlus, Settings, BarChart3, ChevronDown, Facebook, Instagram, Youtube } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Vocabulary', href: '/vocabulary', icon: BookOpen },
  { name: 'Flashcards', href: '/flashcards', icon: Brain },
  { name: 'Dictionary', href: '/dictionary', icon: Search },
  { name: 'Progress', href: '/progress', icon: BarChart3 },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
]

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setUserMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-gold font-bold text-sm">中</span>
                </div>
                <span className="text-xl font-bold text-gradient">MandarinFlash</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-6">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Auth area */}
              <div className="flex items-center">
                {isAuthenticated ? (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-secondary-100 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-secondary-600" />
                      </div>
                      <span className="hidden sm:inline max-w-[140px] truncate">
                        {user?.username || user?.email}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-2.5 border-b border-gray-100">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {user?.username || 'User'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </div>
                        </div>
                        <Link
                          to="/settings"
                          className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-400" />
                          <span>Settings</span>
                        </Link>
                        <button
                          onClick={logout}
                          className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-gray-400" />
                          <span>Log out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/login"
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/signup"
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
        <div className="flex justify-around">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="hidden md:block bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-3">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-gold font-bold text-sm">中</span>
                </div>
                <span className="text-lg font-bold text-gradient">MandarinFlash</span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed">
                Master Mandarin Chinese with interactive flashcards, quizzes, and a comprehensive HSK dictionary.
              </p>
            </div>

            {/* Learn */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Learn</h3>
              <ul className="space-y-2">
                <li><Link to="/flashcards" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">Flashcards</Link></li>
                <li><Link to="/vocabulary" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">HSK Vocabulary</Link></li>
                <li><Link to="/dictionary" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">Dictionary</Link></li>
                <li><Link to="/progress" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">Progress</Link></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Account</h3>
              <ul className="space-y-2">
                <li><Link to="/signup" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">Sign Up Free</Link></li>
                <li><Link to="/login" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">Log In</Link></li>
                <li><Link to="/settings" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">Settings</Link></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Follow Us</h3>
              <div className="flex space-x-3">
                <a href="https://facebook.com/mandarinflash" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-600 text-gray-500 transition-colors" aria-label="Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://instagram.com/mandarinflash" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-600 text-gray-500 transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://youtube.com/@mandarinflash" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-600 text-gray-500 transition-colors" aria-label="YouTube">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="https://tiktok.com/@mandarinflash" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-600 text-gray-500 transition-colors" aria-label="TikTok">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.56a8.24 8.24 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.03Z"/></svg>
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                help@mandarinflash.com
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-8 pt-6 text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} MandarinFlash. Happy learning, and 加油!
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

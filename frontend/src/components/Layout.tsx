import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Brain, Search, MessageCircle, Home, User, LogOut, LogIn, UserPlus, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Vocabulary', href: '/vocabulary', icon: BookOpen },
  { name: 'Flashcards', href: '/flashcards', icon: Brain },
  { name: 'Dictionary', href: '/dictionary', icon: Search },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
]

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">中</span>
                </div>
                <span className="text-xl font-bold text-gradient">Chinese Learning</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-8">
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

              {/* Auth buttons */}
              <div className="flex items-center space-x-2">
                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {user?.username || user?.email}
                      </span>
                    </div>
                    <Link
                      to="/settings"
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
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
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
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
    </div>
  )
} 
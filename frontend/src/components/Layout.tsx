import { ReactNode, useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen, Brain, Search, MessageCircle, User, LogOut, LogIn,
  UserPlus, Settings, BarChart3, ChevronDown, Menu, X,
  GraduationCap, Volume2, BookTemplate, Utensils, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Footer } from '@/components/Footer'

interface LayoutProps {
  children: ReactNode
}

interface NavChild {
  name: string
  href: string
  icon: LucideIcon
  description: string
}

interface NavItem {
  name: string
  icon: LucideIcon
  href?: string
  children?: NavChild[]
  matchPaths?: string[]
}

const navigation: NavItem[] = [
  {
    name: 'Learn',
    icon: GraduationCap,
    href: '/learn',
    matchPaths: ['/learn', '/pinyin', '/lessons'],
    children: [
      { name: 'Pinyin Chart', href: '/pinyin', icon: Volume2, description: 'Interactive pronunciation guide with audio' },
      { name: 'Grammar Lessons', href: '/lessons/grammar', icon: BookTemplate, description: 'Essential Chinese grammar patterns' },
      { name: 'Topic Lessons', href: '/lessons/topics', icon: Utensils, description: 'Vocabulary by category: food, travel, and more' },
    ],
  },
  {
    name: 'HSK',
    icon: BookOpen,
    href: '/hsk',
    matchPaths: ['/hsk', '/vocabulary'],
    children: [
      { name: 'Browse Vocabulary', href: '/vocabulary', icon: BookOpen, description: 'Search and filter all HSK words' },
      { name: 'HSK Flashcards', href: '/flashcards?source=hsk', icon: Brain, description: 'Practice with HSK-level flashcards' },
    ],
  },
  {
    name: 'Practice',
    icon: Brain,
    href: '/practice',
    matchPaths: ['/practice', '/flashcards', '/dictionary', '/chat'],
    children: [
      { name: 'Flashcards', href: '/flashcards', icon: Brain, description: 'Drill vocab with flashcards and quizzes' },
      { name: 'Dictionary', href: '/dictionary', icon: Search, description: 'Search Chinese, pinyin, or English' },
      { name: 'AI Tutor', href: '/chat', icon: MessageCircle, description: 'Practice with an AI conversation partner' },
    ],
  },
  {
    name: 'Progress',
    icon: BarChart3,
    href: '/progress',
  },
]

function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.href && pathname === item.href) return true
  if (item.matchPaths?.some(p => pathname.startsWith(p))) return true
  if (item.children?.some(c => pathname === c.href || pathname.startsWith(c.href?.split('?')[0] ?? ''))) return true
  return false
}

function isChildActive(href: string, pathname: string, search: string): boolean {
  if (href.includes('?')) {
    const [path, query] = href.split('?')
    return pathname === path && search.includes(query)
  }
  return pathname === href || pathname.startsWith(href)
}

function NavDropdown({ item, pathname, search }: { item: NavItem; pathname: string; search: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    setOpen(false)
  }, [pathname, search])

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  const active = isNavActive(item, pathname)

  return (
    <div ref={ref} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link
        to={item.href!}
        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          active
            ? 'text-primary-600 bg-primary-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <item.icon className="w-4 h-4" />
        <span>{item.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Link>

      {open && item.children && (
        <div className="absolute left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {item.children.map((child) => {
            const childActive = isChildActive(child.href, pathname, search)
            return (
              <Link
                key={child.name}
                to={child.href}
                className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${
                  childActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <child.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{child.name}</div>
                  <div className="text-xs text-gray-500 leading-snug">{child.description}</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MobileAccordion({ item, pathname, search }: { item: NavItem; pathname: string; search: string }) {
  const [open, setOpen] = useState(false)

  if (!item.children) {
    const active = item.href ? pathname === item.href : false
    return (
      <Link
        to={item.href!}
        className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
          active
            ? 'text-primary-600 bg-primary-50'
            : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
        }`}
      >
        <item.icon className="w-5 h-5" />
        <span>{item.name}</span>
      </Link>
    )
  }

  const active = isNavActive(item, pathname)

  return (
    <div>
      <div className={`flex items-center rounded-lg text-base font-medium transition-colors ${
        active
          ? 'text-primary-600 bg-primary-50'
          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
      }`}>
        <Link
          to={item.href!}
          className="flex items-center space-x-3 flex-1 px-3 py-3"
        >
          <item.icon className="w-5 h-5" />
          <span>{item.name}</span>
        </Link>
        <button
          onClick={() => setOpen(o => !o)}
          className="px-3 py-3 -mr-0.5"
          aria-label={`Expand ${item.name}`}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
          {item.children.map((child) => {
            const childActive = isChildActive(child.href, pathname, search)
            return (
              <Link
                key={child.name}
                to={child.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  childActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <child.icon className="w-4 h-4 flex-shrink-0" />
                <span>{child.name}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 sm:h-16 gap-4 sm:gap-6">
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-gold font-bold text-sm">闪</span>
              </div>
              <span className="text-xl font-bold text-gradient">MandarinFlash</span>
            </Link>
            
            <div className="flex items-center justify-end flex-1 gap-4">
              <nav className="hidden md:flex items-center space-x-1">
                {navigation.map((item) =>
                  item.children ? (
                    <NavDropdown key={item.name} item={item} pathname={location.pathname} search={location.search} />
                  ) : (
                    <Link
                      key={item.name}
                      to={item.href!}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === item.href
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                )}
              </nav>

              {/* Auth area (desktop) */}
              <div className="hidden md:flex items-center">
                {isAuthenticated ? (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-secondary-100 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-secondary-600" />
                      </div>
                      <span className="max-w-[140px] truncate">
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

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 -mr-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                aria-label="Open menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50" style={{ top: '3.5rem' }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <nav className="relative bg-white w-72 max-w-[85vw] h-full shadow-xl overflow-y-auto animate-slide-in-left">
            <div className="py-3 px-4 space-y-1">
              {navigation.map((item) => (
                <MobileAccordion
                  key={item.name}
                  item={item}
                  pathname={location.pathname}
                  search={location.search}
                />
              ))}
            </div>

            <div className="border-t border-gray-200 py-3 px-4">
              {isAuthenticated ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-sm text-gray-500 truncate">
                    {user?.username || user?.email}
                  </div>
                  <Link
                    to="/settings"
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-5 h-5 text-gray-400" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="w-5 h-5 text-gray-400" />
                    <span>Log out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up Free</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {children}
      </main>

      <Footer />
    </div>
  )
}

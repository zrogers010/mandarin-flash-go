import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { authApi, User } from '@/lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, username?: string) => Promise<void>
  logout: () => void
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (token: string, password: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: () => Promise<void>
  updateProfile: (username?: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'))
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const isAuthenticated = !!user && !!token

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('access_token')
      if (storedToken) {
        try {
          const userData = await authApi.getProfile()
          // Signup/login may have replaced the token while this request was in flight.
          if (localStorage.getItem('access_token') === storedToken) {
            setUser(userData.user)
            setToken(storedToken)
          }
        } catch (error) {
          // Only clear if this is still the token we tried to validate.
          if (localStorage.getItem('access_token') === storedToken) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setToken(null)
          }
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  // If a token appears after the first hydrate (signup → navigate), load the user
  // instead of leaving ProtectedRoute spinning or bouncing to /login.
  useEffect(() => {
    if (isLoading || user) return
    const storedToken = localStorage.getItem('access_token')
    if (!storedToken) return

    let cancelled = false
    authApi
      .getProfile()
      .then((userData) => {
        if (cancelled) return
        setUser(userData.user)
        setToken(storedToken)
      })
      .catch(() => {
        if (cancelled) return
        if (localStorage.getItem('access_token') === storedToken) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setToken(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [isLoading, user])

  const applySession = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    // Commit before the caller navigates so ProtectedRoute sees a session.
    flushSync(() => {
      setToken(accessToken)
      setUser(userData)
    })
  }

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    applySession(response.access_token, response.refresh_token, response.user)
    await mergeGuestProgressIfExists()
  }

  const mergeGuestProgressIfExists = async () => {
    try {
      const { guestStorage } = await import('../lib/guestStorage')
      if (guestStorage.hasProgress()) {
        const guestData = guestStorage.getProgress()
        if (guestData) {
          const { api } = await import('../lib/api')
          await api.post('/auth/merge-guest-progress', { guest_data: guestData })
          guestStorage.clearProgress()
          
          const summary = guestStorage.getSummary()
          if (summary && (summary.quizzes > 0 || summary.words > 0)) {
            console.log(`✅ Progress saved: ${summary.quizzes} quizzes, ${summary.words} words`)
          }
        }
      }
    } catch (error) {
      console.error('Failed to merge guest progress:', error)
      // Don't block login flow if merge fails
    }
  }

  const signup = async (email: string, password: string, username?: string) => {
    const response = await authApi.signup({
      email,
      password,
      username: username || undefined,
    })
    // New accounts return a session so we never depend on a second /auth/login
    // racing ProtectedRoute. Duplicate-email 201s omit tokens (no enumeration).
    if (response.access_token && response.refresh_token && response.user) {
      applySession(response.access_token, response.refresh_token, response.user)
      await mergeGuestProgressIfExists()
      return
    }
    await login(email, password)
  }

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token')
    
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setUser(null)
    
    // Call logout API with refresh token to invalidate the server-side session
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {
        // Ignore errors on logout
      })
    }

    navigate('/', { replace: true })
  }

  const requestPasswordReset = async (email: string) => {
    try {
      await authApi.requestPasswordReset({ email })
    } catch (error) {
      throw error
    }
  }

  const confirmPasswordReset = async (token: string, password: string) => {
    try {
      await authApi.confirmPasswordReset({ token, password })
    } catch (error) {
      throw error
    }
  }

  const verifyEmail = async (token: string) => {
    try {
      await authApi.verifyEmail({ token })
    } catch (error) {
      throw error
    }
  }

  const resendVerification = async () => {
    try {
      await authApi.resendVerification()
    } catch (error) {
      throw error
    }
  }

  const updateProfile = async (username?: string) => {
    try {
      const response = await authApi.updateProfile({
        username,
      })
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await authApi.getProfile()
      setUser(userData.user)
    } catch (error) {
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
    verifyEmail,
    resendVerification,
    updateProfile,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


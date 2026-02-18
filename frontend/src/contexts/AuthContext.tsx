import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

  const isAuthenticated = !!user && !!token

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('access_token')
      if (storedToken) {
        try {
          const userData = await authApi.getProfile()
          setUser(userData.user)
          setToken(storedToken)
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setToken(null)
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      const { access_token, refresh_token, user: userData } = response
      
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      
      setToken(access_token)
      setUser(userData)
    } catch (error) {
      throw error
    }
  }

  const signup = async (email: string, password: string, username?: string) => {
    try {
      await authApi.signup({
        email,
        password,
        username: username || undefined,
      })
      
      // Don't automatically log in after signup - user needs to verify email first
    } catch (error) {
      throw error
    }
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


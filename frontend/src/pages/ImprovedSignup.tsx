import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface PasswordStrength {
  score: number
  feedback: string
  color: string
}

export default function ImprovedSignup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  
  const navigate = useNavigate()
  const { signup } = useAuth()

  // Track signup start for analytics
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'signup_start', {
        event_category: 'engagement',
      })
    }
  }, [])

  // Real-time email validation
  const validateEmail = (value: string): boolean => {
    setEmailError('')
    if (!value) return false
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    return true
  }

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    if (!pwd) {
      return { score: 0, feedback: '', color: 'gray' }
    }

    let score = 0
    const feedback: string[] = []

    // Length check
    if (pwd.length >= 8) score++
    else feedback.push('at least 8 characters')

    // Complexity checks
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    else feedback.push('uppercase and lowercase letters')

    if (/\d/.test(pwd)) score++
    else feedback.push('a number')

    if (/[^a-zA-Z0-9]/.test(pwd)) score++
    else feedback.push('a special character')

    // Determine strength
    let strengthText = ''
    let color = 'gray'
    
    if (score === 0) {
      strengthText = ''
    } else if (score <= 1) {
      strengthText = 'Weak'
      color = 'red'
    } else if (score === 2) {
      strengthText = 'Fair'
      color = 'yellow'
    } else if (score === 3) {
      strengthText = 'Good'
      color = 'blue'
    } else {
      strengthText = 'Strong'
      color = 'green'
    }

    const feedbackText = feedback.length > 0 
      ? `Add ${feedback.join(', ')}`
      : 'Great password!'

    return { score, feedback: strengthText + (feedback.length > 0 ? ` — ${feedbackText}` : ''), color }
  }

  const passwordStrength = calculatePasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')
    setEmailError('')
    setPasswordError('')

    // Validate email
    if (!validateEmail(email)) return

    // Validate password
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      await signup(email, password)
      
      // Track signup completion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'signup_complete', {
          event_category: 'engagement',
        })
      }

      // Redirect to onboarding
      navigate('/onboarding')
    } catch (error: any) {
      setIsLoading(false)
      
      // Handle specific error messages
      const errorMessage = error?.response?.data?.error || error.message || 'An error occurred'
      
      if (errorMessage.toLowerCase().includes('email')) {
        if (errorMessage.toLowerCase().includes('exists') || errorMessage.toLowerCase().includes('already')) {
          setEmailError('This email is already registered. Try logging in instead.')
        } else {
          setEmailError(errorMessage)
        }
      } else if (errorMessage.toLowerCase().includes('password')) {
        setPasswordError(errorMessage)
      } else {
        setGeneralError(errorMessage)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Start Learning Chinese
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join thousands of learners mastering Mandarin
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) validateEmail(e.target.value)
                }}
                onBlur={() => validateEmail(email)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                  emailError 
                    ? 'border-red-300 dark:border-red-700' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                placeholder="you@example.com"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p id="email-error" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <XCircleIcon className="h-4 w-4" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError('')
                  }}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                    passwordError
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Create a strong password"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : 'password-strength'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div id="password-strength" className="mt-2">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.score
                            ? passwordStrength.color === 'red'
                              ? 'bg-red-500'
                              : passwordStrength.color === 'yellow'
                              ? 'bg-yellow-500'
                              : passwordStrength.color === 'blue'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {passwordStrength.feedback}
                  </p>
                </div>
              )}
              
              {passwordError && (
                <p id="password-error" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <XCircleIcon className="h-4 w-4" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password || !!emailError}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Free forever • No credit card required</span>
          </div>
        </div>
      </div>
    </div>
  )
}

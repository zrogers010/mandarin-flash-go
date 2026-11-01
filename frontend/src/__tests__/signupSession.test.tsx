import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { VerifyEmailBanner } from '../components/VerifyEmailBanner'
import { authApi, type User } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      signup: vi.fn(),
      login: vi.fn(),
      getProfile: vi.fn(),
      logout: vi.fn(),
    },
  }
})

const unverifiedUser: User = {
  id: 'user-1',
  email: 'qa@example.com',
  is_verified: false,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function SignupThenOnboarding() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={async () => {
        await signup('qa@example.com', 'StrongPass1!')
        navigate('/onboarding')
      }}
    >
      Create Account
    </button>
  )
}

function AppUnderTest({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignupThenOnboarding />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <div>Onboarding step 1 of 3</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/lessons/:slug" element={<LessonWithBanner />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

function LessonWithBanner() {
  return (
    <div>
      <VerifyEmailBanner />
      <h1>Lesson page</h1>
    </div>
  )
}

describe('signup session → onboarding guard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(authApi.getProfile).mockReset()
    vi.mocked(authApi.signup).mockReset()
    vi.mocked(authApi.login).mockReset()
    vi.mocked(authApi.getProfile).mockRejectedValue(new Error('no session'))
  })

  it('stores the signup session and lets the onboarding guard through', async () => {
    vi.mocked(authApi.signup).mockResolvedValue({
      message: 'User created successfully. Please check your email for verification instructions.',
      access_token: 'access-from-signup',
      refresh_token: 'refresh-from-signup',
      user: unverifiedUser,
      expires_in: 900,
      onboarding_required: true,
    })
    vi.mocked(authApi.getProfile).mockResolvedValue({ user: unverifiedUser })

    const user = userEvent.setup()
    render(<AppUnderTest initialPath="/signup" />)

    await user.click(await screen.findByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Onboarding step 1 of 3')).toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
    expect(localStorage.getItem('access_token')).toBe('access-from-signup')
    expect(localStorage.getItem('refresh_token')).toBe('refresh-from-signup')
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('does not bounce to login when a token is stored before React user state commits', async () => {
    localStorage.setItem('access_token', 'already-there')
    localStorage.setItem('refresh_token', 'already-refresh')
    vi.mocked(authApi.getProfile).mockImplementation((): Promise<{ user: User }> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ user: unverifiedUser }), 30)
      })
    })

    render(<AppUnderTest initialPath="/onboarding" />)

    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
    expect(await screen.findByText('Onboarding step 1 of 3')).toBeInTheDocument()
  })
})

describe('verify banner on lesson pages', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(authApi.getProfile).mockReset()
    localStorage.setItem('access_token', 'lesson-token')
    localStorage.setItem('refresh_token', 'lesson-refresh')
    vi.mocked(authApi.getProfile).mockResolvedValue({ user: unverifiedUser })
  })

  it('shows the verify-email banner on /lessons/:slug', async () => {
    render(<AppUnderTest initialPath="/lessons/greetings-and-introductions" />)

    expect(await screen.findByTestId('verify-email-banner')).toBeInTheDocument()
    expect(screen.getByText('Please verify your email.')).toBeInTheDocument()
    expect(screen.getByText(/we sent a link to qa@example.com/i)).toBeInTheDocument()
    expect(screen.getByText('Lesson page')).toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })
})

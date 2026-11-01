import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../App'
import { ThemeProvider } from '../contexts/ThemeContext'
import { authApi, type User } from '../lib/api'
import { resetAuthSessionMemory, writeSessionTokens } from '../lib/authSession'

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

function renderAppAt(path: string) {
  window.history.pushState({}, '', path)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

async function submitSignupForm() {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText(/email address/i), 'qa@example.com')
  await user.type(screen.getByLabelText(/^password$/i), 'StrongPass1!')
  await user.click(screen.getByRole('button', { name: /create account/i }))
}

function stubBrowserApis() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
  window.scrollTo = () => undefined
}

describe('App signup → onboarding', () => {
  beforeEach(() => {
    stubBrowserApis()
    localStorage.clear()
    sessionStorage.clear()
    resetAuthSessionMemory()
    vi.mocked(authApi.getProfile).mockReset()
    vi.mocked(authApi.signup).mockReset()
    vi.mocked(authApi.login).mockReset()
    vi.mocked(authApi.getProfile).mockRejectedValue(new Error('no session'))
    vi.mocked(authApi.signup).mockResolvedValue({
      message: 'User created successfully. Please check your email for verification instructions.',
      access_token: 'access-from-signup',
      refresh_token: 'refresh-from-signup',
      user: unverifiedUser,
      expires_in: 900,
      onboarding_required: true,
    })
    vi.mocked(authApi.getProfile).mockResolvedValue({ user: unverifiedUser })
  })

  it('renders ImprovedSignup and lands on /onboarding after signup', async () => {
    renderAppAt('/signup')
    expect(screen.getByRole('heading', { name: /start learning chinese/i })).toBeInTheDocument()

    await submitSignupForm()

    expect(await screen.findByText('Step 1 of 3')).toBeInTheDocument()
    expect(screen.getByText(/what's your learning goal/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /sign in to your account/i })).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/onboarding')
    expect(localStorage.getItem('access_token')).toBe('access-from-signup')
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('does not bounce when a second tab clears tokens without an explicit logout', async () => {
    renderAppAt('/signup')
    await submitSignupForm()
    expect(await screen.findByText('Step 1 of 3')).toBeInTheDocument()

    const previous = localStorage.getItem('access_token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'access_token',
        newValue: null,
        oldValue: previous,
      })
    )

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('access-from-signup')
    })
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/onboarding')
    expect(screen.queryByRole('heading', { name: /sign in to your account/i })).not.toBeInTheDocument()
  })

  it('honors an explicit logout storage event from another tab', async () => {
    renderAppAt('/signup')
    await submitSignupForm()
    expect(await screen.findByText('Step 1 of 3')).toBeInTheDocument()

    localStorage.setItem('mf_explicit_logout', '1')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'mf_explicit_logout',
        newValue: '1',
        oldValue: null,
      })
    )
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'access_token',
        newValue: null,
        oldValue: 'access-from-signup',
      })
    )

    expect(await screen.findByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })
})

describe('ProtectedRoute breadcrumb', () => {
  beforeEach(() => {
    stubBrowserApis()
    localStorage.clear()
    sessionStorage.clear()
    resetAuthSessionMemory()
    vi.mocked(authApi.getProfile).mockReset()
    vi.mocked(authApi.getProfile).mockRejectedValue(new Error('no session'))
  })

  it('records flags-only sessionStorage when redirecting to /login', async () => {
    writeSessionTokens('should-not-appear', 'also-secret')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    sessionStorage.removeItem('mf_session_issued')
    resetAuthSessionMemory()

    renderAppAt('/onboarding')

    expect(await screen.findByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument()
    const raw = sessionStorage.getItem('mf_auth_login_bounce') || ''
    expect(raw).toContain('protected_unauthenticated')
    expect(raw).toContain('/onboarding')
    expect(raw).not.toContain('should-not-appear')
    expect(raw).not.toContain('also-secret')
  })
})

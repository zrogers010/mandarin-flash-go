import { describe, it, expect, beforeEach } from 'vitest'
import {
  AUTH_BOUNCE_KEY,
  EXPLICIT_LOGOUT_KEY,
  interpretStorageEvent,
  markExplicitLogout,
  readAccessToken,
  readLoginBreadcrumb,
  resetAuthSessionMemory,
  restoreSessionIfClobbered,
  writeLoginBreadcrumb,
  writeSessionTokens,
} from '../lib/authSession'

describe('authSession cross-tab rules', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    resetAuthSessionMemory()
  })

  it('restores a freshly issued session when another tab clears tokens', () => {
    writeSessionTokens('fresh-access', 'fresh-refresh')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    expect(
      interpretStorageEvent(
        { key: 'access_token', newValue: null, oldValue: 'fresh-access' },
        'fresh-access'
      )
    ).toBe('restore')
    expect(restoreSessionIfClobbered()).toBe(true)
    expect(readAccessToken()).toBe('fresh-access')
  })

  it('logs out only for an explicit logout flag, not a bare storage clear', () => {
    writeSessionTokens('fresh-access', 'fresh-refresh')
    expect(
      interpretStorageEvent(
        { key: 'access_token', newValue: null, oldValue: 'fresh-access' },
        'fresh-access'
      )
    ).toBe('restore')

    markExplicitLogout()
    expect(
      interpretStorageEvent(
        { key: 'access_token', newValue: null, oldValue: 'fresh-access' },
        null
      )
    ).toBe('logout')
    expect(localStorage.getItem(EXPLICIT_LOGOUT_KEY)).toBe('1')
    expect(restoreSessionIfClobbered()).toBe(false)
  })

  it('adopts a different non-empty token from another tab', () => {
    writeSessionTokens('old-access', 'old-refresh')
    expect(
      interpretStorageEvent(
        { key: 'access_token', newValue: 'other-tab-access', oldValue: 'old-access' },
        'old-access'
      )
    ).toBe('adopt')
  })

  it('writes flags-only login breadcrumbs with no token values', () => {
    writeSessionTokens('secret-token', 'secret-refresh')
    writeLoginBreadcrumb({
      reason: 'protected_unauthenticated',
      path: '/onboarding',
      hadStoredToken: true,
      hadContextToken: false,
      hadUser: false,
      isAuthenticated: false,
      isLoading: false,
    })
    const crumb = readLoginBreadcrumb()
    expect(crumb?.reason).toBe('protected_unauthenticated')
    expect(crumb?.path).toBe('/onboarding')
    const raw = sessionStorage.getItem(AUTH_BOUNCE_KEY) || ''
    expect(raw).not.toContain('secret-token')
    expect(raw).not.toContain('secret-refresh')
  })
})

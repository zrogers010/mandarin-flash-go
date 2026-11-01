import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LOGIN_ERROR_MESSAGE, isCredentialAuthRequest } from '../lib/authErrors'
import { isAlreadyVerifiedError, stripAuthTokenFromUrl } from '../lib/stripAuthToken'
import { persistGuestStudySession, guestStorage } from '../lib/guestStorage'
import { analytics } from '../lib/analytics'
import { lessonEyebrow } from '../lib/lessonLabels'

describe('auth credential 401s', () => {
  it('treats login and signup as credential requests, not expired sessions', () => {
    expect(isCredentialAuthRequest('/api/v1/auth/login')).toBe(true)
    expect(isCredentialAuthRequest('/auth/signup')).toBe(true)
    expect(isCredentialAuthRequest('/auth/refresh')).toBe(true)
    expect(isCredentialAuthRequest('/profile')).toBe(false)
    expect(isCredentialAuthRequest('/learn/review')).toBe(false)
  })

  it('uses a non-enumerating login error', () => {
    expect(LOGIN_ERROR_MESSAGE).toBe('Email or password is incorrect')
  })
})

describe('stripAuthTokenFromUrl', () => {
  beforeEach(() => {
    window.__MF_AUTH_TOKEN__ = undefined
    window.history.replaceState({}, '', '/verify-email?token=secret-token&x=1')
  })

  it('removes token from the URL and returns it', () => {
    const token = stripAuthTokenFromUrl()
    expect(token).toBe('secret-token')
    expect(window.location.search).not.toContain('token=')
    expect(window.location.search).toContain('x=1')
  })

  it('recovers a token stashed before replaceState (index.html path)', () => {
    window.history.replaceState({}, '', '/reset-password')
    window.__MF_AUTH_TOKEN__ = 'stashed-token'
    expect(stripAuthTokenFromUrl()).toBe('stashed-token')
    expect(window.__MF_AUTH_TOKEN__).toBeNull()
  })
})

describe('verify-twice success', () => {
  it('treats already-verified API errors as success', () => {
    expect(isAlreadyVerifiedError('Email has already been verified')).toBe(true)
    expect(isAlreadyVerifiedError('Invalid or expired verification token')).toBe(false)
  })
})

describe('guest study persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('records quizzes and seen words for later signup merge', () => {
    persistGuestStudySession({
      quizType: 'scored',
      hskLevel: 1,
      wordIds: ['w1', 'w2'],
      answers: { w1: 'hello' },
      correct: 1,
      total: 2,
    })
    expect(guestStorage.hasProgress()).toBe(true)
    expect(guestStorage.getSummary()).toEqual({ quizzes: 1, words: 2 })
  })
})

describe('analytics', () => {
  it('does not send email as a GA user_id', () => {
    const gtag = vi.fn()
    window.gtag = gtag
    analytics.trackSignupComplete()
    expect(gtag).toHaveBeenCalled()
    const payload = gtag.mock.calls[0][2]
    expect(payload.user_id).toBeUndefined()
  })
})

describe('lesson labels', () => {
  it('turns intro | beginner into a meaningful eyebrow', () => {
    expect(lessonEyebrow('intro', 'beginner')).toBe('Getting started · HSK 1–2')
    expect(lessonEyebrow('grammar', 'beginner')).toBe('Grammar · HSK 1–2')
  })
})

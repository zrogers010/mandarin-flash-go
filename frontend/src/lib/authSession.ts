/** Session token helpers. Never store token values in sessionStorage breadcrumbs. */

export const ACCESS_TOKEN_KEY = 'access_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'
export const SESSION_ISSUED_KEY = 'mf_session_issued'
export const EXPLICIT_LOGOUT_KEY = 'mf_explicit_logout'
export const AUTH_BOUNCE_KEY = 'mf_auth_login_bounce'

let memoryAccessToken: string | null = null
let memoryRefreshToken: string | null = null

function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function lsSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* private mode */
  }
}

function lsRemove(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* private mode */
  }
}

function ssGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function ssSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    /* private mode */
  }
}

function ssRemove(key: string): void {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    /* private mode */
  }
}

export function readAccessToken(): string | null {
  return lsGet(ACCESS_TOKEN_KEY) || memoryAccessToken
}

export function readRefreshToken(): string | null {
  return lsGet(REFRESH_TOKEN_KEY) || memoryRefreshToken
}

export function hasFreshSession(): boolean {
  return ssGet(SESSION_ISSUED_KEY) === '1'
}

export function writeSessionTokens(accessToken: string, refreshToken: string): void {
  memoryAccessToken = accessToken
  memoryRefreshToken = refreshToken
  lsRemove(EXPLICIT_LOGOUT_KEY)
  ssRemove(EXPLICIT_LOGOUT_KEY)
  ssSet(SESSION_ISSUED_KEY, '1')
  lsSet(ACCESS_TOKEN_KEY, accessToken)
  lsSet(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearSessionTokens(): void {
  memoryAccessToken = null
  memoryRefreshToken = null
  lsRemove(ACCESS_TOKEN_KEY)
  lsRemove(REFRESH_TOKEN_KEY)
}

export function markExplicitLogout(): void {
  memoryAccessToken = null
  memoryRefreshToken = null
  ssRemove(SESSION_ISSUED_KEY)
  lsSet(EXPLICIT_LOGOUT_KEY, '1')
  ssSet(EXPLICIT_LOGOUT_KEY, '1')
  lsRemove(ACCESS_TOKEN_KEY)
  lsRemove(REFRESH_TOKEN_KEY)
}

export function isExplicitLogoutMarked(): boolean {
  return lsGet(EXPLICIT_LOGOUT_KEY) === '1' || ssGet(EXPLICIT_LOGOUT_KEY) === '1'
}

/** Restore tokens if another tab clobbered localStorage without an explicit logout. */
export function restoreSessionIfClobbered(): boolean {
  if (isExplicitLogoutMarked()) return false
  if (!hasFreshSession() || !memoryAccessToken) return false
  if (lsGet(ACCESS_TOKEN_KEY)) return false
  lsSet(ACCESS_TOKEN_KEY, memoryAccessToken)
  if (memoryRefreshToken) lsSet(REFRESH_TOKEN_KEY, memoryRefreshToken)
  return true
}

export type LoginBounceBreadcrumb = {
  reason: string
  path: string
  hadStoredToken: boolean
  hadContextToken: boolean
  hadUser: boolean
  isAuthenticated: boolean
  isLoading: boolean
  at: string
}

export function writeLoginBreadcrumb(info: Omit<LoginBounceBreadcrumb, 'at'>): void {
  const payload: LoginBounceBreadcrumb = {
    ...info,
    at: new Date().toISOString(),
  }
  ssSet(AUTH_BOUNCE_KEY, JSON.stringify(payload))
}

export function readLoginBreadcrumb(): LoginBounceBreadcrumb | null {
  const raw = ssGet(AUTH_BOUNCE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as LoginBounceBreadcrumb
  } catch {
    return null
  }
}

/**
 * Cross-tab storage: adopt a different non-empty token; ignore clears unless
 * the other tab marked an explicit logout. Never wipe a freshly issued session.
 */
export function interpretStorageEvent(
  event: Pick<StorageEvent, 'key' | 'newValue' | 'oldValue'>,
  currentToken: string | null
): 'adopt' | 'logout' | 'restore' | 'ignore' {
  if (event.key !== ACCESS_TOKEN_KEY && event.key !== REFRESH_TOKEN_KEY && event.key !== EXPLICIT_LOGOUT_KEY && event.key !== null) {
    return 'ignore'
  }

  if (event.key === EXPLICIT_LOGOUT_KEY && event.newValue === '1') {
    return 'logout'
  }

  if (event.key === ACCESS_TOKEN_KEY && event.newValue && event.newValue !== currentToken) {
    return 'adopt'
  }

  const cleared =
    event.key === null ||
    ((event.key === ACCESS_TOKEN_KEY || event.key === REFRESH_TOKEN_KEY) && !event.newValue)

  if (!cleared) return 'ignore'

  if (isExplicitLogoutMarked()) return 'logout'
  if (hasFreshSession() && memoryAccessToken && memoryAccessToken !== event.newValue) {
    return 'restore'
  }
  return 'ignore'
}

export function resetAuthSessionMemory(): void {
  memoryAccessToken = null
  memoryRefreshToken = null
}

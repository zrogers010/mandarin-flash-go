/** Auth endpoints whose 401 means "bad credentials", not "session expired". */
const CREDENTIAL_PATHS = [
  '/auth/login',
  '/auth/signup',
  '/auth/request-password-reset',
  '/auth/confirm-password-reset',
  '/auth/verify-email',
  '/auth/refresh',
]

export function isCredentialAuthRequest(url?: string): boolean {
  if (!url) return false
  return CREDENTIAL_PATHS.some((path) => url.includes(path))
}

export const LOGIN_ERROR_MESSAGE = 'Email or password is incorrect'

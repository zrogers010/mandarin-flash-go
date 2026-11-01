/**
 * Remove secret tokens from the URL before analytics or third-party
 * requests can observe page_location / document.referrer.
 *
 * Must run as early as possible (inline in index.html) and again in
 * React pages as a safety net. The raw token is stashed on window so
 * the verify/reset pages can still complete after replaceState.
 */
declare global {
  interface Window {
    __MF_AUTH_TOKEN__?: string | null
  }
}

export function takeStashedAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  const stashed = window.__MF_AUTH_TOKEN__ || null
  if (stashed) {
    window.__MF_AUTH_TOKEN__ = null
  }
  return stashed
}

export function stripAuthTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null

  const stashed = takeStashedAuthToken()

  try {
    const url = new URL(window.location.href)
    const fromUrl = url.searchParams.get('token')
    if (fromUrl) {
      url.searchParams.delete('token')
      const search = url.searchParams.toString()
      const cleaned = url.pathname + (search ? `?${search}` : '') + url.hash
      window.history.replaceState(window.history.state, document.title, cleaned)
    }
    return fromUrl || stashed
  } catch {
    return stashed
  }
}

export function isAlreadyVerifiedError(message: string | undefined): boolean {
  if (!message) return false
  const lower = message.toLowerCase()
  return lower.includes('already been verified') || lower.includes('already verified')
}

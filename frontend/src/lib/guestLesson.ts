/** First beginner lesson guests can study without an account. */
export const GUEST_LESSON_SLUG = 'greetings-and-introductions'
export const GUEST_LESSON_PATH = `/lessons/${GUEST_LESSON_SLUG}`

export function nextLessonPath(opts: { isAuthenticated: boolean; wordsDue?: number }): string {
  if (opts.isAuthenticated) {
    if ((opts.wordsDue ?? 0) > 0) return '/review'
    return '/learn'
  }
  return GUEST_LESSON_PATH
}

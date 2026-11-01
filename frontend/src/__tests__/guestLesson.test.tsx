import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GUEST_LESSON_PATH, nextLessonPath } from '../lib/guestLesson'
import { HomeHeroCTAs } from '../components/HomeHeroCTAs'

describe('guest lesson entry', () => {
  it('sends guests to the first beginner lesson', () => {
    expect(GUEST_LESSON_PATH).toBe('/lessons/greetings-and-introductions')
    expect(nextLessonPath({ isAuthenticated: false })).toBe(GUEST_LESSON_PATH)
  })

  it('sends signed-in users to review when words are due, otherwise /learn', () => {
    expect(nextLessonPath({ isAuthenticated: true, wordsDue: 3 })).toBe('/review')
    expect(nextLessonPath({ isAuthenticated: true, wordsDue: 0 })).toBe('/learn')
    expect(nextLessonPath({ isAuthenticated: true })).toBe('/learn')
  })

  it('shows a no-sign-up primary CTA for guests', () => {
    render(
      <MemoryRouter>
        <HomeHeroCTAs isAuthenticated={false} />
      </MemoryRouter>
    )
    const tryLesson = screen.getByRole('link', { name: /try a lesson — no sign-up/i })
    expect(tryLesson).toHaveAttribute('href', GUEST_LESSON_PATH)
    expect(screen.getByRole('link', { name: /sign up free/i })).toHaveAttribute('href', '/signup')
  })

  it('hides the guest try button for signed-in users', () => {
    render(
      <MemoryRouter>
        <HomeHeroCTAs isAuthenticated wordsDue={2} />
      </MemoryRouter>
    )
    expect(screen.queryByRole('link', { name: /try a lesson/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /continue learning/i })).toHaveAttribute('href', '/review')
  })
})

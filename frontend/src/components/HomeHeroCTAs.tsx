import { Link } from 'react-router-dom'
import { IconPlayerPlay, IconArrowRight } from '@tabler/icons-react'
import { GUEST_LESSON_PATH, nextLessonPath } from '@/lib/guestLesson'

interface HomeHeroCTAsProps {
  isAuthenticated: boolean
  wordsDue?: number
}

export function HomeHeroCTAs({ isAuthenticated, wordsDue }: HomeHeroCTAsProps) {
  if (isAuthenticated) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
        <Link
          to={nextLessonPath({ isAuthenticated: true, wordsDue })}
          className="btn-primary text-base px-6 py-3 inline-flex items-center justify-center"
        >
          Continue learning
          <IconArrowRight className="ml-2 w-4 h-4" />
        </Link>
        <Link
          to="/flashcards"
          className="btn-outline text-base px-6 py-3 inline-flex items-center justify-center"
        >
          HSK Flashcards
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
      <Link
        to={GUEST_LESSON_PATH}
        className="btn-primary text-base px-6 py-3 inline-flex items-center justify-center"
      >
        <IconPlayerPlay className="mr-2 w-5 h-5" />
        Try a lesson — no sign-up
      </Link>
      <Link
        to="/signup"
        className="btn-outline text-base px-6 py-3 inline-flex items-center justify-center"
      >
        Sign Up Free
        <IconArrowRight className="ml-2 w-4 h-4" />
      </Link>
    </div>
  )
}

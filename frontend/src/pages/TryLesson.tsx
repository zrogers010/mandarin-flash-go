import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { learningApi } from '@/lib/api'
import { nextLessonPath } from '@/lib/guestLesson'

export function TryLesson() {
  const { isAuthenticated, isLoading } = useAuth()
  const { data, isLoading: statsLoading } = useQuery({
    queryKey: ['learning-stats'],
    queryFn: () => learningApi.getStats(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: false,
  })

  if (isLoading || (isAuthenticated && statsLoading)) {
    return (
      <div className="text-center py-16 text-gray-600">
        Taking you to a lesson…
      </div>
    )
  }

  return (
    <Navigate
      to={nextLessonPath({
        isAuthenticated,
        wordsDue: data?.stats?.words_due_for_review,
      })}
      replace
    />
  )
}

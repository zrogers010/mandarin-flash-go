import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Brain, Volume2, BookOpen, ArrowRight } from 'lucide-react'
import { lessonsApi, type LessonWithVocabulary } from '@/lib/api'
import { speakText } from '@/lib/speech'
import { SEO } from '@/components/SEO'

function formatLessonContent(html: string): string {
  return html.replace(
    /([\u4e00-\u9fff\u3400-\u4dbf]+)\s*(\([^)]+\))/g,
    '<strong class="text-gray-900 font-medium">$1</strong> <span class="text-primary-700 text-xs">$2</span>'
  )
}

export function LessonDetail() {
  const { slug } = useParams<{ slug: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => lessonsApi.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })

  const lesson: LessonWithVocabulary | undefined = data?.lesson

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link to="/lessons" className="btn-outline mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          All Lessons
        </Link>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="space-y-6">
        <Link to="/lessons" className="btn-outline mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          All Lessons
        </Link>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold mb-2">Lesson Not Found</h2>
          <p className="text-gray-600 mb-6">
            This lesson doesn't exist or may have been removed.
          </p>
          <Link to="/lessons" className="btn-primary">
            Browse All Lessons
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <SEO
        title={lesson.title}
        description={lesson.description || `Learn ${lesson.title} in Mandarin Chinese with vocabulary, examples, and interactive flashcards.`}
      />
      {/* Back link */}
      <Link
        to={lesson.category === 'grammar' ? '/lessons/grammar' : '/lessons/topics'}
        className="btn-outline inline-flex"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to {lesson.category === 'grammar' ? 'Grammar' : 'Topic'} Lessons
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="capitalize">{lesson.category}</span>
          {lesson.difficulty && (
            <>
              <span className="text-gray-300">|</span>
              <span className="capitalize">{lesson.difficulty}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-gray-600 text-base leading-relaxed">{lesson.description}</p>
        )}
      </div>

      {/* Lesson Content */}
      {lesson.content && (
        <div className="card lesson-content">
          <div dangerouslySetInnerHTML={{ __html: formatLessonContent(lesson.content) }} />
        </div>
      )}

      {/* Vocabulary List */}
      {lesson.vocabulary && lesson.vocabulary.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              Vocabulary ({lesson.vocabulary.length} words)
            </h2>
            <Link
              to={`/flashcards?lesson=${lesson.slug}`}
              className="btn-primary text-sm py-1.5 px-3"
            >
              <Brain className="w-3.5 h-3.5 mr-1.5" />
              Practice These Words
            </Link>
          </div>

          <div className="grid gap-3">
            {lesson.vocabulary.map((word) => (
              <div
                key={word.id}
                className="card flex items-center gap-4 py-4"
              >
                <button
                  onClick={() => speakText(word.chinese, 'zh')}
                  className="p-2 rounded-full hover:bg-primary-50 transition-colors flex-shrink-0"
                  title="Listen to pronunciation"
                >
                  <Volume2 className="w-4 h-4 text-primary-600" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-medium chinese-text">{word.chinese}</span>
                    <span className="text-sm text-gray-500">{word.pinyin}</span>
                    {word.hsk_level > 0 && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                        HSK {word.hsk_level}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{word.english}</p>
                </div>
                <Link
                  to={`/vocabulary/${word.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex-shrink-0 hidden sm:block"
                >
                  Details
                  <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="card text-center py-8 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Ready to practice?</h3>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Test your knowledge of the words from this lesson with interactive flashcards.
        </p>
        <Link to={`/flashcards?lesson=${lesson.slug}`} className="btn-primary">
          <Brain className="w-4 h-4 mr-2" />
          Practice {lesson.title} Flashcards
        </Link>
      </div>
    </div>
  )
}

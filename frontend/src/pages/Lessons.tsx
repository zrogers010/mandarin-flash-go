import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookTemplate, Utensils, GraduationCap, ArrowRight, Brain } from 'lucide-react'
import { lessonsApi, type Lesson } from '@/lib/api'
import { SEO } from '@/components/SEO'

const categoryMeta: Record<string, { label: string; icon: typeof BookTemplate; color: string }> = {
  grammar: { label: 'Grammar', icon: BookTemplate, color: 'bg-purple-600' },
  food: { label: 'Food', icon: Utensils, color: 'bg-orange-500' },
  travel: { label: 'Travel', icon: GraduationCap, color: 'bg-blue-500' },
  animals: { label: 'Animals', icon: GraduationCap, color: 'bg-green-500' },
  school: { label: 'School', icon: GraduationCap, color: 'bg-yellow-500' },
  intro: { label: 'Getting Started', icon: GraduationCap, color: 'bg-teal-500' },
}

function getCategoryFromPath(pathname: string): string | undefined {
  if (pathname === '/lessons/grammar') return 'grammar'
  if (pathname === '/lessons/topics') return undefined
  return undefined
}

function isTopicsView(pathname: string): boolean {
  return pathname === '/lessons/topics'
}

function isGrammarView(pathname: string): boolean {
  return pathname === '/lessons/grammar'
}

export function Lessons() {
  const location = useLocation()
  const pathCategory = getCategoryFromPath(location.pathname)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(pathCategory)

  useEffect(() => {
    setSelectedCategory(getCategoryFromPath(location.pathname))
  }, [location.pathname])

  const { data: categoriesData } = useQuery({
    queryKey: ['lesson-categories'],
    queryFn: () => lessonsApi.getCategories(),
    staleTime: 10 * 60 * 1000,
  })

  const queryCategory = isGrammarView(location.pathname)
    ? 'grammar'
    : isTopicsView(location.pathname)
      ? selectedCategory && selectedCategory !== 'grammar' ? selectedCategory : undefined
      : selectedCategory

  const { data: lessonsData, isLoading } = useQuery({
    queryKey: ['lessons', queryCategory],
    queryFn: () => lessonsApi.getAll(queryCategory),
    staleTime: 5 * 60 * 1000,
  })

  const filteredLessons = lessonsData?.lessons?.filter((lesson: Lesson) => {
    if (isTopicsView(location.pathname)) {
      if (!selectedCategory) return lesson.category !== 'grammar'
      return lesson.category === selectedCategory
    }
    return true
  }) ?? []

  const categories = categoriesData?.categories ?? []
  const topicCategories = categories.filter((c: string) => c !== 'grammar')

  const title = isGrammarView(location.pathname)
    ? 'Grammar Lessons'
    : isTopicsView(location.pathname)
      ? 'Topic Lessons'
      : 'All Lessons'

  const description = isGrammarView(location.pathname)
    ? 'Master essential Chinese grammar patterns and sentence structures.'
    : isTopicsView(location.pathname)
      ? 'Learn vocabulary organized by real-life topics and categories.'
      : 'Browse all available lessons across grammar and topic categories.'

  return (
    <div className="space-y-8">
      <SEO title={title} description={description} />
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          {description}
        </p>
      </div>

      {/* Category filters (topic view only) */}
      {isTopicsView(location.pathname) && topicCategories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Topics
          </button>
          {topicCategories.map((cat: string) => {
            const meta = categoryMeta[cat]
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? undefined : cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {meta?.label ?? cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            )
          })}
        </div>
      )}

      {/* Navigation tabs (all lessons view) */}
      {!isGrammarView(location.pathname) && !isTopicsView(location.pathname) && (
        <div className="flex justify-center gap-3">
          <Link to="/lessons/grammar" className="btn-outline">
            <BookTemplate className="w-4 h-4 mr-2" />
            Grammar Lessons
          </Link>
          <Link to="/lessons/topics" className="btn-outline">
            <Utensils className="w-4 h-4 mr-2" />
            Topic Lessons
          </Link>
        </div>
      )}

      {/* Lessons Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading lessons...</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2">No Lessons Yet</h2>
          <p className="text-gray-600 mb-6">
            Lessons for this category are coming soon. In the meantime, try our flashcards!
          </p>
          <Link to="/flashcards" className="btn-primary">
            <Brain className="w-4 h-4 mr-2" />
            Practice Flashcards
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredLessons.map((lesson: Lesson) => {
            const meta = categoryMeta[lesson.category]
            return (
              <Link
                key={lesson.id}
                to={`/lessons/${lesson.slug}`}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${meta?.color ?? 'bg-gray-500'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {meta?.icon ? <meta.icon className="w-5 h-5 text-white" /> : <BookTemplate className="w-5 h-5 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                      {lesson.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="capitalize">{meta?.label ?? lesson.category}</span>
                      {lesson.difficulty && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="capitalize">{lesson.difficulty}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {lesson.description && (
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3">
                    {lesson.description}
                  </p>
                )}
                <div className="flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700">
                  Start Lesson
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Volume2, BookTemplate, Utensils, ArrowRight, GraduationCap, Brain } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { lessonsApi, type Lesson } from '@/lib/api'
import { SEO } from '@/components/SEO'

const sections = [
  {
    name: 'Interactive Pinyin Chart',
    description: 'Master Mandarin pronunciation with our audio-enabled chart. Click any of the 400+ syllables to hear native pronunciation across all four tones.',
    icon: Volume2,
    href: '/pinyin',
    color: 'bg-purple-600',
    cta: 'Open Pinyin Chart',
  },
  {
    name: 'Grammar Lessons',
    description: 'Build a solid foundation with structured lessons on essential Chinese grammar patterns, sentence structures, and usage rules.',
    icon: BookTemplate,
    href: '/lessons/grammar',
    color: 'bg-indigo-600',
    cta: 'Browse Grammar',
  },
  {
    name: 'Topic Lessons',
    description: 'Learn vocabulary organized by real-life categories — food, travel, animals, school, and everyday introductions.',
    icon: Utensils,
    href: '/lessons/topics',
    color: 'bg-orange-500',
    cta: 'Browse Topics',
  },
]

export function Learn() {
  const { data: lessonsData } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => lessonsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  })

  const recentLessons = (lessonsData?.lessons ?? []).slice(0, 6)

  return (
    <div className="space-y-10">
      <SEO
        title="Learn Mandarin"
        description="Learn Mandarin Chinese with interactive tools — pinyin pronunciation chart, structured grammar lessons, and topic-based vocabulary."
      />

      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
          <GraduationCap className="w-4 h-4" />
          Learning Resources
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          Learn Mandarin Chinese
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          From pronunciation fundamentals to grammar patterns and real-world vocabulary —
          everything you need to build a strong Mandarin foundation.
        </p>
      </div>

      <div className="grid gap-6">
        {sections.map((section) => (
          <Link
            key={section.name}
            to={section.href}
            className="card hover:shadow-md transition-shadow group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`w-14 h-14 ${section.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <section.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {section.name}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed mt-1">
                  {section.description}
                </p>
              </div>
              <div className="flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700 flex-shrink-0">
                {section.cta}
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {recentLessons.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Featured Lessons</h2>
              <p className="text-gray-500 text-sm mt-1">Jump into a lesson and start learning</p>
            </div>
            <Link to="/lessons" className="text-primary-600 hover:text-primary-700 text-sm font-medium hidden sm:flex items-center gap-1">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentLessons.map((lesson: Lesson) => (
              <Link
                key={lesson.id}
                to={`/lessons/${lesson.slug}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  lesson.category === 'grammar' ? 'bg-indigo-100' : 'bg-orange-100'
                }`}>
                  {lesson.category === 'grammar'
                    ? <BookTemplate className="w-4 h-4 text-indigo-600" />
                    : <Utensils className="w-4 h-4 text-orange-600" />
                  }
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                    {lesson.title}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{lesson.category}</div>
                </div>
              </Link>
            ))}
          </div>
          <div className="sm:hidden mt-4 text-center">
            <Link to="/lessons" className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center gap-1">
              View All Lessons
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      <section className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-5 sm:p-8 text-white text-center space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold">Ready to Practice?</h2>
        <p className="text-primary-100 max-w-xl mx-auto text-sm sm:text-base">
          Reinforce what you've learned with flashcards, quizzes, and AI-powered conversation practice.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <Link to="/flashcards" className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-medium px-5 py-2.5 rounded-lg hover:bg-primary-50 transition-colors text-sm">
            <Brain className="w-4 h-4" />
            Start Flashcards
          </Link>
          <Link to="/practice" className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm">
            All Practice Tools
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

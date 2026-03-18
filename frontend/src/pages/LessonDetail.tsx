import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Brain, Volume2, BookOpen, ArrowRight } from 'lucide-react'
import { lessonsApi, type LessonWithVocabulary } from '@/lib/api'
import { speakText } from '@/lib/speech'
import { SEO } from '@/components/SEO'
import { useMemo, useCallback } from 'react'

interface SentenceData {
  zh: string
  py: string
  en: string
}

interface ContentBlock {
  type: 'html' | 'sentences'
  html?: string
  sentences?: SentenceData[]
}

function parseContentBlocks(html: string): ContentBlock[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild!
  const blocks: ContentBlock[] = []
  let htmlBuf = ''

  for (const node of Array.from(root.childNodes)) {
    const el = node as Element
    if (el.nodeType === Node.ELEMENT_NODE && el.classList?.contains('sentence-list')) {
      if (htmlBuf.trim()) {
        blocks.push({ type: 'html', html: htmlBuf.trim() })
        htmlBuf = ''
      }
      const sentences: SentenceData[] = []
      for (const item of Array.from(el.querySelectorAll('.sentence-item'))) {
        const zh = item.querySelector('.sentence-zh')?.textContent ?? ''
        const py = item.querySelector('.sentence-py')?.textContent ?? ''
        const en = item.querySelector('.sentence-en')?.textContent ?? ''
        if (zh) sentences.push({ zh, py, en })
      }
      if (sentences.length > 0) blocks.push({ type: 'sentences', sentences })
    } else {
      htmlBuf += (el.outerHTML ?? node.textContent ?? '')
    }
  }

  if (htmlBuf.trim()) blocks.push({ type: 'html', html: htmlBuf.trim() })
  return blocks
}

function formatLessonHtml(html: string): string {
  return html.replace(
    /([\u4e00-\u9fff\u3400-\u4dbf]+)\s*(\([^)]+\))/g,
    '<strong class="text-gray-900 font-medium">$1</strong> <span class="text-primary-700 text-xs">$2</span>'
  )
}

function SentenceRow({ sentence }: { sentence: SentenceData }) {
  const handleSpeak = useCallback((text: string, lang: 'zh' | 'en') => {
    speakText(text, lang)
  }, [])

  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-1.5">
        <button
          onClick={() => handleSpeak(sentence.zh, 'zh')}
          className="p-1 rounded-full hover:bg-primary-50 transition-colors flex-shrink-0 mt-0.5"
          title="Listen in Chinese"
        >
          <Volume2 className="w-4 h-4 text-primary-600" />
        </button>
        <p className="text-xl font-medium text-gray-900 my-0" style={{ fontFamily: "'Noto Sans SC', system-ui, sans-serif" }}>
          {sentence.zh}
        </p>
      </div>
      {sentence.py && (
        <p className="text-sm text-primary-600 mt-0.5 mb-0 ml-[30px]">{sentence.py}</p>
      )}
      {sentence.en && (
        <div className="flex items-start gap-1.5 mt-0.5 ml-[30px]">
          <button
            onClick={() => handleSpeak(sentence.en, 'en')}
            className="p-0.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 mt-0.5"
            title="Listen in English"
          >
            <Volume2 className="w-3 h-3 text-gray-400" />
          </button>
          <p className="text-sm text-gray-500 my-0">{sentence.en}</p>
        </div>
      )}
    </div>
  )
}

function LessonContent({ html }: { html: string }) {
  const blocks = useMemo(() => parseContentBlocks(html), [html])
  return (
    <>
      {blocks.map((block, i) =>
        block.type === 'html' ? (
          <div key={i} dangerouslySetInnerHTML={{ __html: formatLessonHtml(block.html!) }} />
        ) : (
          <div key={i} className="flex flex-col">
            {block.sentences!.map((s, j) => (
              <SentenceRow key={j} sentence={s} />
            ))}
          </div>
        )
      )}
    </>
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
          <LessonContent html={lesson.content} />
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

      {/* Bottom CTA - only show when vocabulary is available */}
      {lesson.vocabulary && lesson.vocabulary.length > 0 && (
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
      )}
    </div>
  )
}

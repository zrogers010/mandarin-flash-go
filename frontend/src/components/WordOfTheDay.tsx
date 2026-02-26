import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Volume2, Share2, Sparkles } from 'lucide-react'
import { vocabularyApi, Vocabulary } from '@/lib/api'
import { speakText } from '@/lib/speech'

function getDaySeed(): number {
  const now = new Date()
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
}

function pickWordForDay(words: Vocabulary[]): Vocabulary {
  const seed = getDaySeed()
  return words[seed % words.length]
}

export function WordOfTheDay() {
  const { data, isLoading } = useQuery({
    queryKey: ['word-of-the-day', getDaySeed()],
    queryFn: () => vocabularyApi.getRandom(50),
    staleTime: 1000 * 60 * 60,
  })

  if (isLoading) {
    return (
      <div className="card bg-gradient-to-br from-secondary-50 to-amber-50 border-secondary-200 animate-pulse">
        <div className="h-40" />
      </div>
    )
  }

  const words = data?.vocabulary
  if (!words || words.length === 0) return null

  const word = pickWordForDay(words)
  const sentence = word.example_sentences?.[0]

  const shareText = `Word of the Day: ${word.chinese} (${word.pinyin}) — ${word.english}. Learn more at MandarinFlash!`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'MandarinFlash Word of the Day', text: shareText, url: window.location.origin })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('Copied to clipboard!')
    }
  }

  return (
    <div className="card bg-gradient-to-br from-secondary-50 to-amber-50 border-secondary-200 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary-600" />
          <h2 className="text-lg font-bold text-secondary-800">Word of the Day</h2>
        </div>
        <button
          onClick={handleShare}
          className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600 transition-colors"
          aria-label="Share word"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="text-center space-y-3">
        <Link to={`/vocabulary/${word.id}`} className="group">
          <div className="text-5xl font-bold chinese-text text-gray-900 group-hover:text-primary-600 transition-colors">
            {word.chinese}
          </div>
        </Link>

        <div className="flex items-center justify-center gap-2">
          <span className="text-lg text-gray-600">{word.pinyin}</span>
          <button
            onClick={() => speakText(word.chinese, 'zh')}
            className="p-1.5 rounded-full bg-secondary-100 hover:bg-secondary-200 transition-colors"
            aria-label="Listen to pronunciation"
          >
            <Volume2 className="w-4 h-4 text-secondary-700" />
          </button>
        </div>

        <div className="text-xl font-semibold text-gray-800">{word.english}</div>

        <div className="inline-block bg-secondary-100 text-secondary-800 text-xs font-medium px-2.5 py-1 rounded-full">
          HSK {word.hsk_level}
        </div>

        {sentence && (
          <div className="mt-4 pt-4 border-t border-secondary-200/60 text-left space-y-1.5">
            <div className="flex items-start gap-2">
              <p className="text-sm chinese-text text-gray-800">{sentence.chinese}</p>
              <button
                onClick={() => speakText(sentence.chinese, 'zh')}
                className="flex-shrink-0 p-1 rounded-full hover:bg-secondary-100 transition-colors mt-0.5"
                aria-label="Listen to Chinese sentence"
              >
                <Volume2 className="w-3.5 h-3.5 text-secondary-600" />
              </button>
            </div>
            {sentence.pinyin && (
              <p className="text-xs text-gray-500">{sentence.pinyin}</p>
            )}
            {sentence.english && (
              <div className="flex items-start gap-2">
                <p className="text-sm text-gray-600 italic">{sentence.english}</p>
                <button
                  onClick={() => speakText(sentence.english, 'en')}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors mt-0.5"
                  aria-label="Listen to English"
                >
                  <Volume2 className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

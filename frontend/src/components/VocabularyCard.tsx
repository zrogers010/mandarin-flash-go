import { useState } from 'react'
import { Volume2, BookOpen, Eye, EyeOff } from 'lucide-react'
import { Vocabulary } from '@/lib/api'

interface VocabularyCardProps {
  vocabulary: Vocabulary
  showTranslation?: boolean
  onToggleTranslation?: () => void
  className?: string
}

export function VocabularyCard({ 
  vocabulary, 
  showTranslation = true, 
  onToggleTranslation,
  className = '' 
}: VocabularyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleToggleTranslation = () => {
    if (onToggleTranslation) {
      onToggleTranslation()
    } else {
      setIsFlipped(!isFlipped)
    }
  }

  const shouldShowTranslation = onToggleTranslation ? showTranslation : !isFlipped

  return (
    <div className={`card group hover:shadow-lg transition-all duration-300 ${className}`}>
      {/* Chinese Character */}
      <div className="text-center mb-4">
        <div className="text-4xl md:text-5xl font-bold chinese-text text-gray-900 mb-2">
          {vocabulary.chinese}
        </div>
        
        {/* Pinyin */}
        <div className="text-lg text-gray-600 mb-1">
          {vocabulary.pinyin}
        </div>
        
        {/* HSK Level Badge */}
        <div className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
          {vocabulary.hsk_level === 0 ? 'Beginner' : `HSK ${vocabulary.hsk_level}`}
        </div>
      </div>

      {/* Translation Toggle */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handleToggleTranslation}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          {shouldShowTranslation ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>Hide Translation</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>Show Translation</span>
            </>
          )}
        </button>
      </div>

      {/* English Translation */}
      {shouldShowTranslation && (
        <div className="text-center mb-4">
          <div className="text-xl font-semibold text-gray-900">
            {vocabulary.english}
          </div>
        </div>
      )}

      {/* Example Sentences */}
      {shouldShowTranslation && vocabulary.example_sentences && vocabulary.example_sentences.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-2 mb-2">
            <BookOpen className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Example Sentence</span>
          </div>
          {vocabulary.example_sentences.map((sentence, index) => (
            <div key={index} className="mb-3 last:mb-0">
              {/* Chinese */}
              <div className="text-sm chinese-text text-gray-900 leading-relaxed mb-1">
                {sentence.chinese}
              </div>
              {/* Pinyin */}
              {sentence.pinyin && (
                <div className="text-xs text-gray-500 mb-1">
                  {sentence.pinyin}
                </div>
              )}
              {/* English */}
              {sentence.english && (
                <div className="text-xs text-gray-600 italic">
                  {sentence.english}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audio Button (placeholder for future implementation) */}
      <div className="flex justify-center mt-4">
        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <Volume2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  )
} 
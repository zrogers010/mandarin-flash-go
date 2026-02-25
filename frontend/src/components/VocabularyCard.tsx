import { useNavigate } from 'react-router-dom'
import { Volume2, ArrowRight } from 'lucide-react'
import { Vocabulary } from '@/lib/api'
import { speakText } from '@/lib/speech'
import { primaryDefinition } from '@/lib/definitions'

interface VocabularyCardProps {
  vocabulary: Vocabulary
  className?: string
}

export function VocabularyCard({ 
  vocabulary, 
  className = '' 
}: VocabularyCardProps) {
  const navigate = useNavigate()

  return (
    <div 
      className={`card !p-3 sm:!p-6 group hover:shadow-lg sm:hover:scale-[1.02] transition-all duration-300 cursor-pointer active:bg-gray-50 ${className}`}
      onClick={() => navigate(`/vocabulary/${vocabulary.id}`)}
    >
      {/* Chinese Character */}
      <div className="text-center mb-2 sm:mb-3 relative">
        <div className="text-2xl sm:text-3xl md:text-4xl font-bold chinese-text text-gray-900 mb-1 sm:mb-2">
          {vocabulary.chinese}
        </div>
        
        {/* Click indicator */}
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center space-x-1">
          <span className="text-xs text-gray-400 font-medium">Learn more</span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Pinyin with Audio Button */}
        <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
          <div className="text-xs sm:text-base text-gray-600 truncate">
            {vocabulary.pinyin}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              speakText(vocabulary.chinese, 'zh')
            }}
            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0"
            aria-label="Listen to pronunciation"
          >
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
          </button>
        </div>
        
        {/* HSK Level Badge */}
        <div className="inline-block bg-primary-100 text-primary-800 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
          {vocabulary.hsk_level === 0 ? 'Beginner' : `HSK ${vocabulary.hsk_level}`}
        </div>
      </div>

      {/* English Translation */}
      <div className="text-center">
        <div className="text-sm sm:text-lg font-semibold text-gray-900 line-clamp-2">
          {primaryDefinition(vocabulary.english)}
        </div>
      </div>
    </div>
  )
} 
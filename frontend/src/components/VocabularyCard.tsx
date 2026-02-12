import { useNavigate } from 'react-router-dom'
import { Volume2, ArrowRight } from 'lucide-react'
import { Vocabulary } from '@/lib/api'

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
      className={`card group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer ${className}`}
      onClick={() => navigate(`/vocabulary/${vocabulary.id}`)}
    >
      {/* Chinese Character */}
      <div className="text-center mb-3 relative">
        <div className="text-3xl md:text-4xl font-bold chinese-text text-gray-900 mb-2">
          {vocabulary.chinese}
        </div>
        
        {/* Click indicator */}
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
          <span className="text-xs text-gray-400 font-medium">Learn more</span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Pinyin with Audio Button */}
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="text-base text-gray-600">
            {vocabulary.pinyin}
          </div>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Volume2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        {/* HSK Level Badge */}
        <div className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
          {vocabulary.hsk_level === 0 ? 'Beginner' : `HSK ${vocabulary.hsk_level}`}
        </div>
      </div>

      {/* English Translation */}
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-900">
          {vocabulary.english}
        </div>
      </div>
    </div>
  )
} 
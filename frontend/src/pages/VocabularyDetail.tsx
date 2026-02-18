import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Volume2, BookOpen, Target, ExternalLink } from 'lucide-react'
import { vocabularyApi } from '@/lib/api'

export function VocabularyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    data: vocabulary,
    isLoading,
    error
  } = useQuery({
    queryKey: ['vocabulary', id],
    queryFn: () => vocabularyApi.getById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vocabulary...</p>
        </div>
      </div>
    )
  }

  if (error || !vocabulary) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Vocabulary Not Found</h2>
          <p className="text-gray-600 mb-4">The vocabulary word you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/vocabulary')}
            className="btn-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vocabulary
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/vocabulary')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vocabulary</span>
        </button>
      </div>

      {/* Main Vocabulary Card */}
      <div className="card">
        <div className="text-center mb-8">
          {/* Chinese Character */}
          <div className="text-6xl md:text-8xl font-bold chinese-text text-gray-900 mb-4">
            {vocabulary.chinese}
          </div>
          
          {/* Pinyin */}
          <div className="text-2xl text-gray-600 mb-3">
            {vocabulary.pinyin}
          </div>
          
          {/* HSK Level */}
          <div className="bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full">
            HSK {vocabulary.hsk_level}
          </div>

          {/* English Translation */}
          <div className="text-3xl font-semibold text-gray-900 mb-4">
            {vocabulary.english}
          </div>


        </div>

        {/* Audio Button */}
        <div className="flex justify-center mb-8">
          <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-primary-100 hover:bg-primary-200 transition-colors">
            <Volume2 className="w-5 h-5 text-primary-600" />
            <span className="text-primary-700 font-medium">Listen to Pronunciation</span>
          </button>
        </div>
      </div>

      {/* Example Sentences */}
      {vocabulary.example_sentences && vocabulary.example_sentences.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <BookOpen className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Example Sentences</h2>
          </div>
          
          <div className="space-y-6">
            {vocabulary.example_sentences.map((sentence, index) => (
              <div key={index} className="border-l-4 border-primary-200 pl-6 py-4">
                {/* Chinese */}
                <div className="text-lg chinese-text text-gray-900 leading-relaxed mb-2">
                  {sentence.chinese}
                </div>
                
                {/* Pinyin */}
                {sentence.pinyin && (
                  <div className="text-base text-gray-600 mb-2">
                    {sentence.pinyin}
                  </div>
                )}
                
                {/* English */}
                {sentence.english && (
                  <div className="text-base text-gray-700 italic">
                    {sentence.english}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Target className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">Study Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">HSK Level</h3>
            <p className="text-gray-600">
              {vocabulary.hsk_level === 0 ? 'Beginner Level' : `HSK Level ${vocabulary.hsk_level}`}
            </p>
          </div>
          

          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Added to Database</h3>
            <p className="text-gray-600">
              {new Date(vocabulary.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Updated</h3>
            <p className="text-gray-600">
              {new Date(vocabulary.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Practice Actions */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Practice This Word</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/flashcards')}
            className="flex items-center justify-center space-x-2 p-4 rounded-lg bg-primary-100 hover:bg-primary-200 transition-colors"
          >
            <Target className="w-5 h-5 text-primary-600" />
            <span className="text-primary-700 font-medium">Take a Quiz</span>
          </button>
          
          <button 
            onClick={() => navigate('/dictionary')}
            className="flex items-center justify-center space-x-2 p-4 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ExternalLink className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">Look Up Related Words</span>
          </button>
        </div>
      </div>
    </div>
  )
} 
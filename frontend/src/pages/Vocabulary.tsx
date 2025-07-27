import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, BookOpen, Target, Zap } from 'lucide-react'
import { vocabularyApi, VocabularyFilters } from '@/lib/api'
import { VocabularyCard } from '@/components/VocabularyCard'
import { VocabularyFilters as VocabularyFiltersComponent } from '@/components/VocabularyFilters'

export function Vocabulary() {
  const [filters, setFilters] = useState<VocabularyFilters>({})
  const [showTranslations, setShowTranslations] = useState(true)

  // Fetch vocabulary data
  const {
    data: vocabularyData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['vocabulary', filters],
    queryFn: () => vocabularyApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch random vocabulary for practice
  const {
    data: randomData,
    refetch: refetchRandom
  } = useQuery({
    queryKey: ['vocabulary-random'],
    queryFn: () => vocabularyApi.getRandom(5),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const handleFiltersChange = (newFilters: { hsk_level?: number; search?: string }) => {
    setFilters(newFilters)
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleRefreshRandom = () => {
    refetchRandom()
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Vocabulary Practice</h1>
          <p className="text-gray-600">Master HSK levels 1-6 with definitions, pinyin, tones, and example sentences.</p>
        </div>
        
        <div className="card">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Vocabulary</h2>
            <p className="text-gray-600 mb-4">Failed to load vocabulary data. Please try again.</p>
            <button onClick={handleRefresh} className="btn-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Vocabulary Practice</h1>
        <p className="text-gray-600">Master HSK levels 1-6 with definitions, pinyin, tones, and example sentences.</p>
      </div>

      {/* Quick Practice Section */}
      {randomData && randomData.vocabulary.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <h2 className="text-xl font-semibold">Quick Practice</h2>
            </div>
            <button
              onClick={handleRefreshRandom}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New Words</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {randomData.vocabulary.map((vocab) => (
              <VocabularyCard
                key={vocab.id}
                vocabulary={vocab}
                showTranslation={showTranslations}
                className="h-full"
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <VocabularyFiltersComponent onFiltersChange={handleFiltersChange} />
      </div>

      {/* Translation Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-primary-600" />
          <span className="font-medium">Practice Mode</span>
        </div>
        <button
          onClick={() => setShowTranslations(!showTranslations)}
          className="btn-outline"
        >
          {showTranslations ? 'Hide' : 'Show'} Translations
        </button>
      </div>

      {/* Vocabulary List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="card">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading vocabulary...</p>
            </div>
          </div>
        ) : vocabularyData && vocabularyData.vocabulary.length > 0 ? (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-600">
                  Showing {vocabularyData.vocabulary.length} of {vocabularyData.total} words
                </span>
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Vocabulary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vocabularyData.vocabulary.map((vocab) => (
                <VocabularyCard
                  key={vocab.id}
                  vocabulary={vocab}
                  showTranslation={showTranslations}
                  className="h-full"
                />
              ))}
            </div>

            {/* Pagination */}
            {vocabularyData.total > vocabularyData.limit && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Page {vocabularyData.page} of {Math.ceil(vocabularyData.total / vocabularyData.limit)}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-xl font-semibold mb-2">No Vocabulary Found</h2>
              <p className="text-gray-600">Try adjusting your filters or search terms.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
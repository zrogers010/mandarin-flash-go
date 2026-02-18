import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { vocabularyApi, VocabularyFilters } from '@/lib/api'
import { VocabularyCard } from '@/components/VocabularyCard'
import { Pagination } from '@/components/Pagination'

export function Vocabulary() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<VocabularyFilters>({ 
    limit: 50, 
    sort_by: 'pinyin', 
    sort_order: 'asc' 
  })
  const [search, setSearch] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined)

  // Initialize filters from URL parameters
  useEffect(() => {
    const hskLevel = searchParams.get('hsk_level')
    if (hskLevel) {
      const level = parseInt(hskLevel)
      if (!isNaN(level) && level >= 1 && level <= 6) {
        setSelectedLevel(level)
        setFilters(prev => ({ ...prev, hsk_level: level, page: 1 }))
      }
    }
  }, [searchParams])

  // Fetch vocabulary data
  const {
    data: vocabularyData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['vocabulary', filters],
    queryFn: () => vocabularyApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))
  }, [])

  const handleLevelChange = useCallback((level: number | undefined) => {
    setSelectedLevel(level)
    setFilters(prev => ({ ...prev, hsk_level: level, page: 1 }))
    
    // Update URL parameters
    if (level) {
      setSearchParams({ hsk_level: level.toString() })
    } else {
      setSearchParams({})
    }
  }, [setSearchParams])

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Vocabulary Practice</h1>
          <p className="text-gray-600">Master Mandarin Chinese HSK levels 1-6 with definitions, pinyin, tones, and example sentences.</p>
        </div>
        
        <div className="card">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Vocabulary</h2>
            <p className="text-gray-600 mb-4">Failed to load vocabulary data. Please try again.</p>
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
        <p className="text-gray-600">Master Mandarin Chinese HSK levels 1-6 with definitions, pinyin, tones, and example sentences.</p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search vocabulary..."
              value={search}
              onChange={handleSearchChange}
              className="input-field pl-10 pr-4"
            />
          </div>

          {/* HSK Level Filters */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">HSK Level</div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(selectedLevel === level ? undefined : level)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedLevel === level
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  HSK {level}
                </button>
              ))}
            </div>
          </div>

          {/* Sorting Controls */}
          <div className="flex flex-wrap gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Sort By</div>
              <select
                value={filters.sort_by || 'pinyin'}
                onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value, page: 1 }))}
                className="input-field"
              >
                <option value="pinyin">Pinyin</option>
                <option value="chinese">Chinese</option>
                <option value="english">English</option>
                <option value="hsk_level">HSK Level</option>
                <option value="created_at">Date Added</option>
              </select>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Order</div>
              <select
                value={filters.sort_order || 'asc'}
                onChange={(e) => setFilters(prev => ({ ...prev, sort_order: e.target.value as 'asc' | 'desc', page: 1 }))}
                className="input-field"
              >
                <option value="asc">Ascending (A→Z)</option>
                <option value="desc">Descending (Z→A)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Top Pagination */}
      {vocabularyData && vocabularyData.total > vocabularyData.limit && (
        <div className="mb-6">
          <Pagination
            currentPage={vocabularyData.page}
            totalPages={Math.ceil(vocabularyData.total / vocabularyData.limit)}
            onPageChange={handlePageChange}
            totalItems={vocabularyData.total}
            itemsPerPage={vocabularyData.limit}
          />
        </div>
      )}

      {/* Vocabulary List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="card">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading vocabulary...</p>
            </div>
          </div>
        ) : vocabularyData && vocabularyData.vocabulary && vocabularyData.vocabulary.length > 0 ? (
          <>


            {/* Vocabulary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vocabularyData.vocabulary?.map((vocab) => (
                <VocabularyCard
                  key={vocab.id}
                  vocabulary={vocab}
                  className="h-full"
                />
              ))}
            </div>

            {/* Pagination */}
            {vocabularyData.total > vocabularyData.limit && (
              <div className="mt-8">
                <Pagination
                  currentPage={vocabularyData.page}
                  totalPages={Math.ceil(vocabularyData.total / vocabularyData.limit)}
                  onPageChange={handlePageChange}
                  totalItems={vocabularyData.total}
                  itemsPerPage={vocabularyData.limit}
                />
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
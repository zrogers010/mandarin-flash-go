import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react'
import { vocabularyApi, VocabularyFilters } from '@/lib/api'
import { Pagination } from '@/components/Pagination'

type SortField = 'chinese' | 'pinyin' | 'english' | 'hsk_level'
type SortDirection = 'asc' | 'desc'

export function Dictionary() {
  const [filters, setFilters] = useState<VocabularyFilters>({ limit: 50 })
  const [search, setSearch] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined)
  const [sortField, setSortField] = useState<SortField>('chinese')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const navigate = useNavigate()

  // Fetch vocabulary data
  const {
    data: vocabularyData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['dictionary', filters],
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
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-primary-600" />
      : <ChevronDown className="w-4 h-4 text-primary-600" />
  }

  const sortedVocabulary = vocabularyData?.vocabulary ? [...vocabularyData.vocabulary].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortField) {
      case 'chinese':
        aValue = a.chinese
        bValue = b.chinese
        break
      case 'pinyin':
        aValue = a.pinyin
        bValue = b.pinyin
        break
      case 'english':
        aValue = a.english
        bValue = b.english
        break
      case 'hsk_level':
        aValue = a.hsk_level
        bValue = b.hsk_level
        break
      default:
        return 0
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    } else {
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    }
  }) : []

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dictionary Lookup</h1>
          <p className="text-gray-600">Search any HSK word and find definitions with sample sentences.</p>
        </div>
        
        <div className="card">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Dictionary</h2>
            <p className="text-gray-600 mb-4">Failed to load dictionary data. Please try again.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Dictionary Lookup</h1>
        <p className="text-gray-600">Search any HSK word and find definitions with sample sentences.</p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search dictionary..."
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
              <p className="text-gray-600">Loading dictionary...</p>
            </div>
          </div>
        ) : vocabularyData && vocabularyData.vocabulary && vocabularyData.vocabulary.length > 0 ? (
          <>


            {/* Vocabulary Table */}
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th 
                        className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleSort('chinese')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Chinese</span>
                          {getSortIcon('chinese')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleSort('pinyin')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Pinyin</span>
                          {getSortIcon('pinyin')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleSort('english')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>English</span>
                          {getSortIcon('english')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleSort('hsk_level')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>HSK Level</span>
                          {getSortIcon('hsk_level')}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVocabulary.map((vocab) => (
                      <tr 
                        key={vocab.id} 
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/vocabulary/${vocab.id}`)}
                      >
                        <td className="py-3 px-4">
                          <div className="text-lg chinese-text font-medium text-gray-900">
                            {vocab.chinese}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">{vocab.pinyin}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-900">{vocab.english}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                            HSK {vocab.hsk_level}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <h2 className="text-xl font-semibold mb-2">No Words Found</h2>
              <p className="text-gray-600">Try adjusting your filters or search terms.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
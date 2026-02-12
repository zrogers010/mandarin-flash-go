import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, X } from 'lucide-react'

interface VocabularyFiltersProps {
  onFiltersChange: (filters: { hsk_level?: number; search?: string; limit?: number }) => void
  className?: string
}

export function VocabularyFilters({ onFiltersChange, className = '' }: VocabularyFiltersProps) {
  const [search, setSearch] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined)
  const [selectedLimit, setSelectedLimit] = useState(50)
  const [isExpanded, setIsExpanded] = useState(false)

  const hskLevels = [1, 2, 3, 4, 5, 6]

  const updateFilters = useCallback(() => {
    const filters: { hsk_level?: number; search?: string; limit?: number } = {}
    if (selectedLevel) filters.hsk_level = selectedLevel
    if (search.trim()) filters.search = search.trim()
    filters.limit = selectedLimit
    onFiltersChange(filters)
  }, [selectedLevel, search, selectedLimit, onFiltersChange])

  useEffect(() => {
    updateFilters()
  }, [updateFilters])

  const clearFilters = () => {
    setSearch('')
    setSelectedLevel(undefined)
  }

  const hasActiveFilters = search.trim() || selectedLevel

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search vocabulary..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10 pr-4"
        />
      </div>

      {/* Filters Section */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* HSK Level Filters */}
      {isExpanded && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">HSK Level</div>
          <div className="flex flex-wrap gap-2">
            {hskLevels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(selectedLevel === level ? undefined : level)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedLevel === level
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {`HSK ${level}`}
              </button>
            ))}
          </div>
          
          <div className="text-sm font-medium text-gray-700">Words per page</div>
          <div className="flex flex-wrap gap-2">
            {[25, 50, 100].map((limit) => (
              <button
                key={limit}
                onClick={() => setSelectedLimit(limit)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedLimit === limit
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {limit}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {search.trim() && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              Search: "{search.trim()}"
            </span>
          )}
          {selectedLevel !== undefined && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              {selectedLevel === 0 ? 'Beginner' : `HSK ${selectedLevel}`}
            </span>
          )}
        </div>
      )}
    </div>
  )
} 
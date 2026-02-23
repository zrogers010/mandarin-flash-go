import { useState, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, BookOpen } from 'lucide-react'
import { dictionaryApi } from '@/lib/api'
import { Pagination } from '@/components/Pagination'
import { shortDefinition } from '@/lib/definitions'

export function Dictionary() {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [page, setPage] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const limit = 30

  const {
    data: searchData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['dictionary-search', submittedQuery, page],
    queryFn: () => dictionaryApi.search(submittedQuery, undefined, page, limit),
    enabled: submittedQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      setSubmittedQuery(trimmed)
      setPage(1)
    }
  }, [query])

  const handlePageChange = useCallback((p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const hasResults = searchData && searchData.results && searchData.results.length > 0
  const showEmpty = submittedQuery && !isLoading && !hasResults

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chinese Dictionary</h1>
        <p className="text-gray-600">
          Search over 120,000 Chinese words by characters, pinyin, or English meaning.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="card">
        <div className="relative flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type Chinese characters, pinyin, or English..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-10 pr-4"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="btn-primary px-6 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>
        {submittedQuery && searchData && (
          <div className="mt-3 text-sm text-gray-500">
            {searchData.total.toLocaleString()} result{searchData.total !== 1 ? 's' : ''} for "{submittedQuery}"
          </div>
        )}
      </form>

      {/* Loading */}
      {(isLoading || isFetching) && submittedQuery && (
        <div className="card">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {hasResults && !isLoading && (
        <>
          {/* Top Pagination */}
          {searchData.total > limit && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(searchData.total / limit)}
              onPageChange={handlePageChange}
              totalItems={searchData.total}
              itemsPerPage={limit}
            />
          )}

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Chinese</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Pinyin</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">English</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Level</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {searchData.results.map((word) => (
                    <tr
                      key={word.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/vocabulary/${word.id}`)}
                    >
                      <td className="py-3 px-4">
                        <span className="text-lg chinese-text font-medium text-gray-900">
                          {word.chinese}
                        </span>
                        {word.traditional && word.traditional !== word.chinese && (
                          <span className="ml-2 text-sm text-gray-400">({word.traditional})</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{word.pinyin}</td>
                      <td className="py-3 px-4 text-gray-900">{shortDefinition(word.english, 4)}</td>
                      <td className="py-3 px-4">
                        {word.hsk_level > 0 ? (
                          <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                            HSK {word.hsk_level}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">--</span>
                        )}
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

          {/* Bottom Pagination */}
          {searchData.total > limit && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(searchData.total / limit)}
              onPageChange={handlePageChange}
              totalItems={searchData.total}
              itemsPerPage={limit}
            />
          )}
        </>
      )}

      {/* Empty state */}
      {showEmpty && (
        <div className="card">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
            <p className="text-gray-600 mb-1">
              No words matched "{submittedQuery}".
            </p>
            <p className="text-sm text-gray-500">
              Try different characters, pinyin spelling, or an English keyword.
            </p>
          </div>
        </div>
      )}

      {/* Initial state — no search yet */}
      {!submittedQuery && (
        <div className="card">
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-primary-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Look Up Any Chinese Word
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Search by Chinese characters (你好), pinyin (nǐ hǎo), or English meaning (hello).
              HSK-tagged words include example sentences.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['你好', 'love', 'chī', '学习', 'beautiful', 'péngyou'].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setQuery(example)
                    setSubmittedQuery(example)
                    setPage(1)
                    inputRef.current?.focus()
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

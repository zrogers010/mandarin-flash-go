import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080'

// Create axios instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface ExampleSentence {
  chinese: string
  pinyin: string
  english: string
}

export interface Vocabulary {
  id: string
  chinese: string
  pinyin: string
  english: string
  hsk_level: number
  tone_marks?: string
  example_sentences: ExampleSentence[]
  created_at: string
  updated_at: string
}

export interface VocabularyListResponse {
  vocabulary: Vocabulary[]
  total: number
  page: number
  limit: number
}

export interface VocabularyFilters {
  hsk_level?: number
  search?: string
  page?: number
  limit?: number
}

// API functions
export const vocabularyApi = {
  // Get all vocabulary with filters
  getAll: async (filters: VocabularyFilters = {}): Promise<VocabularyListResponse> => {
    const params = new URLSearchParams()
    if (filters.hsk_level) params.append('hsk_level', filters.hsk_level.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/vocabulary/?${params.toString()}`)
    return response.data
  },

  // Get vocabulary by ID
  getById: async (id: string): Promise<Vocabulary> => {
    const response = await api.get(`/vocabulary/${id}`)
    return response.data
  },

  // Get vocabulary by HSK level
  getByHSKLevel: async (level: number): Promise<{ hsk_level: number; vocabulary: Vocabulary[]; count: number }> => {
    const response = await api.get(`/vocabulary/hsk/${level}`)
    return response.data
  },

  // Get random vocabulary
  getRandom: async (limit: number = 10, hskLevel?: number): Promise<{ vocabulary: Vocabulary[]; count: number; limit: number; hsk_level?: number }> => {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    if (hskLevel) params.append('hsk_level', hskLevel.toString())

    const response = await api.get(`/vocabulary/random?${params.toString()}`)
    return response.data
  },
}

// Quiz API
export const quizApi = {
	// Generate a new quiz
	generate: async (type: 'practice' | 'scored', hskLevel?: number, count?: number): Promise<any> => {
		const response = await api.post('/quiz/generate', {
			type,
			hsk_level: hskLevel,
			count: count || 10,
		})
		return response.data
	},

	// Submit quiz answers
	submit: async (quizId: string, answers: Record<string, string>, completed: boolean): Promise<any> => {
		const response = await api.post('/quiz/submit', {
			quiz_id: quizId,
			answers,
			completed,
		})
		return response.data
	},

	// Get quiz history
	getHistory: async (): Promise<any> => {
		const response = await api.get('/quiz/history')
		return response.data
	},
}

// Health check
export const healthApi = {
	check: async (): Promise<{ status: string; service: string; version: string }> => {
		const response = await api.get('/health')
		return response.data
	},
} 
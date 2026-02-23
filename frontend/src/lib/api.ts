import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || ''

// Create axios instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          })
          
          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, only redirect if we're not on a public route
        // Public routes: vocabulary, dictionary, quiz/generate, quiz/submit
        const url = originalRequest.url || ''
        const isPublicRoute = url.includes('/vocabulary') || 
                             url.includes('/dictionary') || 
                             url.includes('/quiz/generate') || 
                             url.includes('/quiz/submit') ||
                             url.includes('/health')
        
        if (!isPublicRoute) {
          // Only redirect to login for protected routes
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

// Types
export interface ExampleSentence {
  chinese: string
  pinyin: string
  english: string
}

export interface Vocabulary {
  id: string
  chinese: string
  traditional?: string
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
  sort_by?: string
  sort_order?: 'asc' | 'desc'
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
    if (filters.sort_by) params.append('sort_by', filters.sort_by)
    if (filters.sort_order) params.append('sort_order', filters.sort_order)

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

// Quiz types
export interface CardResult {
	card_id: string
	user_answer: string
	correct_answer: string
	is_correct: boolean
}

export interface CardResultDetail {
	card_id: string
	chinese: string
	pinyin: string
	user_answer: string
	correct_answer: string
	is_correct: boolean
}

export interface QuizHistoryItem {
	id: string
	type: 'practice' | 'scored'
	total: number
	correct: number
	score: number
	percentage: number
	hsk_level?: number
	card_results?: CardResult[]
	created_at: string
	completed_at: string
}

export interface QuizDetail {
	id: string
	type: 'practice' | 'scored'
	total: number
	correct: number
	score: number
	percentage: number
	hsk_level?: number
	card_results: CardResultDetail[]
	created_at: string
	completed_at: string
}

export interface QuizStats {
	total_quizzes: number
	total_questions: number
	total_correct: number
	average_score: number
	best_score: number
	current_streak: number
	quizzes_this_week: number
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
	submit: async (
		quizId: string,
		answers: Record<string, string>,
		completed: boolean,
		quizType: 'practice' | 'scored',
		hskLevel?: number
	): Promise<any> => {
		const response = await api.post('/quiz/submit', {
			quiz_id: quizId,
			quiz_type: quizType,
			hsk_level: hskLevel,
			answers,
			completed,
		})
		return response.data
	},

	// Get quiz history
	getHistory: async (page?: number, limit?: number): Promise<{
		history: QuizHistoryItem[]
		total: number
		page: number
		limit: number
	}> => {
		const params = new URLSearchParams()
		if (page) params.append('page', page.toString())
		if (limit) params.append('limit', limit.toString())
		const response = await api.get(`/quiz/history?${params.toString()}`)
		return response.data
	},

	// Get quiz detail with enriched vocabulary
	getDetail: async (quizId: string): Promise<QuizDetail> => {
		const response = await api.get(`/quiz/${quizId}`)
		return response.data
	},

	// Get quiz stats
	getStats: async (): Promise<{ stats: QuizStats }> => {
		const response = await api.get('/quiz/stats')
		return response.data
	},
}

// Chat API
export interface ChatMessage {
	id: string
	conversation_id: string
	role: 'user' | 'assistant' | 'system'
	content: string
	created_at: string
}

export interface ChatConversation {
	id: string
	last_message: string
	message_count: number
	created_at: string
	last_activity_at: string
}

export const chatApi = {
	// Send a message to the AI tutor
	sendMessage: async (message: string, conversationId?: string): Promise<{
		message: string
		conversation_id: string
		message_id: string
	}> => {
		const response = await api.post('/chat/message', {
			message,
			conversation_id: conversationId || undefined,
		})
		return response.data
	},

	// Get conversation messages
	getMessages: async (conversationId: string, limit?: number): Promise<{
		messages: ChatMessage[]
		conversation_id: string
		count: number
	}> => {
		const params = new URLSearchParams()
		params.append('conversation_id', conversationId)
		if (limit) params.append('limit', limit.toString())
		const response = await api.get(`/chat/history?${params.toString()}`)
		return response.data
	},

	// Get list of conversations
	getConversations: async (page?: number, limit?: number): Promise<{
		conversations: ChatConversation[]
		total: number
		page: number
		limit: number
	}> => {
		const params = new URLSearchParams()
		if (page) params.append('page', page.toString())
		if (limit) params.append('limit', limit.toString())
		const response = await api.get(`/chat/history?${params.toString()}`)
		return response.data
	},
}

// Learning / Spaced Repetition API
export interface ReviewItem {
	id: string
	chinese: string
	pinyin: string
	english: string
	hsk_level: number
	example_sentences: ExampleSentence[]
	progress?: {
		ease_factor: number
		interval_days: number
		repetitions: number
		next_review_at: string
		times_seen: number
		times_correct: number
	}
}

export interface LearningStats {
	total_words_learned: number
	words_mastered: number
	words_due_for_review: number
	average_ease_factor: number
	current_streak: number
	total_reviews: number
	accuracy_rate: number
	words_by_level: Record<string, {
		total_words: number
		words_learned: number
		words_mastered: number
		words_due: number
	}>
}

export const learningApi = {
	// Get items due for review
	getReviewItems: async (hskLevel?: number, limit?: number): Promise<{
		items: ReviewItem[]
		count: number
	}> => {
		const params = new URLSearchParams()
		if (hskLevel) params.append('hsk_level', hskLevel.toString())
		if (limit) params.append('limit', limit.toString())
		const response = await api.get(`/learn/review?${params.toString()}`)
		return response.data
	},

	// Get new words to study
	getNewWords: async (hskLevel?: number, limit?: number): Promise<{
		items: ReviewItem[]
		count: number
	}> => {
		const params = new URLSearchParams()
		if (hskLevel) params.append('hsk_level', hskLevel.toString())
		if (limit) params.append('limit', limit.toString())
		const response = await api.get(`/learn/new?${params.toString()}`)
		return response.data
	},

	// Submit review results
	submitReviews: async (reviews: { vocabulary_id: string; quality: number }[]): Promise<{
		message: string
		processed: number
		results: any[]
	}> => {
		const response = await api.post('/learn/review', { reviews })
		return response.data
	},

	// Get learning stats
	getStats: async (): Promise<{ stats: LearningStats }> => {
		const response = await api.get('/learn/stats')
		return response.data
	},
}

// Dictionary API
export const dictionaryApi = {
	// Search the dictionary
	search: async (query: string, hskLevel?: number, page?: number, limit?: number): Promise<{
		results: (Vocabulary & { match_type: string })[]
		total: number
		page: number
		limit: number
		query: string
	}> => {
		const params = new URLSearchParams()
		params.append('q', query)
		if (hskLevel) params.append('hsk_level', hskLevel.toString())
		if (page) params.append('page', page.toString())
		if (limit) params.append('limit', limit.toString())
		const response = await api.get(`/dictionary/search?${params.toString()}`)
		return response.data
	},

	// Look up a specific word
	getWord: async (word: string): Promise<{
		word: Vocabulary
		related_words: Vocabulary[]
	}> => {
		const response = await api.get(`/dictionary/${encodeURIComponent(word)}`)
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

// User types
export interface User {
	id: string
	email: string
	username?: string
	is_verified: boolean
	is_active: boolean
	last_login_at?: string
	created_at: string
	updated_at: string
}

// Session type
export interface UserSession {
	id: string
	user_id: string
	expires_at: string
	ip_address?: string
	user_agent?: string
	created_at: string
}

// Auth API
export const authApi = {
	// Signup
	signup: async (data: {
		email: string
		password: string
		username?: string
	}): Promise<{ message: string; user: User }> => {
		const response = await api.post('/auth/signup', data)
		return response.data
	},

	// Login
	login: async (data: { email: string; password: string }): Promise<{
		access_token: string
		refresh_token: string
		user: User
		expires_in: number
	}> => {
		const response = await api.post('/auth/login', data)
		return response.data
	},

	// Logout — send refresh token so the server can invalidate the session
	logout: async (refreshToken?: string): Promise<{ message: string }> => {
		const response = await api.post('/auth/logout', {
			refresh_token: refreshToken || localStorage.getItem('refresh_token') || '',
		})
		return response.data
	},

	// Request password reset
	requestPasswordReset: async (data: { email: string }): Promise<{ message: string }> => {
		const response = await api.post('/auth/request-password-reset', data)
		return response.data
	},

	// Confirm password reset
	confirmPasswordReset: async (data: { token: string; password: string }): Promise<{ message: string }> => {
		const response = await api.post('/auth/confirm-password-reset', data)
		return response.data
	},

	// Verify email
	verifyEmail: async (data: { token: string }): Promise<{ message: string }> => {
		const response = await api.post('/auth/verify-email', data)
		return response.data
	},

	// Get profile
	getProfile: async (): Promise<{ user: User }> => {
		const response = await api.get('/profile')
		return response.data
	},

	// Update profile
	updateProfile: async (data: { username?: string }): Promise<{ message: string; user: User }> => {
		const response = await api.put('/profile', data)
		return response.data
	},

	// Resend verification email
	resendVerification: async (): Promise<{ message: string }> => {
		const response = await api.post('/auth/resend-verification')
		return response.data
	},

	// Get active sessions
	getSessions: async (): Promise<{ sessions: UserSession[]; count: number }> => {
		const response = await api.get('/sessions')
		return response.data
	},

	// Revoke a specific session
	revokeSession: async (sessionId: string): Promise<{ message: string }> => {
		const response = await api.delete(`/sessions/${sessionId}`)
		return response.data
	},
}
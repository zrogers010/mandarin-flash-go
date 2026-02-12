import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080'

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

// User types
export interface User {
	id: string
	email: string
	first_name?: string
	last_name?: string
	is_verified: boolean
	is_active: boolean
	last_login_at?: string
	created_at: string
	updated_at: string
}

// Auth API
export const authApi = {
	// Signup
	signup: async (data: {
		email: string
		password: string
		first_name?: string
		last_name?: string
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
	updateProfile: async (data: { first_name?: string; last_name?: string }): Promise<{ message: string; user: User }> => {
		const response = await api.put('/profile', data)
		return response.data
	},
} 
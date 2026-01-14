import type { LoginForm, RegisterForm, LoginResponse, User, Chat, Message } from '@/types'

const API_BASE = '/api'

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Добавляем токен авторизации если есть
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const authStore = JSON.parse(authStorage)
      const accessToken = authStore.state?.accessToken || authStore.accessToken
      if (accessToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
        }
      }
    }
  } catch (error) {
    console.error('Error reading auth token:', error)
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new ApiError(errorText || 'Network error', response.status)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    
    return response.text() as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Network error')
  }
}

// Auth API
export const authApi = {
  async login(form: LoginForm): Promise<LoginResponse> {
    return fetchApi<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(form),
    })
  },

  async register(form: RegisterForm): Promise<LoginResponse> {
    return fetchApi<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: form.username,
        email: form.email,
        password: form.password,
      }),
    })
  },

  async refreshToken(refreshToken: string): Promise<string> {
    const response = await fetchApi<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    return response.access_token
  },
}

// Chat API
export const chatApi = {
  async getChats(): Promise<Chat[]> {
    return fetchApi<Chat[]>('/chats')
  },

  async createChat(data: {
    type: 'direct' | 'group' | 'server'
    name?: string
    description?: string
    participant_ids?: string[]
    is_private?: boolean
  }): Promise<Chat> {
    return fetchApi<Chat>('/chats', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getChatMessages(chatId: string, limit = 50, offset = 0): Promise<Message[]> {
    return fetchApi<Message[]>(`/chats/${chatId}/messages?limit=${limit}&offset=${offset}`)
  },
}

// User API
export const userApi = {
  async getProfile(userId: string): Promise<User> {
    return fetchApi<User>(`/users/${userId}`)
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    return fetchApi<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async searchUsers(query: string): Promise<User[]> {
    return fetchApi<User[]>(`/users/search?q=${encodeURIComponent(query)}`)
  },
}

export { ApiError }
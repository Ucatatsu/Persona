import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginForm, RegisterForm, LoginResponse } from '@/types'
import { authApi } from '@/utils/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (form: LoginForm) => Promise<void>
  register: (form: RegisterForm) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // Actions
      login: async (form: LoginForm) => {
        set({ isLoading: true, error: null })
        
        try {
          const response: LoginResponse = await authApi.login(form)
          
          set({
            user: response.user,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Ошибка входа',
          })
          throw error
        }
      },

      register: async (form: RegisterForm) => {
        set({ isLoading: true, error: null })
        
        try {
          const response: LoginResponse = await authApi.register(form)
          
          set({
            user: response.user,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Ошибка регистрации',
          })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
        })
      },

      checkAuth: async () => {
        const { accessToken, user } = get()
        
        // Если нет токена или пользователя, просто завершаем загрузку
        if (!accessToken || !user) {
          set({ isLoading: false })
          return
        }

        set({ isLoading: true })

        try {
          // Проверяем токен - пытаемся получить профиль пользователя
          const profile = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          })

          if (profile.ok) {
            const userData = await profile.json()
            set({ user: userData, isLoading: false })
          } else {
            // Токен недействителен, пробуем обновить
            const { refreshToken } = get()
            if (refreshToken) {
              try {
                const newAccessToken = await authApi.refreshToken(refreshToken)
                set({ accessToken: newAccessToken, isLoading: false })
              } catch {
                // Не удалось обновить, выходим
                set({
                  user: null,
                  accessToken: null,
                  refreshToken: null,
                  isLoading: false,
                })
              }
            } else {
              // Нет refresh токена, выходим
              set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isLoading: false,
              })
            }
          }
        } catch (error) {
          // Ошибка сети или сервера, но оставляем пользователя залогиненным
          // (возможно сервер временно недоступен)
          console.error('Auth check error:', error)
          set({ isLoading: false })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)
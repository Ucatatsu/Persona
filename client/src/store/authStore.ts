import { create } from 'zustand'

interface User {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  banner_url?: string
  role: string
  is_premium: boolean
  name_color?: string
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    set({ user, token })
    localStorage.setItem('kvant-auth', JSON.stringify({ user, token }))
  },
  updateUser: (updatedUser) => {
    set((state) => {
      if (!state.user) return state
      const newUser = { ...state.user, ...updatedUser }
      localStorage.setItem('kvant-auth', JSON.stringify({ user: newUser, token: state.token }))
      return { user: newUser }
    })
  },
  logout: () => {
    set({ user: null, token: null })
    localStorage.removeItem('kvant-auth')
  },
}))

// Restore from localStorage on init
const stored = localStorage.getItem('kvant-auth')
if (stored) {
  try {
    const { user, token } = JSON.parse(stored)
    useAuthStore.setState({ user, token })
  } catch (e) {
    console.error('Failed to restore auth', e)
  }
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
  accentColor: string
  setMode: (mode: ThemeMode) => void
  setAccentColor: (color: string) => void
  getEffectiveTheme: () => 'light' | 'dark'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      accentColor: '#00D9FF',
      
      setMode: (mode) => {
        set({ mode })
        applyTheme(mode, get().accentColor)
      },
      
      setAccentColor: (color) => {
        set({ accentColor: color })
        applyTheme(get().mode, color)
      },
      
      getEffectiveTheme: () => {
        const { mode } = get()
        if (mode === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return mode
      }
    }),
    {
      name: 'kvant-theme'
    }
  )
)

// Apply theme to document
function applyTheme(mode: ThemeMode, accentColor: string) {
  const root = document.documentElement
  const body = document.body
  
  // Determine effective theme
  let effectiveTheme: 'light' | 'dark' = mode === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    : mode
  
  // Apply theme class
  if (effectiveTheme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
    // Темный фон для glass эффекта
    root.style.setProperty('--glass-bg-r', '30')
    root.style.setProperty('--glass-bg-g', '41')
    root.style.setProperty('--glass-bg-b', '59')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
    // Светлый фон для glass эффекта
    root.style.setProperty('--glass-bg-r', '255')
    root.style.setProperty('--glass-bg-g', '255')
    root.style.setProperty('--glass-bg-b', '255')
  }
  
  // Apply accent color as CSS variable
  root.style.setProperty('--accent-color', accentColor)
  
  // Parse hex color to RGB for variations
  const hex = accentColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`)
  
  // Обновляем фон, если не установлен пользовательский
  const backgroundStore = localStorage.getItem('persona-background')
  if (backgroundStore) {
    try {
      const { state } = JSON.parse(backgroundStore)
      if (state && state.type === 'none') {
        // Применяем фон по умолчанию для текущей темы
        if (effectiveTheme === 'light') {
          body.style.setProperty('background', 'linear-gradient(to bottom right, #f1f5f9, #f8fafc, #f1f5f9)', 'important')
        } else {
          body.style.setProperty('background', '#0f172a', 'important')
        }
      }
    } catch (e) {
      console.error('Failed to check background settings', e)
    }
  }
}

// Initialize theme on load
const stored = localStorage.getItem('kvant-theme')
if (stored) {
  try {
    const { state } = JSON.parse(stored)
    applyTheme(state.mode, state.accentColor)
  } catch (e) {
    console.error('Failed to restore theme', e)
    // Применяем тему по умолчанию
    applyTheme('dark', '#00D9FF')
  }
} else {
  // Применяем тему по умолчанию при первой загрузке
  applyTheme('dark', '#00D9FF')
}

// Listen for system theme changes
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { mode, accentColor } = useThemeStore.getState()
    if (mode === 'system') {
      applyTheme(mode, accentColor)
    }
  })
}

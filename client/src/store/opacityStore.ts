import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OpacityState {
  glassOpacity: number
  setGlassOpacity: (opacity: number) => void
}

export const useOpacityStore = create<OpacityState>()(
  persist(
    (set) => ({
      glassOpacity: 0.03, // По умолчанию 3% = 2.4px blur

      setGlassOpacity: (opacity) => {
        set({ glassOpacity: opacity })
        applyGlassOpacity(opacity)
      },
    }),
    {
      name: 'persona-opacity',
    }
  )
)

// Применить прозрачность к документу
function applyGlassOpacity(opacity: number) {
  console.log('Applying glass blur:', opacity)
  const root = document.documentElement
  
  // Только изменяем blur, прозрачность фона остается фиксированной (0.03)
  // При 0% opacity = 0px blur (без размытия)
  // При 50% opacity = 40px blur (максимальное размытие)
  const blurAmount = Math.round(opacity * 80) // 0.5 * 80 = 40px
  root.style.setProperty('--glass-blur', `${blurAmount}px`)
  
  console.log('Applied blur:', blurAmount + 'px')
}

// Инициализация при загрузке
if (typeof window !== 'undefined') {
  const initOpacity = () => {
    const stored = localStorage.getItem('persona-opacity')
    if (stored) {
      try {
        const { state } = JSON.parse(stored)
        if (state && typeof state.glassOpacity === 'number') {
          applyGlassOpacity(state.glassOpacity)
        }
      } catch (e) {
        console.error('Failed to parse opacity settings', e)
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOpacity)
  } else {
    initOpacity()
  }
}

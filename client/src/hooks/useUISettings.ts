import { useEffect } from 'react'
import { useUIStore } from '../store/uiStore'
import { initializeBackground } from '../store/backgroundStore'

export function useUISettings() {
  const { fontSize, borderRadius } = useUIStore()

  // Initialize background on mount
  useEffect(() => {
    initializeBackground()
  }, [])

  useEffect(() => {
    const root = document.documentElement

    // Font size mapping
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    }

    // Calculate border radius variants based on base value
    // Более консервативные коэффициенты для естественного вида
    const radiusSm = Math.max(2, Math.round(borderRadius * 0.5))  // 50% - для маленьких элементов
    const radiusLg = Math.max(4, Math.round(borderRadius * 0.75)) // 75% - для сообщений (было 133%)
    const radiusXl = Math.round(borderRadius * 1.5)               // 150% - для больших карточек (было 200%)

    root.style.setProperty('--base-font-size', fontSizeMap[fontSize])
    root.style.setProperty('--border-radius', `${borderRadius}px`)
    root.style.setProperty('--border-radius-sm', `${radiusSm}px`)
    root.style.setProperty('--border-radius-lg', `${radiusLg}px`)
    root.style.setProperty('--border-radius-xl', `${radiusXl}px`)
  }, [fontSize, borderRadius])
}

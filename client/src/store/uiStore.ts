import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge'

interface UIState {
  fontSize: FontSize
  borderRadius: number // 0-32px
  setFontSize: (size: FontSize) => void
  setBorderRadius: (radius: number) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      fontSize: 'medium',
      borderRadius: 12, // default 12px
      setFontSize: (fontSize) => set({ fontSize }),
      setBorderRadius: (borderRadius) => set({ borderRadius })
    }),
    {
      name: 'kvant-ui-settings'
    }
  )
)

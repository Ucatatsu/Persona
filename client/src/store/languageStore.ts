import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'ru' | 'en' | 'uk' | 'zh' | 'ja' | 'de' | 'be'

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'ru',
      setLanguage: (language) => set({ language })
    }),
    {
      name: 'kvant-language'
    }
  )
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PrivacySettings {
  profilePhoto: 'everyone' | 'contacts' | 'nobody'
  lastSeen: 'everyone' | 'contacts' | 'nobody'
  status: 'everyone' | 'contacts' | 'nobody'
  readReceipts: boolean
}

interface PrivacyStore extends PrivacySettings {
  updatePrivacy: (settings: Partial<PrivacySettings>) => void
  reset: () => void
}

const defaultSettings: PrivacySettings = {
  profilePhoto: 'everyone',
  lastSeen: 'contacts',
  status: 'everyone',
  readReceipts: true,
}

export const usePrivacyStore = create<PrivacyStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updatePrivacy: (settings) => set((state) => ({ ...state, ...settings })),
      reset: () => set(defaultSettings),
    }),
    {
      name: 'persona-privacy',
    }
  )
)

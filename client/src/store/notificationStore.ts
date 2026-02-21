import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationSettings {
  desktop: boolean
  sound: boolean
  soundVolume: number
  preview: boolean
}

interface NotificationStore {
  settings: NotificationSettings
  unreadCount: number
  updateSettings: (settings: Partial<NotificationSettings>) => void
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  resetUnread: () => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      settings: {
        desktop: true,
        sound: true,
        soundVolume: 0.5,
        preview: true,
      },
      unreadCount: 0,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setUnreadCount: (count) => set({ unreadCount: count }),
      incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
      resetUnread: () => set({ unreadCount: 0 }),
    }),
    {
      name: 'persona-notifications',
    }
  )
)

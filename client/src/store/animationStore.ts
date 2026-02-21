import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DeleteAnimationType = 
  | 'bounce' // Текущая (подпрыгивание и исчезновение)
  | 'fade' // Простое затухание
  | 'slide' // Улетает в сторону
  | 'shrink' // Сжимается в точку
  | 'telegram' // Как в Telegram (сжатие по высоте)

interface AnimationState {
  deleteAnimation: DeleteAnimationType
  setDeleteAnimation: (animation: DeleteAnimationType) => void
}

export const useAnimationStore = create<AnimationState>()(
  persist(
    (set) => ({
      deleteAnimation: 'bounce',
      setDeleteAnimation: (animation) => set({ deleteAnimation: animation }),
    }),
    {
      name: 'persona-animation-settings',
    }
  )
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BackgroundType = 'none' | 'preset' | 'custom'

interface BackgroundState {
  type: BackgroundType
  presetId: string | null
  customUrl: string | null
  setBackground: (type: BackgroundType, presetId?: string, customUrl?: string) => void
  clearBackground: () => void
}

// Предустановленные фоны - красивые и интересные
export const presetBackgrounds = [
  { id: 'gradient-1', name: 'Космос', url: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { id: 'gradient-2', name: 'Аврора', url: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)' },
  { id: 'gradient-3', name: 'Глубины океана', url: 'linear-gradient(135deg, #000428 0%, #004e92 100%)' },
  { id: 'gradient-4', name: 'Закатное небо', url: 'linear-gradient(135deg, #2c3e50 0%, #3498db 50%, #2c3e50 100%)' },
  { id: 'gradient-5', name: 'Фиолетовая дымка', url: 'linear-gradient(135deg, #360033 0%, #0b8793 100%)' },
  { id: 'gradient-6', name: 'Тёмный лес', url: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { id: 'pattern-1', name: 'Сетка', url: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' },
  { id: 'pattern-2', name: 'Волны', url: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'20\' viewBox=\'0 0 100 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z\' fill=\'%23ffffff\' fill-opacity=\'0.06\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' },
]

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set) => ({
      type: 'none',
      presetId: null,
      customUrl: null,

      setBackground: (type, presetId, customUrl) => {
        console.log('setBackground called:', { type, presetId, customUrl })
        set({ type, presetId: presetId || null, customUrl: customUrl || null })
        // Применяем фон с небольшой задержкой, чтобы избежать частых обновлений
        setTimeout(() => {
          applyBackground(type, presetId, customUrl)
        }, 0)
      },

      clearBackground: () => {
        set({ type: 'none', presetId: null, customUrl: null })
        applyBackground('none')
      },
    }),
    {
      name: 'persona-background',
      // Сохраняем только тип и ID, не сохраняем большие данные
      partialize: (state) => ({
        type: state.type,
        presetId: state.presetId,
        // Не сохраняем customUrl если он слишком большой (base64)
        customUrl: state.customUrl && state.customUrl.length < 1000 ? state.customUrl : null,
      }),
    }
  )
)

// Применить фон к документу
function applyBackground(type: BackgroundType, presetId?: string, customUrl?: string) {
  console.log('=== APPLY BACKGROUND ===')
  console.log('Type:', type, 'PresetId:', presetId, 'CustomUrl:', customUrl ? 'provided' : 'none')
  
  const body = document.body
  console.log('Body element:', body)
  console.log('Current body background:', body.style.background)
  
  const isLightTheme = document.documentElement.classList.contains('light')
  console.log('Is light theme:', isLightTheme)

  if (type === 'none') {
    // Применяем фон по умолчанию в зависимости от темы
    if (isLightTheme) {
      body.style.setProperty('background', 'linear-gradient(to bottom right, #f1f5f9, #f8fafc, #f1f5f9)', 'important')
      console.log('Applied light theme default background')
    } else {
      body.style.setProperty('background', '#0f172a', 'important')
      console.log('Applied dark theme default background')
    }
    console.log('Final body background:', body.style.background)
    console.log('=== APPLY BACKGROUND COMPLETE ===')
    return
  }

  if (type === 'preset' && presetId) {
    const preset = presetBackgrounds.find(p => p.id === presetId)
    if (preset) {
      console.log('Found preset:', preset.name, preset.url)
      
      if (preset.url.startsWith('url(')) {
        // Для паттернов - комбинируем с темным фоном
        body.style.setProperty('background', `${preset.url}, #0f172a`, 'important')
        body.style.setProperty('background-size', 'auto', 'important')
        body.style.setProperty('background-repeat', 'repeat', 'important')
        console.log('Applied pattern background')
      } else {
        // Для градиентов
        body.style.setProperty('background', preset.url, 'important')
        body.style.setProperty('background-size', 'cover', 'important')
        body.style.setProperty('background-repeat', 'no-repeat', 'important')
        console.log('Applied gradient background')
      }
      body.style.setProperty('background-position', 'center', 'important')
      body.style.setProperty('background-attachment', 'fixed', 'important')
      
      console.log('Final body background:', body.style.background)
      console.log('=== APPLY BACKGROUND COMPLETE ===')
    } else {
      console.error('Preset not found:', presetId)
    }
  }

  if (type === 'custom' && customUrl) {
    console.log('Applying custom background, URL length:', customUrl.length)
    body.style.setProperty('background', `url(${customUrl})`, 'important')
    body.style.setProperty('background-size', 'cover', 'important')
    body.style.setProperty('background-position', 'center', 'important')
    body.style.setProperty('background-repeat', 'no-repeat', 'important')
    body.style.setProperty('background-attachment', 'fixed', 'important')
    console.log('Custom background applied')
    console.log('Final body background:', body.style.background.substring(0, 100) + '...')
    console.log('=== APPLY BACKGROUND COMPLETE ===')
  }
}

// Инициализация фона при загрузке
if (typeof window !== 'undefined') {
  // Применяем фон сразу при загрузке модуля
  const initBackground = () => {
    console.log('=== INITIALIZING BACKGROUND ===')
    const stored = localStorage.getItem('persona-background')
    console.log('Stored background data:', stored)
    
    if (stored) {
      try {
        const { state } = JSON.parse(stored)
        console.log('Parsed background state:', state)
        
        if (state && state.type !== 'none') {
          console.log('Applying background from storage:', state)
          
          // Для кастомных фонов проверяем sessionStorage
          if (state.type === 'custom') {
            const customBg = sessionStorage.getItem('persona-custom-bg')
            console.log('Custom background from sessionStorage:', customBg ? 'Found' : 'Not found')
            if (customBg) {
              applyBackground('custom', undefined, customBg)
            }
          } else {
            applyBackground(state.type, state.presetId, state.customUrl)
          }
        } else {
          console.log('Background type is "none", using default')
        }
      } catch (e) {
        console.error('Failed to parse background settings', e)
        // Очищаем поврежденные данные
        localStorage.removeItem('persona-background')
      }
    } else {
      console.log('No stored background found, using default')
    }
    console.log('=== BACKGROUND INITIALIZATION COMPLETE ===')
  }

  // Применяем сразу
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackground)
  } else {
    initBackground()
  }
}

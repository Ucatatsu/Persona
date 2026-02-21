import { create } from 'zustand'

export type LayoutComponent = 
  | 'header'
  | 'search'
  | 'contacts'
  | 'profile'
  | 'chatHeader'
  | 'chatMessages'
  | 'chatInput'
  // Widgets
  | 'clockWidget'
  | 'weatherWidget'
  | 'quoteWidget'
  | 'statsWidget'
  | 'systemWidget'
  | 'asciiWidget'
  | 'emptyWidget'

export interface LayoutConfig {
  left: LayoutComponent[]
  center: LayoutComponent[]
  right: LayoutComponent[]
}

const defaultLayout: LayoutConfig = {
  left: ['header', 'search', 'contacts', 'profile'],
  center: ['chatHeader', 'chatMessages', 'chatInput'],
  right: []
}

interface LayoutState {
  layout: LayoutConfig
  isCustomizing: boolean
  setLayout: (layout: LayoutConfig) => void
  toggleCustomizing: () => void
  resetLayout: () => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  layout: defaultLayout,
  isCustomizing: false,
  
  setLayout: (layout) => {
    set({ layout })
    localStorage.setItem('kvant-layout', JSON.stringify(layout))
  },
  
  toggleCustomizing: () => {
    set((state) => ({ isCustomizing: !state.isCustomizing }))
  },
  
  resetLayout: () => {
    set({ layout: defaultLayout })
    localStorage.setItem('kvant-layout', JSON.stringify(defaultLayout))
  }
}))

// Restore from localStorage on init with migration
const stored = localStorage.getItem('kvant-layout')
if (stored) {
  try {
    const layout = JSON.parse(stored)
    
    // Миграция со старого формата (left/right) на новый (left/center/right)
    if (layout.left && layout.right && !layout.center) {
      console.log('Migrating layout from old format to new format')
      const migratedLayout = {
        left: layout.left,
        center: layout.right, // Старая правая колонка становится центральной
        right: []
      }
      useLayoutStore.setState({ layout: migratedLayout })
      localStorage.setItem('kvant-layout', JSON.stringify(migratedLayout))
    } else if (layout.left && layout.center) {
      // Новый формат, просто загружаем
      useLayoutStore.setState({ layout })
    } else {
      // Неизвестный формат, сбрасываем
      console.log('Unknown layout format, resetting to default')
      localStorage.setItem('kvant-layout', JSON.stringify(defaultLayout))
      useLayoutStore.setState({ layout: defaultLayout })
    }
  } catch (e) {
    console.error('Failed to restore layout', e)
    localStorage.setItem('kvant-layout', JSON.stringify(defaultLayout))
    useLayoutStore.setState({ layout: defaultLayout })
  }
} else {
  // Нет сохранённого layout, используем дефолтный
  localStorage.setItem('kvant-layout', JSON.stringify(defaultLayout))
}

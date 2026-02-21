// Application constants
export const APP_VERSION = '2H1C1S'
export const RELEASE_DATE = '2026-01-24'
export const APP_NAME = 'Persona Messenger'
export const VERSION_ERA = 'Horse' // Chinese Zodiac
export const VERSION_ERA_EMOJI = '🐴'

// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// UI constants
export const MESSAGE_LOAD_LIMIT = 50
export const TYPING_TIMEOUT = 3000 // 3 seconds
export const SCROLL_THRESHOLD = 100

// LocalStorage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'kvant-token',
  USER_DATA: 'kvant-user',
  THEME: 'kvant-theme',
  LANGUAGE: 'kvant-language',
  LAYOUT: 'kvant-layout',
  RECENT_EMOJI: 'kvant-recent-emoji',
  UI_SETTINGS: 'kvant-ui-settings',
} as const

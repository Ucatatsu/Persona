// Пользователь
export interface User {
  id: string
  username: string
  email: string
  display_name?: string
  avatar_url?: string
  banner_url?: string
  bio?: string
  status: 'online' | 'offline' | 'away' | 'busy'
  role: 'user' | 'admin' | 'moderator'
  is_premium: boolean
  created_at: string
  updated_at: string
  last_seen_at: string
}

// Чат
export type ChatType = 'direct' | 'group' | 'server'

export interface Chat {
  id: string
  type: ChatType
  name?: string
  description?: string
  avatar_url?: string
  owner_id: string
  is_private: boolean
  created_at: string
  updated_at: string
  last_message?: Message
  unread_count: number
  participant_ids?: string[]
}

// Сообщение
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'sticker' | 'system'

export interface Message {
  id: string
  chat_id: string
  user_id: string
  type: MessageType
  content: string
  file_url?: string
  file_name?: string
  file_size?: number
  reply_to_id?: string
  is_edited: boolean
  created_at: string
  updated_at: string
  user?: User
  reply_to?: Message
  delivered_at?: string
  read_at?: string
}

// API ответы
export interface LoginResponse {
  user: User
  access_token: string
  refresh_token: string
}

export interface ApiError {
  message: string
  code?: string
}

// WebSocket сообщения
export interface WSMessage {
  type: string
  data?: any
}

// Состояния UI
export interface UIState {
  sidebarOpen: boolean
  currentChatId?: string
  isTyping: boolean
  theme: 'light' | 'dark' | 'system'
}

// Формы
export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface SendMessageForm {
  content: string
  type: MessageType
  reply_to_id?: string
}
import { useState, useEffect, useRef, ReactNode, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, Search, Phone, Video, Paperclip, Smile, Send, Reply, Edit, Forward } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useLayoutStore, LayoutComponent } from '../store/layoutStore'
import { useLanguageStore } from '../store/languageStore'
import { useAnimationStore } from '../store/animationStore'
import { useNotificationStore } from '../store/notificationStore'
import { useCallStore } from '../store/callStore'
import { useTranslation } from '../hooks/useTranslation'
import { useMessageCallbacks } from '../hooks/useMessageCallbacks'
import { useNotifications } from '../hooks/useNotifications'
import { playNotificationSound } from '../utils/notificationSound'
import UserProfile from '../components/UserProfile.tsx'
import DualColumnLayout from '../components/DualColumnLayout.tsx'
import MobileLayout from '../components/MobileLayout.tsx'
import SettingsModal from '../components/SettingsModal.tsx'
import MentionInput from '../components/MentionInput.tsx'
import MessageText from '../components/MessageText.tsx'
import MessageImage from '../components/MessageImage.tsx'
import MessageItem from '../components/MessageItem.tsx'
import MessageContextMenu from '../components/MessageContextMenu.tsx'
import Logo from '../components/Logo.tsx'
import FileUpload from '../components/FileUpload.tsx'
import ForwardModal from '../components/ForwardModal.tsx'
import MessageSearch from '../components/MessageSearch.tsx'
import EmojiPicker from '../components/EmojiPicker.tsx'
import { CallScreen } from '../components/CallScreen.tsx'
import { CallHeader } from '../components/CallHeader.tsx'
import { NotificationIsland } from '../components/NotificationIsland.tsx'
import { 
  ClockWidget, 
  WeatherWidget, 
  QuoteWidget, 
  StatsWidget, 
  SystemWidget, 
  AsciiWidget, 
  EmptyWidget 
} from '../components/widgets'
import api from '../services/api'
import { wsService } from '../services/websocket'
import { groupMessagesByDate, formatMessageDate } from '../utils/dateUtils'

interface User {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  is_online?: boolean
}

interface Reaction {
  id: string
  user_id: string
  emoji: string
  created_at: string
}

export default function Chat() {
  const { logout, token } = useAuthStore()
  const { isCustomizing, toggleCustomizing, resetLayout, layout } = useLayoutStore()
  const { deleteAnimation } = useAnimationStore()
  const { t } = useTranslation()
  const [selectedChat, setSelectedChat] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [recentChats, setRecentChats] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false)
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [forwardingMessage, setForwardingMessage] = useState<any>(null)
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [editingMessage, setEditingMessage] = useState<any>(null)
  const [contextMenu, setContextMenu] = useState<{
    message: any
    position: { x: number; y: number }
  } | null>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const { user } = useAuthStore()
  const { language } = useLanguageStore()
  const { settings: notificationSettings } = useNotificationStore()
  const { showMessageNotification } = useNotifications()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<number | null>(null)
  
  // Оптимизированные коллбэки для сообщений
  const messageCallbacks = useMessageCallbacks(
    setReplyingTo,
    setContextMenu,
    scrollToMessage,
    handleReaction,
    messageRefs
  )
  
  // Определяем мобильное устройство
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fix layout if needed
  useEffect(() => {
    const stored = localStorage.getItem('kvant-layout')
    if (stored) {
      try {
        const layout = JSON.parse(stored)
        // Check if old format
        if (layout.sidebar || layout.chatArea) {
          console.log('Resetting old layout format (sidebar/chatArea)')
          localStorage.removeItem('kvant-layout')
          window.location.reload()
          return
        }
        // Check if has old 'chat' component
        if (layout.left?.includes('chat') || layout.center?.includes('chat') || layout.right?.includes('chat')) {
          console.log('Resetting old layout format (chat component)')
          localStorage.removeItem('kvant-layout')
          window.location.reload()
          return
        }
        // Check if missing required components
        const allComponents = [...(layout.left || []), ...(layout.center || []), ...(layout.right || [])]
        const requiredComponents = ['chatHeader', 'chatMessages', 'chatInput']
        const hasAllRequired = requiredComponents.every(c => allComponents.includes(c))
        if (!hasAllRequired) {
          console.log('Layout missing required components, resetting')
          localStorage.removeItem('kvant-layout')
          window.location.reload()
          return
        }
      } catch (e) {
        console.error('Failed to parse layout', e)
        localStorage.removeItem('kvant-layout')
        window.location.reload()
      }
    }
  }, [])

  useEffect(() => {
    if (token) {
      // Подключаемся к WebSocket
      wsService.connect(token)
      
      wsService.onOnlineUsers((data: any) => {
        setOnlineUsers(data.users || [])
      })

      const handleNewMessage = () => {
        loadRecentChats()
      }

      const handleTypingStart = (data: any) => {
        setTypingUsers(prev => new Set(prev).add(data.user_id))
      }

      const handleTypingStop = (data: any) => {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.user_id)
          return newSet
        })
      }

      const handleGlobalMessageDeleted = (eventData: any) => {
        // WebSocket event has structure: { type: 'message_deleted', data: { id, deleted_for_everyone, ... } }
        // But the handler receives just the data part
        const data = eventData.data || eventData
        const { id, deleted_for_everyone, deleted_for } = data
        
        // Update messages if this chat is currently open
        setMessages(prev => {
          const hasMessage = prev.some(msg => msg.id === id)
          if (!hasMessage) return prev
          
          if (deleted_for_everyone) {
            return prev.filter(msg => msg.id !== id)
          } else if (deleted_for === user?.id) {
            return prev.filter(msg => msg.id !== id)
          }
          return prev
        })
      }

      const handleReactionAdded = (eventData: any) => {
        const data = eventData.data || eventData
        setMessages(prev => prev.map(m => {
          if (m.id === data.message_id) {
            const exists = m.reactions?.some((r: Reaction) => r.user_id === data.user_id && r.emoji === data.emoji)
            if (exists) return m

            const newReaction: Reaction = { 
              id: Date.now().toString(), 
              user_id: data.user_id, 
              emoji: data.emoji, 
              created_at: new Date().toISOString() 
            }
            return { ...m, reactions: [...(m.reactions || []), newReaction] }
          }
          return m
        }))
      }

      const handleReactionRemoved = (eventData: any) => {
        const data = eventData.data || eventData
        setMessages(prev => prev.map(m => {
          if (m.id === data.message_id) {
            return { ...m, reactions: (m.reactions || []).filter((r: Reaction) => !(r.user_id === data.user_id && r.emoji === data.emoji)) }
          }
          return m
        }))
      }

      wsService.onNewMessage(handleNewMessage)
      wsService.onTypingStart(handleTypingStart)
      wsService.onTypingStop(handleTypingStop)
      wsService.on('message_deleted', handleGlobalMessageDeleted)
      wsService.on('reaction_added', handleReactionAdded)
      wsService.on('reaction_removed', handleReactionRemoved)
      loadRecentChats()

      return () => {
        wsService.off('new_message', handleNewMessage)
        wsService.off('typing_start', handleTypingStart)
        wsService.off('typing_stop', handleTypingStop)
        wsService.off('message_deleted', handleGlobalMessageDeleted)
        wsService.off('reaction_added', handleReactionAdded)
        wsService.off('reaction_removed', handleReactionRemoved)
        // Не отключаем WebSocket при размонтировании, только при логауте
      }
    }
  }, [token, user?.id])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers()
    } else {
      setUsers([])
    }
  }, [searchQuery])

  const loadRecentChats = async () => {
    try {
      const response = await api.get('/api/messages/recent')
      setRecentChats(response.data || [])
    } catch (error) {
      console.error('Failed to load recent chats:', error)
    }
  }

  const searchUsers = async () => {
    try {
      const response = await api.get(`/api/users/search?q=${searchQuery}`)
      setUsers(response.data || [])
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const handleSelectChat = (user: User) => {
    setSelectedChat(user)
    if (!recentChats.find(chat => chat.id === user.id)) {
      setRecentChats(prev => [user, ...prev])
    }
    setSearchQuery('')
    setUsers([])
    loadMessages(user.id)
  }

  const loadMessages = async (chatId: string) => {
    try {
      const response = await api.get(`/api/messages/${chatId}`)
      setMessages(response.data || [])
      
      // Mark messages as read when opening chat
      if (wsService.isConnected()) {
        wsService.markMessagesAsRead(chatId)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const scrollToMessage = (messageId: string) => {
    const element = messageRefs.current.get(messageId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Highlight animation
      element.classList.add('highlight-message')
      setTimeout(() => {
        element.classList.remove('highlight-message')
      }, 2000)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedChat) return

    // If editing, send edit request
    if (editingMessage) {
      try {
        await api.put(`/api/messages/${editingMessage.id}/edit`, {
          text: messageText
        })
        
        // Update message in local state
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, text: messageText, edited_at: new Date().toISOString() }
            : msg
        ))
        
        setMessageText('')
        setEditingMessage(null)
      } catch (error) {
        console.error('Failed to edit message:', error)
      }
      return
    }

    // Normal send message flow
    const tempId = `temp-${Date.now()}`
    const newMessage = {
      id: tempId,
      sender_id: user?.id || '',
      receiver_id: selectedChat.id,
      text: messageText,
      created_at: new Date().toISOString(),
      isTemp: true, // Помечаем как временное
      reply_to_id: replyingTo?.id || null,
      replied_message: replyingTo || null,
    }
    setMessages(prev => [...prev, newMessage])
    wsService.sendMessage(selectedChat.id, messageText, replyingTo?.id)
    setMessageText('')
    setReplyingTo(null)
    
    // Отправляем событие для статистики
    window.dispatchEvent(new Event('message-sent'))
  }

  // Listen for new messages
  useEffect(() => {
    if (!selectedChat) return

    const handleNewMessage = (data: any) => {
      const msg = data
      if (
        (msg.sender_id === selectedChat.id && msg.receiver_id === user?.id) ||
        (msg.sender_id === user?.id && msg.receiver_id === selectedChat.id)
      ) {
        setMessages(prev => {
          // Если это наше отправленное сообщение, заменяем временное на реальное
          if (msg.sender_id === user?.id) {
            // Ищем временное сообщение с таким же текстом
            const tempIndex = prev.findIndex(m => m.isTemp && m.text === msg.text && m.sender_id === user?.id)
            if (tempIndex !== -1) {
              // Заменяем временное сообщение на реальное
              const updated = [...prev]
              updated[tempIndex] = msg
              return updated
            }
          } else {
            // Incoming message - show notification
            if (notificationSettings.sound) {
              playNotificationSound(notificationSettings.soundVolume)
            }
            
            if (notificationSettings.desktop && document.hidden) {
              const senderName = selectedChat.display_name || selectedChat.username
              const messageText = notificationSettings.preview 
                ? (msg.text || (msg.message_type === 'image' ? '📷 Photo' : '🎤 Voice message'))
                : t('newMessage')
              
              showMessageNotification(senderName, messageText, () => {
                window.focus()
              })
            }
            
            // Показываем уведомление в динамическом острове
            if (notificationSettings.preview) {
              const senderName = selectedChat.display_name || selectedChat.username
              const messageText = msg.text || (msg.message_type === 'image' ? '📷 Photo' : '🎤 Voice message')
              
              window.dispatchEvent(new CustomEvent('show-notification-island', {
                detail: {
                  senderName,
                  senderAvatar: selectedChat.avatar_url,
                  messageText,
                }
              }))
            }
          }
          // Иначе просто добавляем новое сообщение
          return [...prev, msg]
        })
        
        // Mark as read if chat is open
        if (msg.sender_id === selectedChat.id && wsService.isConnected()) {
          wsService.markMessagesAsRead(selectedChat.id)
        }
      }
    }

    const handleMessagesRead = (data: any) => {
      // Update messages to show as read
      if (data.sender_id === user?.id && data.reader_id === selectedChat.id) {
        setMessages(prev => prev.map(msg => {
          if (msg.sender_id === user?.id && msg.receiver_id === selectedChat.id && !msg.is_read) {
            return { ...msg, is_read: true, read_at: data.read_at }
          }
          return msg
        }))
      }
    }

    const handleMessageEdited = (data: any) => {
      const editedMsg = data
      setMessages(prev => prev.map(msg => 
        msg.id === editedMsg.id ? editedMsg : msg
      ))
    }

    wsService.onNewMessage(handleNewMessage)
    wsService.onMessagesRead(handleMessagesRead)
    wsService.on('message_edited', handleMessageEdited)

    return () => {
      wsService.off('new_message', handleNewMessage)
      wsService.off('messages_read', handleMessagesRead)
      wsService.off('message_edited', handleMessageEdited)
    }
  }, [selectedChat?.id, user?.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleLogout = () => {
    wsService.disconnect()
    logout()
  }

  const handleSettings = () => {
    setIsSettingsOpen(true)
  }

  const handleFileUploaded = (url: string, type: 'image' | 'file') => {
    if (!selectedChat) return
    
    // Send message with file URL
    const tempId = `temp-${Date.now()}`
    const newMessage = {
      id: tempId,
      sender_id: user?.id || '',
      receiver_id: selectedChat.id,
      text: '', // Empty text for image-only messages
      file_url: url,
      message_type: type,
      created_at: new Date().toISOString(),
      isTemp: true,
    }
    setMessages(prev => [...prev, newMessage])
    
    // Send via WebSocket with special format
    wsService.sendMessage(selectedChat.id, `[${type}]${url}`)
    
    // Отправляем событие для статистики
    if (type === 'image') {
      window.dispatchEvent(new Event('image-sent'))
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji)
    setIsEmojiPickerOpen(false)
  }

  const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    // Don't try to delete temporary messages
    if (messageId.startsWith('temp-')) {
      console.warn('Cannot delete temporary message:', messageId)
      return
    }
    
    try {
      await api.delete(`/api/messages/${messageId}/delete`, {
        data: { delete_for_everyone: deleteForEveryone }
      })
      
      // Remove message from local state immediately
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (error: any) {
      console.error('Failed to delete message:', error)
    }
  }

  const handleForwardMessage = async (recipientId: string) => {
    if (!forwardingMessage) return
    
    try {
      // Формируем текст сообщения
      let messageText = forwardingMessage.text || ''
      
      // Если это изображение, добавляем специальный формат
      if (forwardingMessage.file_url && forwardingMessage.message_type === 'image') {
        messageText = `[image]${forwardingMessage.file_url}`
      }
      
      // Если пересылаем в текущий открытый чат, добавляем временное сообщение
      if (selectedChat && recipientId === selectedChat.id) {
        const tempId = `temp-${Date.now()}`
        const newMessage = {
          id: tempId,
          sender_id: user?.id || '',
          receiver_id: recipientId,
          text: forwardingMessage.text || '',
          file_url: forwardingMessage.file_url,
          message_type: forwardingMessage.message_type,
          created_at: new Date().toISOString(),
          isTemp: true,
        }
        setMessages(prev => [...prev, newMessage])
      }
      
      // Отправляем через WebSocket
      wsService.sendMessage(recipientId, messageText)
      
      // Закрываем модалку
      setIsForwardModalOpen(false)
      setForwardingMessage(null)
    } catch (error) {
      console.error('Failed to forward message:', error)
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const msg = messages.find(m => m.id === messageId)
      if (!msg) return

      const existingReaction = msg.reactions?.find((r: Reaction) => r.user_id === user?.id && r.emoji === emoji)
      
      if (existingReaction) {
        await api.delete(`/api/messages/${messageId}/reactions`, { data: { emoji } })
      } else {
        await api.post(`/api/messages/${messageId}/reactions`, { emoji })
      }
    } catch (error) {
      console.error('Failed to update reaction:', error)
    }
  }

  // Определяем, где находится блок contacts
  const isContactsInLeft = layout.left.includes('contacts')
  const isContactsInRight = layout.right.includes('contacts')
  const isContactsVertical = isContactsInLeft || isContactsInRight // Вертикальный в left/right, горизонтальный в center

  // Render user item for vertical list
  const renderUserItemVertical = (u: User, index: number) => (
    <motion.button
      key={u.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => handleSelectChat(u)}
      disabled={isCustomizing}
      className={`w-full p-4 flex items-center gap-3 transition-all border-b border-white/5 rounded-xl ${
        selectedChat?.id === u.id ? 'gradient-accent-soft border-accent' : 'hover:bg-white/5'
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
          <span className="text-lg font-semibold">{u.username[0].toUpperCase()}</span>
        </div>
        {onlineUsers.includes(u.id) && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-slate-900 shadow-lg shadow-green-500/50" />
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-medium truncate">{u.display_name || u.username}</p>
        <p className="text-sm text-white/60 truncate">@{u.username}</p>
      </div>
    </motion.button>
  )

  // Render user item for horizontal tabs
  const renderUserItemHorizontal = (u: User, index: number) => (
    <motion.button
      key={u.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => handleSelectChat(u)}
      disabled={isCustomizing}
      className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${
        selectedChat?.id === u.id 
          ? 'gradient-accent-soft border-accent' 
          : 'glass-hover border-white/10'
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
          <span className="text-sm font-semibold">{u.username[0].toUpperCase()}</span>
        </div>
        {onlineUsers.includes(u.id) && (
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-slate-900 shadow-lg shadow-green-500/50" />
        )}
      </div>
      <div className="text-left min-w-0">
        <p className="font-medium text-sm truncate max-w-[120px]">{u.display_name || u.username}</p>
        <p className="text-xs text-white/60 truncate max-w-[120px]">@{u.username}</p>
      </div>
    </motion.button>
  )

  // Компоненты для drag & drop
  const components: Record<LayoutComponent, ReactNode> = {
    header: (
      <div className="glass rounded-2xl p-4 flex-shrink-0 h-20 flex items-center">
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3">
            <Logo size="sm" animated={false} />
            <h1 className="text-2xl font-bold text-accent">
              {t('appName')}
            </h1>
          </div>
          <div className="flex gap-2 relative z-10">
            <button 
              onClick={handleSettings}
              className="p-2 glass-hover rounded-xl transition-all hover:scale-110 pointer-events-auto"
              title="Настройки"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 glass-hover rounded-xl text-red-400 transition-all hover:scale-110 pointer-events-auto">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    ),

    search: (
      <div className="glass rounded-2xl p-4 flex-shrink-0 min-h-[72px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder={t('searchUsers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
            disabled={isCustomizing}
          />
        </div>
      </div>
    ),

    contacts: isContactsVertical ? (
      // Вертикальный список для левой колонки
      <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent p-2">
          <AnimatePresence mode="wait">
            {searchQuery.length >= 2 ? (
              <>
                {users.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 text-center text-white/60"
                  >
                    {t('noUsersFound')}
                  </motion.div>
                ) : (
                  users.map((u, index) => renderUserItemVertical(u, index))
                )}
              </>
            ) : (
              <>
                {recentChats.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 text-center text-white/60"
                  >
                    {t('startTyping')}
                  </motion.div>
                ) : (
                  recentChats.map((u, index) => renderUserItemVertical(u, index))
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    ) : (
      // Горизонтальные вкладки для центральной части
      <div className="flex-shrink-0 glass rounded-2xl overflow-hidden h-20">
        <div className="flex items-center gap-2 p-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent h-full">
          <AnimatePresence mode="wait">
            {searchQuery.length >= 2 ? (
              <>
                {users.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full text-center text-white/60 text-sm"
                  >
                    {t('noUsersFound')}
                  </motion.div>
                ) : (
                  users.map((u, index) => renderUserItemHorizontal(u, index))
                )}
              </>
            ) : (
              <>
                {recentChats.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full text-center text-white/60 text-sm"
                  >
                    {t('startTyping')}
                  </motion.div>
                ) : (
                  recentChats.map((u, index) => renderUserItemHorizontal(u, index))
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    ),

    profile: (
      <div className="flex-shrink-0 h-20">
        <UserProfile />
      </div>
    ),

    chatHeader: selectedChat ? (
      <motion.div 
        className="flex-shrink-0 h-20 flex items-center justify-center px-4 gap-4"
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* CallHeader слева */}
        <CallHeader />
        
        {/* Основной хедер по центру */}
        <motion.div 
          className="glass rounded-2xl flex items-center justify-between px-8 w-full max-w-4xl h-20"
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
        {/* Контакт слева */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
              <span className="text-lg font-semibold">{selectedChat.username[0].toUpperCase()}</span>
            </div>
            {onlineUsers.includes(selectedChat.id) && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-slate-900" />
            )}
          </div>
          <div className="text-left">
            <p className="font-medium">{selectedChat.display_name || selectedChat.username}</p>
            <p className="text-sm text-white/60">
              {typingUsers.has(selectedChat.id) ? (
                <span className="flex items-center gap-1">
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                  <span>{t('typing') || 'печатает...'}</span>
                </span>
              ) : (
                onlineUsers.includes(selectedChat.id) ? t('online') : t('offline')
              )}
            </p>
          </div>
        </div>

        {/* Кнопки справа */}
        <div className="flex gap-2">
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 glass-hover rounded-xl transition-all hover:scale-110 ${isSearchOpen ? 'bg-accent/20 text-accent' : ''}`}
            title={t('searchInChat')}
          >
            <Search className="w-5 h-5" />
          </button>
          <button 
            className="p-2 glass-hover rounded-xl transition-all hover:scale-110"
            onClick={() => {
              if (selectedChat) {
                useCallStore.getState().startCall(
                  selectedChat.id,
                  selectedChat.username,
                  selectedChat.avatar_url,
                  'audio'
                );
              }
            }}
            title="Voice Call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button 
            className="p-2 glass-hover rounded-xl transition-all hover:scale-110"
            onClick={() => {
              if (selectedChat) {
                useCallStore.getState().startCall(
                  selectedChat.id,
                  selectedChat.username,
                  selectedChat.avatar_url,
                  'video'
                );
              }
            }}
            title="Video Call"
          >
            <Video className="w-5 h-5" />
          </button>
        </div>
        </motion.div>
        
        {/* NotificationIsland справа */}
        <NotificationIsland />
      </motion.div>
    ) : (
      <div className="flex-shrink-0 h-20 flex items-center justify-center px-4">
        <div className="glass rounded-2xl flex items-center justify-center w-full max-w-4xl h-20">
        <p className="text-white/60">{t('selectChat')}</p>
        </div>
      </div>
    ),

    chatMessages: selectedChat ? (
      <div className="flex-1 glass rounded-2xl overflow-hidden relative">
        {/* Message Search */}
        <MessageSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          messages={messages}
          onNavigate={scrollToMessage}
        />

        {/* Messages container */}
        <div className={`h-full p-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 ${isSearchOpen ? 'pt-16' : ''}`}>
          <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-white/40 text-center">
              {t('startConversation')} {selectedChat.display_name || selectedChat.username}
            </p>
          ) : (
            groupMessagesByDate(messages).map((group) => (
              <div key={group.date} className="space-y-3">
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <div className="glass-hover px-4 py-1.5 rounded-full">
                    <p className="text-xs text-white/60 font-medium">
                      {formatMessageDate(new Date(group.date), t as any)}
                    </p>
                  </div>
                </div>

                {/* Messages for this date */}
                <AnimatePresence>
                  {group.messages.map((msg, index) => {
                    const isSent = msg.sender_id === user?.id
                    const isNewMessage = index === group.messages.length - 1
                    
                    // Проверяем группировку сообщений
                    const prevMsg = index > 0 ? group.messages[index - 1] : null
                    
                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id
                    
                    // Определяем отступы: 1px внутри группы, 12px между группами
                    const marginTop = isFirstInGroup ? 'mt-3' : 'mt-0.5'
                    
                    // Animation variants based on selected animation type
                    const getExitAnimation = () => {
                      switch (deleteAnimation) {
                        case 'bounce':
                          // Эффектное подпрыгивание с вращением и растворением
                          return {
                            opacity: [1, 1, 0.8, 0],
                            scale: [1, 1.15, 1.05, 0.7],
                            rotate: [0, -5, 5, 15],
                            y: [0, -20, -10, 20],
                            filter: ['blur(0px)', 'blur(0px)', 'blur(2px)', 'blur(8px)'],
                            transition: { 
                              duration: 0.7,
                              ease: [0.34, 1.56, 0.64, 1],
                              times: [0, 0.3, 0.6, 1],
                              opacity: { duration: 0.7, ease: 'easeOut' },
                              scale: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
                              rotate: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
                              y: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
                              filter: { duration: 0.7, ease: 'easeOut' }
                            }
                          }
                        case 'fade':
                          // Растворение на частицы с размытием БЕЗ движения
                          return {
                            opacity: [1, 0.8, 0.5, 0.2, 0],
                            scale: [1, 0.98, 0.96, 0.94, 0.92],
                            filter: ['blur(0px) brightness(1)', 'blur(2px) brightness(1.1)', 'blur(5px) brightness(1.2)', 'blur(10px) brightness(1.3)', 'blur(15px) brightness(1.5)'],
                            transition: { 
                              duration: 0.9,
                              ease: 'easeOut',
                              times: [0, 0.2, 0.5, 0.8, 1]
                            }
                          }
                        case 'slide':
                          // Эффектное улетание с вращением и размытием
                          return {
                            x: isSent ? [0, 50, 200, 400] : [0, -50, -200, -400],
                            opacity: [1, 0.9, 0.5, 0],
                            scale: [1, 0.95, 0.85, 0.7],
                            rotate: isSent ? [0, 5, 15, 30] : [0, -5, -15, -30],
                            filter: ['blur(0px)', 'blur(1px)', 'blur(4px)', 'blur(12px)'],
                            transition: { 
                              duration: 0.7,
                              ease: [0.34, 1.56, 0.64, 1],
                              times: [0, 0.25, 0.6, 1]
                            }
                          }
                        case 'shrink':
                          // Эффект взрыва/разлета на частицы
                          return {
                            scale: [1, 1.2, 1.4, 1.6, 0],
                            opacity: [1, 0.8, 0.5, 0.2, 0],
                            filter: ['blur(0px) brightness(1)', 'blur(3px) brightness(1.3)', 'blur(8px) brightness(1.5)', 'blur(15px) brightness(1.8)', 'blur(25px) brightness(2)'],
                            transition: { 
                              duration: 0.8,
                              ease: [0.25, 0.46, 0.45, 0.94],
                              times: [0, 0.2, 0.5, 0.8, 1]
                            }
                          }
                        case 'telegram':
                          // Оптимизированное схлопывание
                          return {
                            scaleY: [1, 0.7, 0.3, 0],
                            scaleX: [1, 1.03, 1.06, 1.08],
                            opacity: [1, 0.9, 0.7, 0],
                            filter: ['blur(0px)', 'blur(1px)', 'blur(2px)', 'blur(4px)'],
                            transition: { 
                              duration: 0.4,
                              ease: [0.25, 0.46, 0.45, 0.94],
                              times: [0, 0.4, 0.7, 1]
                            }
                          }
                        default:
                          return {
                            opacity: 0,
                            transition: { duration: 0.3 }
                          }
                      }
                    }
                    
                    return (
                      <motion.div
                        key={msg.id}
                        ref={(el) => {
                          if (el) messageRefs.current.set(msg.id, el)
                        }}
                        initial={isNewMessage ? { opacity: 0, scale: 0.95 } : false}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={getExitAnimation()}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'} ${marginTop} relative`}
                        style={{ 
                          zIndex: 1,
                          willChange: 'transform, opacity, filter'
                        }}
                      >
                      {/* Reply icon that appears on swipe */}
                      <motion.div
                        className={`absolute top-1/2 -translate-y-1/2 left-full ml-2`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0, scale: 0 }}
                        style={{
                          opacity: 0,
                          scale: 0,
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <Reply className="w-4 h-4 text-accent" />
                        </div>
                      </motion.div>

                      <motion.div 
                        className={`${isSent ? 'message-sent' : 'message-received'} relative`}
                        drag="x"
                        dragConstraints={{ left: -80, right: 0 }}
                        dragElastic={0.2}
                        dragSnapToOrigin={true}
                        onDrag={(e, info) => {
                          // Show reply icon when dragging left
                          const threshold = 30
                          const dragAmount = info.offset.x
                          // Only show icon when dragging left (negative x)
                          if (dragAmount < -threshold && e.currentTarget) {
                            const parent = (e.currentTarget as HTMLElement).parentElement
                            const icon = parent?.querySelector('.absolute') as HTMLElement
                            if (icon) {
                              icon.style.opacity = '1'
                              icon.style.transform = `translateY(-50%) scale(${Math.min(Math.abs(dragAmount) / 50, 1)})`
                            }
                          } else if (e.currentTarget) {
                            // Hide icon when not dragging left enough
                            const parent = (e.currentTarget as HTMLElement).parentElement
                            const icon = parent?.querySelector('.absolute') as HTMLElement
                            if (icon) {
                              icon.style.opacity = '0'
                              icon.style.transform = 'translateY(-50%) scale(0)'
                            }
                          }
                        }}
                        onDragEnd={(e, info) => {
                          // Hide icon
                          if (e.currentTarget) {
                            const parent = (e.currentTarget as HTMLElement).parentElement
                            const icon = parent?.querySelector('.absolute') as HTMLElement
                            if (icon) {
                              icon.style.opacity = '0'
                              icon.style.transform = 'translateY(-50%) scale(0)'
                            }
                          }
                          
                          const threshold = 50
                          // Only trigger reply when dragging left (negative x)
                          if (info.offset.x < -threshold) {
                            setReplyingTo(msg)
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          const x = e.clientX
                          const y = e.clientY
                          const menuWidth = 180
                          const menuHeight = 200
                          const adjustedX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x
                          const adjustedY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y
                          setContextMenu({
                            message: msg,
                            position: { x: adjustedX, y: adjustedY }
                          })
                        }}
                      >
                        <div className="flex flex-col gap-2">
                          {/* Forwarded from label */}
                          {msg.forwarded_from_username && (
                            <div className="flex items-center gap-1.5 text-xs text-white/50 italic">
                              <Forward className="w-3 h-3" />
                              <span>{t('forwardedFrom')} @{msg.forwarded_from_username}</span>
                            </div>
                          )}

                          {/* Reply preview */}
                          {msg.replied_message && (
                            <div 
                              className="border-l-2 border-accent/50 pl-2 py-1 bg-black/20 rounded cursor-pointer hover:bg-black/30 transition-colors"
                              onClick={() => scrollToMessage(msg.replied_message.id)}
                            >
                              <p className="text-sm text-accent font-medium mb-0.5">
                                {msg.replied_message.sender_id === user?.id ? t('you') : (selectedChat.display_name || selectedChat.username)}
                              </p>
                              <p className="text-sm opacity-80 line-clamp-2">
                                {msg.replied_message.file_url && msg.replied_message.message_type === 'image' 
                                  ? '📷 ' + t('photo')
                                  : msg.replied_message.text}
                              </p>
                            </div>
                          )}
                          
                          {/* Image if present */}
                          {msg.file_url && msg.message_type === 'image' && (
                            <MessageImage url={msg.file_url} />
                          )}

                          {/* Text and time */}
                          {msg.text && !msg.text.startsWith('[image]') && (
                            <div className="flex items-end gap-2">
                              <MessageText text={msg.text} users={[...recentChats, selectedChat]} />
                              <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0 pb-0.5">
                                {msg.edited_at && (
                                  <div title={t('edited')}>
                                    <Edit className="w-3 h-3 opacity-40" />
                                  </div>
                                )}
                                <p className="text-xs opacity-60">
                                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {isSent && (
                                  <span className={`text-xs ${msg.is_read ? 'text-accent' : 'opacity-60'}`} title={msg.is_read ? t('messageRead') : t('messageSent')}>
                                    {msg.is_read ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Time for image-only messages */}
                          {msg.file_url && (!msg.text || msg.text.startsWith('[image]')) && (
                            <div className="flex items-center gap-1 justify-end">
                              {msg.edited_at && (
                                <div title={t('edited')}>
                                  <Edit className="w-3 h-3 opacity-40" />
                                </div>
                              )}
                              <p className="text-xs opacity-60">
                                {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {isSent && (
                                <span className={`text-xs ${msg.is_read ? 'text-accent' : 'opacity-60'}`} title={msg.is_read ? t('messageRead') : t('messageSent')}>
                                  {msg.is_read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-1">
                              {Object.entries(
                                msg.reactions.reduce((acc: Record<string, number>, r: Reaction) => {
                                  acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                  return acc
                                }, {} as Record<string, number>)
                              ).map(([emoji, count]) => {
                                const isMyReaction = msg.reactions?.some((r: Reaction) => r.emoji === emoji && r.user_id === user?.id)
                                return (
                                  <button
                                    key={emoji}
                                    onClick={(e) => { 
                                      e.stopPropagation()
                                      handleReaction(msg.id, emoji)
                                    }}
                                    className={`text-base px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                                      isMyReaction ? 'bg-accent/20 border border-accent/30' : 'bg-white/5 hover:bg-white/10'
                                    } transition-colors`}
                                  >
                                    <span className="leading-none">{emoji}</span>
                                    <span className="opacity-70 text-[10px] leading-none">{count as number}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )
                })}
                </AnimatePresence>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    ) : (
      <div className="flex-1 glass rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full gradient-accent-soft flex items-center justify-center">
            <Search className="w-16 h-16 text-accent/50" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t('selectChat')}</h2>
          <p className="text-white/60">{t('selectChatDescription')}</p>
        </div>
      </div>
    ),

    chatInput: selectedChat ? (
      <div className={`glass rounded-2xl p-4 flex-shrink-0 ${replyingTo || editingMessage ? 'h-auto' : 'h-20'}`}>
        {/* Reply/Edit preview */}
        <AnimatePresence mode="wait">
          {replyingTo && (
            <motion.div
              key="reply"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 0.5
                }
              }}
              exit={{ 
                opacity: 0, 
                y: -10, 
                scale: 0.95,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 0.5
                }
              }}
              className="mb-3 flex items-start gap-2 p-3 bg-white/5 rounded-xl border border-accent/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <p className="text-sm text-accent font-medium">
                    {t('replyingTo')} {replyingTo.sender_id === user?.id ? t('yourself') : (selectedChat.display_name || selectedChat.username)}
                  </p>
                </div>
                <p className="text-sm text-white/70 line-clamp-2">
                  {replyingTo.file_url && replyingTo.message_type === 'image' 
                    ? '📷 ' + t('photo')
                    : replyingTo.text}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
          
          {editingMessage && (
            <motion.div
              key="edit"
              initial={{ 
                opacity: 0, 
                y: 10,
                scale: 0.95
              }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 0.5
                }
              }}
              exit={{ 
                opacity: 0, 
                y: -10,
                scale: 0.95,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 0.5
                }
              }}
              className="mb-3 flex items-start gap-2 p-3 bg-blue-500/10 rounded-xl border border-blue-500/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Edit className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <p className="text-sm text-blue-400 font-medium">
                    {t('editing')}
                  </p>
                </div>
                <p className="text-sm text-white/70 line-clamp-2">
                  {editingMessage.text}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingMessage(null)
                  setMessageText('')
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 h-full relative">
          {/* Voice Recorder Overlay */}
          <button 
            type="button" 
            onClick={() => setIsFileUploadOpen(true)}
            className="p-2 glass-hover rounded-xl transition-all hover:scale-110 pointer-events-auto"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <MentionInput
            value={messageText}
            onChange={(value) => {
              setMessageText(value)
              
              // Отправляем typing_start при начале ввода
              if (selectedChat && value.length > 0) {
                wsService.sendTypingStart(selectedChat.id)
                
                // Сбрасываем предыдущий таймаут
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current)
                }
                
                // Автоматически отправляем typing_stop через 3 секунды
                typingTimeoutRef.current = setTimeout(() => {
                  if (selectedChat) {
                    wsService.sendTypingStop(selectedChat.id)
                  }
                }, 3000)
              } else if (selectedChat && value.length === 0) {
                // Если текст очищен, сразу отправляем typing_stop
                wsService.sendTypingStop(selectedChat.id)
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current)
                }
              }
            }}
            onSubmit={() => handleSendMessage({ preventDefault: () => {} } as any)}
            users={recentChats}
            placeholder={t('typeMessage')}
            disabled={isCustomizing}
            className="flex-1 input"
          />
          <div className="relative">
            <button 
              type="button" 
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="p-2 glass-hover rounded-xl transition-all hover:scale-110 pointer-events-auto"
              title={t('emojiPicker')}
            >
              <Smile className="w-5 h-5" />
            </button>
            {isEmojiPickerOpen && (
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setIsEmojiPickerOpen(false)}
              />
            )}
          </div>
          <button 
            type="submit"
            disabled={!messageText.trim()}
            className="p-3 btn-primary rounded-xl transition-all hover:scale-110 pointer-events-auto disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    ) : (
      <div className="glass rounded-2xl flex-shrink-0 h-20 flex items-center justify-center">
        <p className="text-white/60 text-center">{t('selectChatDescription')}</p>
      </div>
    ),

    // Widgets - добавляем key с языком для перерендера при смене языка
    clockWidget: <ClockWidget key={`clock-${language}`} />,
    weatherWidget: <WeatherWidget key={`weather-${language}`} />,
    quoteWidget: <QuoteWidget key={`quote-${language}`} />,
    statsWidget: <StatsWidget key={`stats-${language}`} />,
    systemWidget: <SystemWidget key={`system-${language}`} />,
    asciiWidget: <AsciiWidget key={`ascii-${language}`} />,
    emptyWidget: <EmptyWidget key={`empty-${language}`} />
  }

  return (
    <>
      {/* Полноэкранный экран звонка */}
      <CallScreen />
      
      {/* Панель кастомизации (только на десктопе) */}
      {isCustomizing && !isMobile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl px-6 py-3 border-2 border-accent/30 flex items-center gap-4"
        >
          <p className="text-sm text-accent font-medium">
            🎨 {t('customizationActive')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={resetLayout}
              className="btn-secondary text-sm py-1 px-3"
              title={t('reset')}
            >
              {t('reset')}
            </button>
            <button
              onClick={toggleCustomizing}
              className="btn-primary text-sm py-1 px-3"
            >
              {t('exit')}
            </button>
          </div>
        </motion.div>
      )}
      
      {/* Мобильная версия без виджетов и drag&drop */}
      {isMobile ? (
        <MobileLayout 
          components={components} 
          selectedChat={selectedChat}
          onBackToList={() => setSelectedChat(null)}
        />
      ) : (
        /* Десктопная версия с кастомизацией */
        <DualColumnLayout components={components} />
      )}
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {isFileUploadOpen && (
        <FileUpload
          onFileUploaded={handleFileUploaded}
          onClose={() => setIsFileUploadOpen(false)}
        />
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <MessageContextMenu
            message={contextMenu.message}
            position={contextMenu.position}
            onClose={() => setContextMenu(null)}
            onReply={() => {
              setReplyingTo(contextMenu.message)
              setEditingMessage(null) // Cancel editing if replying
              setMessageText('') // Clear input
              setContextMenu(null)
            }}
            onEdit={() => {
              setEditingMessage(contextMenu.message)
              setMessageText(contextMenu.message.text)
              setReplyingTo(null) // Cancel reply if editing
              setContextMenu(null)
            }}
            onDeleteForMe={() => {
              handleDeleteMessage(contextMenu.message.id, false)
              setContextMenu(null)
            }}
            onDeleteForEveryone={
              contextMenu.message.sender_id === user?.id
                ? () => {
                    handleDeleteMessage(contextMenu.message.id, true)
                    setContextMenu(null)
                  }
                : undefined
            }
            onForward={() => {
              setForwardingMessage(contextMenu.message)
              setIsForwardModalOpen(true)
              setContextMenu(null)
            }}
            onReaction={(emoji) => {
              handleReaction(contextMenu.message.id, emoji)
              setContextMenu(null)
            }}
            onCopy={() => {}}
            isSent={contextMenu.message.sender_id === useAuthStore.getState().user?.id}
          />
        )}
      </AnimatePresence>

      {/* Forward Modal */}
      <ForwardModal
        isOpen={isForwardModalOpen}
        onClose={() => {
          setIsForwardModalOpen(false)
          setForwardingMessage(null)
        }}
        onForward={handleForwardMessage}
        messageText={forwardingMessage?.text || forwardingMessage?.file_url || ''}
      />
    </>
  )
}

import { useState, useEffect, useRef, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, PhoneOff, Pin, X } from 'lucide-react'
import { wsService } from '../services/websocket'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import UserProfileView from './UserProfileView'
import MessageImage from './MessageImage'
import MessageContextMenu from './MessageContextMenu'
import { groupMessagesByDate, formatMessageDate } from '../utils/dateUtils'
import { useTranslation } from '../hooks/useTranslation'

interface Reaction {
  id: string
  user_id: string
  emoji: string
  created_at: string
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  text: string
  created_at: string
  sender_name?: string
  is_read?: boolean
  read_at?: string | null
  file_url?: string
  message_type?: string
  reply_to_id?: string | null
  replied_message?: Message | null
  pinned_at?: string | null
  reactions?: Reaction[]
}

interface ChatWindowProps {
  chat: {
    id: string
    username: string
    display_name?: string
  }
  onlineUsers: string[]
}

export default function ChatWindow({ chat, onlineUsers }: ChatWindowProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [isCallMinimized, setIsCallMinimized] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    message: Message
    position: { x: number; y: number }
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const { user } = useAuthStore()
  const { t } = useTranslation()

  // Update pinned message when messages change
  useEffect(() => {
    const pinned = messages.find(m => m.pinned_at)
    setPinnedMessage(pinned || null)
  }, [messages])

  const handlePinMessage = async (messageId: string) => {
    try {
      await api.post(`/api/messages/${messageId}/pin`)
      setContextMenu(null)
    } catch (error) {
      console.error('Failed to pin message:', error)
    }
  }

  const handleUnpinMessage = async (messageId: string) => {
    try {
      await api.post(`/api/messages/${messageId}/unpin`)
      setContextMenu(null)
    } catch (error) {
      console.error('Failed to unpin message:', error)
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const msg = messages.find(m => m.id === messageId)
      if (!msg) return

      const existingReaction = msg.reactions?.find(r => r.user_id === user?.id && r.emoji === emoji)
      
      if (existingReaction) {
        await api.delete(`/api/messages/${messageId}/reactions`, { data: { emoji } })
      } else {
        await api.post(`/api/messages/${messageId}/reactions`, { emoji })
      }
      setContextMenu(null)
    } catch (error) {
      console.error('Failed to update reaction:', error)
    }
  }

  const isOnline = onlineUsers.includes(chat.id)

  useEffect(() => {
    loadMessages()
    
    const handleNewMessage = (data: any) => {
      const msg = data
      if (
        (msg.sender_id === chat.id && msg.receiver_id === user?.id) ||
        (msg.sender_id === user?.id && msg.receiver_id === chat.id)
      ) {
        setMessages((prev) => [...prev, msg])
        
        // Mark as read if chat is open
        if (msg.sender_id === chat.id && wsService.isConnected()) {
          wsService.markMessagesAsRead(chat.id)
        }
      }
    }

    const handleMessagesRead = (data: any) => {
      // Update messages to show as read
      if (data.sender_id === user?.id && data.reader_id === chat.id) {
        setMessages(prev => prev.map(msg => {
          if (msg.sender_id === user?.id && msg.receiver_id === chat.id && !msg.is_read) {
            return { ...msg, is_read: true, read_at: data.read_at }
          }
          return msg
        }))
      }
    }

    const handleMessagePinned = (data: any) => {
       setMessages(prev => prev.map(m => 
         m.id === data.message_id ? { ...m, pinned_at: data.pinned_at } : { ...m, pinned_at: null }
       ))
    }

    const handleMessageUnpinned = (data: any) => {
       setMessages(prev => prev.map(m => 
         m.id === data.message_id ? { ...m, pinned_at: null } : m
       ))
    }

    const handleReactionAdded = (data: any) => {
       setMessages(prev => prev.map(m => {
         if (m.id === data.message_id) {
           const exists = m.reactions?.some(r => r.user_id === data.user_id && r.emoji === data.emoji)
           if (exists) return m

           const newReaction = { id: Date.now().toString(), user_id: data.user_id, emoji: data.emoji, created_at: new Date().toISOString() }
           return { ...m, reactions: [...(m.reactions || []), newReaction] }
         }
         return m
       }))
    }

    const handleReactionRemoved = (data: any) => {
        setMessages(prev => prev.map(m => {
         if (m.id === data.message_id) {
           return { ...m, reactions: (m.reactions || []).filter(r => !(r.user_id === data.user_id && r.emoji === data.emoji)) }
         }
         return m
       }))
    }

    wsService.onNewMessage(handleNewMessage)
    wsService.onMessagesRead(handleMessagesRead)
    wsService.on('message_pinned', handleMessagePinned)
    wsService.on('message_unpinned', handleMessageUnpinned)
    wsService.on('reaction_added', handleReactionAdded)
    wsService.on('reaction_removed', handleReactionRemoved)

    return () => {
      wsService.off('new_message', handleNewMessage)
      wsService.off('messages_read', handleMessagesRead)
      wsService.off('message_pinned', handleMessagePinned)
      wsService.off('message_unpinned', handleMessageUnpinned)
      wsService.off('reaction_added', handleReactionAdded)
      wsService.off('reaction_removed', handleReactionRemoved)
    }
  }, [chat.id, user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/messages/${chat.id}`)
      setMessages(response.data || [])
      
      // Mark messages as read when opening chat
      if (wsService.isConnected()) {
        wsService.markMessagesAsRead(chat.id)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim()) return

    // Add message locally immediately
    const newMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user?.id || '',
      receiver_id: chat.id,
      text: message,
      created_at: new Date().toISOString(),
      reply_to_id: replyingTo?.id || null,
      replied_message: replyingTo || null,
    }
    setMessages((prev) => [...prev, newMessage])

    // Send via WebSocket
    wsService.sendMessage(chat.id, message, replyingTo?.id || undefined)
    setMessage('')
    setReplyingTo(null)
  }

  const handleReply = (msg: Message) => {
    setReplyingTo(msg)
    setContextMenu(null)
  }

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault()
    console.log('Context menu triggered for message:', msg.id)
    
    // Calculate position
    const x = e.clientX
    const y = e.clientY
    
    console.log('Menu position:', { x, y })
    
    // Adjust if menu would go off screen
    const menuWidth = 180
    const menuHeight = 200
    const adjustedX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x
    const adjustedY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y
    
    console.log('Adjusted position:', { adjustedX, adjustedY })
    
    setContextMenu({
      message: msg,
      position: { x: adjustedX, y: adjustedY }
    })
    
    console.log('Context menu state set')
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

  return (
    <div className="h-full flex flex-col gap-4 relative">
      {/* 1. Dynamic Island - Свернутый звонок */}
      <AnimatePresence>
        {isCallMinimized && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass px-6 py-3 rounded-full shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <span className="text-sm font-semibold">{chat.username[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{chat.display_name || chat.username}</p>
                    <p className="text-xs text-white/60">Звонок активен</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-green-500"
                  />
                  <button
                    onClick={() => setIsCallMinimized(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-all"
                  >
                    <PhoneOff className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Header - Информация о пользователе */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass rounded-2xl p-4 flex-shrink-0 h-20 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsProfileOpen(true)}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <span className="text-lg font-semibold">{chat.username[0].toUpperCase()}</span>
              </div>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-slate-900 shadow-lg shadow-green-500/50" />
              )}
            </div>
            <div>
              <p className="font-medium text-lg">{chat.display_name || chat.username}</p>
              <p className="text-sm text-white/60">
                {isOnline ? 'В сети' : 'Не в сети'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="p-3 glass-hover rounded-xl transition-all hover:scale-110">
              <Phone className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsCallMinimized(true)}
              className="p-3 glass-hover rounded-xl transition-all hover:scale-110"
            >
              <Video className="w-5 h-5" />
            </button>
            <button className="p-3 glass-hover rounded-xl transition-all hover:scale-110">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Pinned Message Bar */}
      {pinnedMessage && (
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass rounded-xl p-2 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors mx-4 mb-2 shrink-0"
           onClick={() => {
             const el = document.getElementById(`message-${pinnedMessage.id}`)
             if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
           }}
        >
          <div className="w-1 h-8 bg-cyan-500 rounded-full ml-2"></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-cyan-500 font-medium">{t('pinnedMessage')}</p>
            <p className="text-sm text-white/90 truncate">
               {pinnedMessage.text || (pinnedMessage.file_url ? t('photo') : '')}
            </p>
          </div>
          <button 
             onClick={(e) => { e.stopPropagation(); handleUnpinMessage(pinnedMessage.id); }}
             className="p-1.5 hover:bg-white/10 rounded-full mr-2"
          >
             <X className="w-4 h-4 opacity-70" />
          </button>
        </motion.div>
      )}

      {/* Messages Area - Средний контейнер */}
      <div className="flex-1 glass rounded-2xl p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
              />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white/60">
                <p className="text-lg">Нет сообщений</p>
                <p className="text-sm mt-2">Отправьте первое сообщение!</p>
              </div>
            </div>
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
                {group.messages.map((msg, index) => {
                  const isSent = msg.sender_id === user?.id
                  const isNewMessage = index === group.messages.length - 1
                  
                  // Проверяем группировку сообщений
                  const prevMsg = index > 0 ? group.messages[index - 1] : null
                  
                  const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id
                  
                  // Определяем отступы: 1px внутри группы, 12px между группами
                  const marginTop = isFirstInGroup ? 'mt-3' : 'mt-0.5'
                  
                  return (
                    <motion.div
                      key={msg.id}
                      id={`message-${msg.id}`}
                      ref={(el) => {
                        if (el) messageRefs.current.set(msg.id, el)
                      }}
                      initial={isNewMessage ? { opacity: 0, scale: 0.95 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'} ${marginTop} group`}
                    >
                      <div 
                        className={`${isSent ? 'message-sent' : 'message-received'} relative`}
                        onContextMenu={(e) => handleContextMenu(e, msg)}
                      >
                        {msg.pinned_at && (
                          <div className="absolute -right-2 -top-2 bg-cyan-500 text-white rounded-full p-0.5 shadow-sm z-10">
                            <Pin className="w-3 h-3" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          {/* Reply preview */}
                          {msg.replied_message && (
                            <div 
                              className="border-l-2 border-accent/50 pl-2 py-1 bg-black/20 rounded cursor-pointer hover:bg-black/30 transition-colors"
                              onClick={() => scrollToMessage(msg.replied_message!.id)}
                            >
                              <p className="text-xs text-accent font-medium mb-0.5">
                                {msg.replied_message.sender_id === user?.id ? t('you') : (chat.display_name || chat.username)}
                              </p>
                              <p className="text-xs opacity-70 line-clamp-2">
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
                              <p className="break-words">{msg.text}</p>
                              <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0 pb-0.5">
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
                            <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-white/10">
                                {Object.entries(
                                   msg.reactions.reduce((acc, r) => {
                                      acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                      return acc
                                   }, {} as Record<string, number>)
                                ).map(([emoji, count]) => {
                                   const isMyReaction = msg.reactions?.some(r => r.emoji === emoji && r.user_id === user?.id)
                                   return (
                                     <button
                                       key={emoji}
                                       onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                                       className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                                          isMyReaction ? 'bg-black/30' : 'bg-black/10 hover:bg-black/20'
                                       } transition-colors`}
                                     >
                                       <span>{emoji}</span>
                                       <span className="opacity-70 text-[10px]">{count}</span>
                                     </button>
                                   )
                                })}
                            </div>
                          )}
                        </div>
                        
                        {/* Reply button on hover */}
                        <button
                          onClick={() => handleReply(msg)}
                          className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 glass-hover rounded-lg"
                          title={t('reply')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. Input Area - Поле ввода */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass rounded-2xl p-4 flex-shrink-0"
      >
        {/* Reply preview */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex items-start gap-2 p-3 bg-white/5 rounded-xl border border-accent/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <p className="text-sm text-accent font-medium">
                    {t('replyingTo')} {replyingTo.sender_id === user?.id ? t('yourself') : (chat.display_name || chat.username)}
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
        </AnimatePresence>

        <form onSubmit={handleSend} className="flex items-center gap-3">
          {/* Кнопка прикрепления файла */}
          <button
            type="button"
            className="p-3 glass-hover rounded-xl transition-all hover:scale-110 flex-shrink-0"
            title="Прикрепить файл"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Поле ввода */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите сообщение..."
            className="flex-1 input"
          />

          {/* Кнопка смайликов */}
          <button
            type="button"
            className="p-3 glass-hover rounded-xl transition-all hover:scale-110 flex-shrink-0"
            title="Смайлики"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Кнопка отправить */}
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-3 btn-primary rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 flex-shrink-0"
            title="Отправить"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </motion.div>

      {/* User Profile Modal */}
      <UserProfileView 
        user={chat}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <MessageContextMenu
            message={contextMenu.message}
            position={contextMenu.position}
            onClose={() => setContextMenu(null)}
            onReply={() => handleReply(contextMenu.message)}
            onCopy={() => {}}
            onPin={pinnedMessage?.id === contextMenu.message.id ? undefined : () => handlePinMessage(contextMenu.message.id)}
            onUnpin={pinnedMessage?.id === contextMenu.message.id ? () => handleUnpinMessage(contextMenu.message.id) : undefined}
            onReaction={(emoji) => handleReaction(contextMenu.message.id, emoji)}
            isSent={contextMenu.message.sender_id === user?.id}
            isPinned={!!contextMenu.message.pinned_at}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

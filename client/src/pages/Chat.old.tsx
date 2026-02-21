import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Settings, LogOut, Search } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import ChatWindow from '../components/ChatWindow.tsx'
import UserProfile from '../components/UserProfile.tsx'
import api from '../services/api'
import { wsService } from '../services/websocket'

interface User {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  is_online?: boolean
}

export default function Chat() {
  const { logout, token } = useAuthStore()
  const [selectedChat, setSelectedChat] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [recentChats, setRecentChats] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    if (token) {
      wsService.connect(token)
      
      wsService.onOnlineUsers((data: any) => {
        setOnlineUsers(data.users || [])
      })

      // Listen for new messages to update recent chats
      const handleNewMessage = () => {
        // Reload recent chats when a new message arrives
        loadRecentChats()
      }

      wsService.onNewMessage(handleNewMessage)

      // Load recent chats
      loadRecentChats()

      return () => {
        wsService.off('new_message', handleNewMessage)
        wsService.disconnect()
      }
    }
  }, [token])

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
    
    // Add to recent chats if not already there
    if (!recentChats.find(chat => chat.id === user.id)) {
      setRecentChats(prev => [user, ...prev])
    }
    
    // Clear search
    setSearchQuery('')
    setUsers([])
  }

  const handleLogout = () => {
    wsService.disconnect()
    logout()
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 gap-4">
      {/* Sidebar - 3 отдельных контейнера */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-80 flex flex-col gap-4"
      >
        {/* 1. Верхняя часть - Лого и кнопки */}
        <div className="glass rounded-2xl p-4 flex-shrink-0 h-20 flex items-center">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Квант 2.0
            </h1>
            <div className="flex gap-2">
              <button className="p-2 glass-hover rounded-xl transition-all hover:scale-110">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={handleLogout} className="p-2 glass-hover rounded-xl text-red-400 transition-all hover:scale-110">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Средняя часть - Поиск и список контактов */}
        <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-4 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <AnimatePresence mode="wait">
              {searchQuery.length >= 2 ? (
                // Search results
                <>
                  {users.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 text-center text-white/60"
                    >
                      Пользователи не найдены
                    </motion.div>
                  ) : (
                    users.map((u, index) => (
                      <motion.button
                        key={u.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectChat(u)}
                        className={`w-full p-4 flex items-center gap-3 transition-all border-b border-white/5 rounded-xl ${
                          selectedChat?.id === u.id 
                            ? 'chat-item-active' 
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
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
                    ))
                  )}
                </>
              ) : (
                // Recent chats
                <>
                  {recentChats.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 text-center text-white/60"
                    >
                      Начните вводить имя для поиска
                    </motion.div>
                  ) : (
                    recentChats.map((u, index) => (
                      <motion.button
                        key={u.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectChat(u)}
                        className={`w-full p-4 flex items-center gap-3 transition-all border-b border-white/5 rounded-xl ${
                          selectedChat?.id === u.id 
                            ? 'chat-item-active' 
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
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
                    ))
                  )}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3. Нижняя часть - Профиль пользователя */}
        <UserProfile />
      </motion.div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <ChatWindow chat={selectedChat} onlineUsers={onlineUsers} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center opacity-50"
              >
                <MessageSquare className="w-12 h-12" />
              </motion.div>
              <p className="text-white/60">Найдите пользователя для начала общения</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

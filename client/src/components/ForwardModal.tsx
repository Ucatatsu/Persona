import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Send } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import api from '../services/api'

interface User {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  is_online?: boolean
}

interface ForwardModalProps {
  isOpen: boolean
  onClose: () => void
  onForward: (userId: string) => void
  messageText: string
}

export default function ForwardModal({ isOpen, onClose, onForward, messageText }: ForwardModalProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [recentChats, setRecentChats] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadRecentChats()
    }
  }, [isOpen])

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

  const handleForward = async () => {
    if (!selectedUser) return
    
    setLoading(true)
    try {
      await onForward(selectedUser.id)
      onClose()
      setSelectedUser(null)
      setSearchQuery('')
    } catch (error) {
      console.error('Forward error:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayUsers = searchQuery.length >= 2 ? users : recentChats

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md glass rounded-2xl overflow-hidden flex flex-col max-h-[600px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-accent">{t('forwardMessage')}</h2>
              <button
                onClick={onClose}
                className="p-2 glass-hover rounded-xl transition-all hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Message preview */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex-shrink-0">
              <p className="text-sm text-white/60 mb-1">{t('forwardingMessage')}:</p>
              <p className="text-sm line-clamp-2">{messageText}</p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/10 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder={t('searchUsers')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Users list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {displayUsers.length === 0 ? (
                <div className="p-8 text-center text-white/60">
                  {searchQuery.length >= 2 ? t('noUsersFound') : t('startTyping')}
                </div>
              ) : (
                <div className="p-2">
                  {displayUsers.map((user) => (
                    <motion.button
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-3 flex items-center gap-3 rounded-xl transition-all ${
                        selectedUser?.id === user.id
                          ? 'gradient-accent-soft border-2 border-accent'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                          <span className="text-lg font-semibold">{user.username[0].toUpperCase()}</span>
                        </div>
                        {user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-slate-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium truncate">{user.display_name || user.username}</p>
                        <p className="text-sm text-white/60 truncate">@{user.username}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex gap-3 flex-shrink-0">
              <button
                onClick={onClose}
                className="flex-1 btn-secondary"
                disabled={loading}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleForward}
                disabled={!selectedUser || loading}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? t('sending') : t('forward')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

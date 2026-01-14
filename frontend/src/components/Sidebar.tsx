import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, ChevronLeft, ChevronRight, Settings, LogOut, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface SidebarProps {
  currentChatId: string | null
  onChatSelect: (chatId: string) => void
  onToggle: () => void
  sidebarOpen: boolean
}

export default function Sidebar({ currentChatId, onChatSelect, onToggle, sidebarOpen }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { user, logout } = useAuthStore()

  // Чаты будут загружаться из API
  const hasChats = false

  return (
    <motion.div
      className={`h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg flex flex-col ${
        sidebarOpen ? '' : 'items-center py-4'
      }`}
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Заголовок и кнопки */}
      {sidebarOpen ? (
        <div className="p-5 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Чаты
            </h2>
            <div className="flex items-center space-x-2">
              <motion.button
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Новый чат"
              >
                <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </motion.button>
              <motion.button
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggle}
                title="Скрыть сайдбар"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </motion.button>
            </div>
          </div>

          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск чатов..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center space-y-3">
          <motion.button
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            title="Показать чаты"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>
          <motion.button
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Новый чат"
          >
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>
        </div>
      )}

      {/* Список чатов (только когда открыт) */}
      {sidebarOpen && (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
          {!hasChats && (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">
                {searchQuery ? 'Чаты не найдены' : 'Нет активных чатов'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Профиль и настройки */}
      <div className={`border-t border-gray-200/50 dark:border-gray-700/50 p-4 ${sidebarOpen ? '' : 'flex-col'}`}>
        {sidebarOpen ? (
          /* Развёрнутый режим */
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center shadow-md">
                <span className="text-white font-medium text-sm">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.display_name || user?.username || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.status === 'online' ? 'В сети' : 'Не в сети'}
                </p>
              </div>
            </div>

            {/* Кнопка настроек */}
            <div className="relative">
              <motion.button
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettingsOpen(!settingsOpen)}
                title="Настройки"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.button>

              {settingsOpen && (
                <motion.div
                  className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 py-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <motion.button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 rounded-xl mx-1"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSettingsOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Настройки</span>
                  </motion.button>
                  <motion.button
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 rounded-xl mx-1"
                    whileHover={{ scale: 1.02 }}
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Выйти</span>
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          /* Свёрнутый режим - только кнопка настроек */
          <div className="relative">
            <motion.button
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSettingsOpen(!settingsOpen)}
              title="Настройки"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </motion.button>

            {settingsOpen && (
              <motion.div
                className="absolute left-full bottom-0 ml-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 py-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                  {user?.display_name || user?.username || 'Пользователь'}
                </div>
                <motion.button
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 rounded-xl mx-1"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSettingsOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Настройки</span>
                </motion.button>
                <motion.button
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 rounded-xl mx-1"
                  whileHover={{ scale: 1.02 }}
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выйти</span>
                </motion.button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
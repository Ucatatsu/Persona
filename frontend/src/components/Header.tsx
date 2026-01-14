import { motion } from 'framer-motion'
import { Phone, Video, Settings, Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'

export default function Header() {
  const { theme, toggleTheme } = useThemeStore()
  const { user, logout } = useAuthStore()

  return (
    <motion.header
      className="mx-4 mt-4 mb-2 rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg flex items-center justify-between px-6 py-3"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Левая часть - Логотип */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-base">К</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Квант v2.0
        </h1>
      </div>

      {/* Центр - Динамический остров звонка */}
      <motion.div
        className="hidden md:flex items-center space-x-3 px-6 py-2.5 dynamic-island"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Готов к звонкам
        </span>
      </motion.div>

      {/* Правая часть - Действия */}
      <div className="flex items-center space-x-2">
        {/* Кнопки звонков */}
        <motion.button
          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Голосовой звонок"
        >
          <Phone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </motion.button>

        <motion.button
          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Видео звонок"
        >
          <Video className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </motion.button>

        {/* Переключатель темы */}
        <motion.button
          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          title="Переключить тему"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </motion.button>

        {/* Профиль пользователя */}
        <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center shadow-md">
              <span className="text-white font-medium text-sm">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.display_name || user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.status === 'online' ? 'В сети' : 'Не в сети'}
              </p>
            </div>
          </div>

          {/* Настройки */}
          <motion.button
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            title="Настройки"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}
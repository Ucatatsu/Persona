import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, Smile, Menu } from 'lucide-react'

interface ChatAreaProps {
  chatId: string | null
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

// Моковые сообщения (удалены для чистого демо)

export default function ChatArea({ chatId, sidebarOpen, onToggleSidebar }: ChatAreaProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // TODO: Отправить сообщение через WebSocket
    console.log('Sending message:', message)
    setMessage('')
  }

  // Если чат не выбран
  if (!chatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <motion.div
          className="text-center p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center shadow-xl">
            <Send className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            Выберите чат
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Выберите чат из списка слева, чтобы начать общение
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
        {/* Сообщения будут здесь */}
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p>Нет сообщений</p>
        </div>
      </div>

      {/* Поле ввода сообщения */}
      <motion.div
        className="border-t border-gray-200/50 dark:border-gray-700/50 p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <motion.button
                type="button"
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.button>
            </div>
            
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите сообщение..."
                className="w-full px-5 py-3.5 pr-12 bg-gray-100 dark:bg-gray-700 border-0 rounded-3xl resize-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                style={{ minHeight: '52px', maxHeight: '120px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
              
              <motion.button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Smile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.button>
            </div>
          </div>
          
          <motion.button
            type="submit"
            className="p-3.5 bg-primary-600 text-white rounded-3xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            disabled={!message.trim()}
            whileHover={{ scale: message.trim() ? 1.05 : 1 }}
            whileTap={{ scale: message.trim() ? 0.95 : 1 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
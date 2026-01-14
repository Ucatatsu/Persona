import { useState } from 'react'
import { motion } from 'framer-motion'

// Компоненты
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Хедер - динамический остров */}
      <Header />

      {/* Основная область с сеткой */}
      <div className="flex-1 flex overflow-hidden px-4 pb-4 gap-4">
        {/* Сайдбар */}
        <motion.div
          className={`${sidebarOpen ? 'w-80' : 'w-20'} flex-shrink-0`}
          animate={{ width: sidebarOpen ? 320 : 80 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <Sidebar
            currentChatId={currentChatId}
            onChatSelect={setCurrentChatId}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
          />
        </motion.div>

        {/* Область чата */}
        <ChatArea
          chatId={currentChatId}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>
    </div>
  )
}
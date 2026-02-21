import { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { LayoutComponent } from '../store/layoutStore'

interface MobileLayoutProps {
  components: Record<LayoutComponent, ReactNode>
  selectedChat: any
  onBackToList: () => void
}

export default function MobileLayout({ components, selectedChat, onBackToList }: MobileLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Показываем список чатов, если чат не выбран */}
      {!selectedChat ? (
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          {/* Header */}
          {components.header}
          
          {/* Search */}
          {components.search}
          
          {/* Profile */}
          {components.profile}
          
          {/* Contacts List */}
          <div className="flex-1 overflow-hidden">
            {components.contacts}
          </div>
        </div>
      ) : (
        /* Показываем окно чата, если чат выбран */
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          {/* Chat Header с кнопкой назад */}
          <div className="glass rounded-2xl p-4 flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onBackToList}
              className="p-2 glass-hover rounded-xl transition-all hover:scale-110 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold">{selectedChat.username[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedChat.display_name || selectedChat.username}</p>
                <p className="text-xs text-white/60 truncate">@{selectedChat.username}</p>
              </div>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-hidden">
            {components.chatMessages}
          </div>
          
          {/* Chat Input */}
          <div className="flex-shrink-0">
            {components.chatInput}
          </div>
        </div>
      )}
    </div>
  )
}

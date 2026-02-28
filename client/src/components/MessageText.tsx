import { useState, useRef, useEffect, memo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface MessageTextProps {
  text: string
  users?: Array<{ id: string; username: string; display_name?: string; avatar_url?: string; name_color?: string }>
}

const MessageText = memo(function MessageText({ text, users = [] }: MessageTextProps) {
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const popupRef = useRef<HTMLDivElement>(null)

  // Создаём маппинг username -> user object
  const userMap = new Map(
    users.map(u => [u.username.toLowerCase(), u])
  )

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectedUser(null)
      }
    }

    if (selectedUser) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedUser])

  const handleMentionClick = (e: React.MouseEvent, user: typeof users[0]) => {
    e.stopPropagation()
    
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth
    
    const popupWidth = 300
    const popupHeight = 200
    
    // По умолчанию показываем слева от упоминания
    let x = rect.left - popupWidth - 12
    let y = rect.top
    
    // Если не помещается слева, показываем справа
    if (x < 20) {
      x = rect.right + 12
    }
    
    // Если не помещается справа, центрируем по горизонтали
    if (x + popupWidth > windowWidth - 20) {
      x = Math.max(20, (windowWidth - popupWidth) / 2)
    }
    
    // Проверяем вертикальное положение
    if (y + popupHeight > windowHeight - 20) {
      y = windowHeight - popupHeight - 20
    }
    
    if (y < 20) {
      y = 20
    }
    
    setPopupPosition({ x, y })
    setSelectedUser(user)
  }

  // Разбиваем текст на части, выделяя упоминания
  const parts = text.split(/(@\w+)/g)
  
  return (
    <>
      <p className="break-words">
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const username = part.slice(1).toLowerCase()
            const user = userMap.get(username)
            
            // Если нашли пользователя, показываем display_name
            if (user) {
              const displayName = user.display_name || user.username
              return (
                <span 
                  key={index} 
                  className="bg-accent/15 border border-accent/50 px-1.5 py-0.5 rounded hover:bg-accent/25 hover:border-accent/70 transition-colors cursor-pointer"
                  title={part}
                  onClick={(e) => handleMentionClick(e, user)}
                >
                  {displayName}
                </span>
              )
            }
            
            // Иначе просто подсвечиваем тег
            return (
              <span 
                key={index} 
                className="bg-accent/15 border border-accent/50 px-1.5 py-0.5 rounded hover:bg-accent/25 hover:border-accent/70 transition-colors cursor-pointer"
              >
                {part}
              </span>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </p>

      {/* User Profile Popup - используем портал для рендеринга вне контейнера */}
      {selectedUser && createPortal(
        <AnimatePresence>
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[200] w-[300px]"
            style={{ left: `${popupPosition.x}px`, top: `${popupPosition.y}px` }}
          >
            <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Banner */}
              <div className="h-20 gradient-accent relative">
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* Profile Info */}
              <div className="p-4 -mt-8 relative">
                <div className="flex items-end gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center border-4 border-slate-800">
                      <span className="text-xl font-semibold">{selectedUser.username[0].toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 mb-1">
                    <p 
                      className="font-bold text-base truncate" 
                      style={{ color: selectedUser.name_color || '#ffffff' }}
                    >
                      {selectedUser.display_name || selectedUser.username}
                    </p>
                    <p className="text-sm text-white/60">@{selectedUser.username}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  )
})

export default MessageText

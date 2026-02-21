import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  users: User[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function MentionInput({
  value,
  onChange,
  onSubmit,
  users,
  placeholder,
  disabled,
  className
}: MentionInputProps) {
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const mentionRef = useRef<HTMLDivElement>(null)

  // Фильтруем пользователей по запросу
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5)

  // Обработка изменения текста
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    onChange(newValue)

    // Проверяем, есть ли @ перед курсором
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt)
        setMentionPosition(lastAtIndex)
        setShowMentions(true)
        setSelectedIndex(0)
        return
      }
    }
    
    setShowMentions(false)
  }

  // Вставка упоминания
  const insertMention = (user: User) => {
    const beforeMention = value.slice(0, mentionPosition)
    const afterMention = value.slice(mentionPosition + mentionQuery.length + 1)
    const mention = `@${user.username}`
    const newValue = beforeMention + mention + ' ' + afterMention
    
    onChange(newValue)
    setShowMentions(false)
    
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = beforeMention.length + mention.length + 1
        inputRef.current.focus()
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  // Обработка клика по упоминанию
  const handleMentionClick = (e: React.MouseEvent, user: User) => {
    e.preventDefault()
    e.stopPropagation()
    
    const beforeMention = value.slice(0, mentionPosition)
    const afterMention = value.slice(mentionPosition + mentionQuery.length + 1)
    const mention = `@${user.username}`
    const newValue = beforeMention + mention + ' ' + afterMention
    
    onChange(newValue)
    setShowMentions(false)
    
    // Возвращаем фокус
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = beforeMention.length + mention.length + 1
        inputRef.current.focus()
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 10)
  }

  // Обработка клавиш
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentions) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onSubmit()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredUsers.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length)
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        if (filteredUsers[selectedIndex]) {
          insertMention(filteredUsers[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowMentions(false)
        break
    }
  }

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionRef.current && !mentionRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowMentions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />

      {/* Popup с упоминаниями */}
      <AnimatePresence>
        {showMentions && filteredUsers.length > 0 && (
          <motion.div
            ref={mentionRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-[#1e293b] rounded-xl overflow-hidden shadow-2xl border-2 border-accent/50"
          >
            <div className="p-2 space-y-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {filteredUsers.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={(e) => handleMentionClick(e, user)}
                  onMouseDown={(e) => e.preventDefault()}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    index === selectedIndex
                      ? 'bg-accent/20 border border-accent'
                      : 'hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-sm text-white/60 truncate">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

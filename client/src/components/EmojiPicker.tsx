import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
}

const EMOJI_CATEGORIES = {
  recent: { icon: '🕐', emojis: [] as string[] },
  smileys: { 
    icon: '😀', 
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴']
  },
  gestures: {
    icon: '👋',
    emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏']
  },
  hearts: {
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟']
  },
  animals: {
    icon: '🐶',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗']
  },
  food: {
    icon: '🍕',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧈', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙', '🌮', '🌯', '🥪', '🍖', '🍗', '🥩', '🍤', '🍱', '🍛', '🍝', '🍜', '🍲', '🍥', '🍣', '🍦', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪']
  }
}

export default function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState('smileys')
  const [searchQuery, setSearchQuery] = useState('')
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load recent emojis from localStorage
    const stored = localStorage.getItem('recent-emojis')
    if (stored) {
      setRecentEmojis(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    // Close on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    
    // Add to recent
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 30)
    setRecentEmojis(updated)
    localStorage.setItem('recent-emojis', JSON.stringify(updated))
  }

  const filteredEmojis = searchQuery
    ? Object.values(EMOJI_CATEGORIES).flatMap(cat => cat.emojis).filter(emoji => emoji.includes(searchQuery))
    : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.emojis || []

  return (
    <AnimatePresence>
      <motion.div
        ref={pickerRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="absolute bottom-full right-0 mb-2 w-80 shadow-2xl border border-white/20 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="p-3">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder={t('searchEmoji')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 rounded-xl border border-white/10 focus:border-accent focus:outline-none text-sm"
          />
        </div>

        {/* Categories */}
        {!searchQuery && (
          <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-thin">
            {recentEmojis.length > 0 && (
              <button
                onClick={() => setActiveCategory('recent')}
                className={`p-2 rounded-lg transition-all ${
                  activeCategory === 'recent' ? 'bg-accent/20' : 'hover:bg-white/5'
                }`}
              >
                <Clock className="w-5 h-5" />
              </button>
            )}
            {Object.entries(EMOJI_CATEGORIES).filter(([key]) => key !== 'recent').map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`p-2 rounded-lg transition-all text-xl ${
                  activeCategory === key ? 'bg-accent/20' : 'hover:bg-white/5'
                }`}
              >
                {cat.icon}
              </button>
            ))}
          </div>
        )}

        {/* Emojis grid */}
        <div className="h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <div className="grid grid-cols-8 gap-1">
            {(activeCategory === 'recent' ? recentEmojis : filteredEmojis).map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="p-2 text-2xl hover:bg-white/10 rounded-lg transition-all hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

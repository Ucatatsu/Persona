import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

interface MessageSearchProps {
  isOpen: boolean
  onClose: () => void
  messages: any[]
  onNavigate: (messageId: string) => void
}

export default function MessageSearch({ isOpen, onClose, messages, onNavigate }: MessageSearchProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Search messages
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([])
      setCurrentIndex(0)
      return
    }

    const query = searchQuery.toLowerCase()
    const results = messages.filter(msg => 
      msg.text && msg.text.toLowerCase().includes(query)
    )
    
    setSearchResults(results)
    setCurrentIndex(0)
    
    // Navigate to first result after a delay to ensure refs are ready
    if (results.length > 0) {
      setTimeout(() => {
        onNavigate(results[0].id)
      }, 200)
    }
  }, [searchQuery, messages, onNavigate])

  // Navigate to previous result
  const handlePrevious = () => {
    if (searchResults.length === 0) return
    // Stop at the beginning instead of cycling
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      onNavigate(searchResults[newIndex].id)
    }
  }

  // Navigate to next result
  const handleNext = () => {
    if (searchResults.length === 0) return
    // Stop at the end instead of cycling
    if (currentIndex < searchResults.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      onNavigate(searchResults[newIndex].id)
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
        e.preventDefault()
        handlePrevious()
      } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        handleNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, searchResults, currentIndex])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="absolute top-0 left-0 right-0 z-10 glass border-b border-white/10 p-3"
      >
        <div className="flex items-center gap-2">
          {/* Search icon */}
          <Search className="w-5 h-5 text-white/40 flex-shrink-0" />

          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchInChat')}
            className="flex-1 bg-transparent outline-none text-sm"
          />

          {/* Results counter */}
          {searchResults.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>
                {currentIndex + 1} {t('of')} {searchResults.length}
              </span>

              {/* Navigation buttons */}
              <div className="flex gap-1">
                <button
                  onClick={handlePrevious}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title={t('previousResult')}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title={t('nextResult')}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* No results */}
          {searchQuery.trim().length > 0 && searchResults.length === 0 && (
            <span className="text-sm text-white/40">{t('noResults')}</span>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
            title={t('closeSearch')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

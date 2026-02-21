import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Reply, Edit, Trash2, Forward, Copy, ChevronLeft, Pin, PinOff } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

interface Message {
  id: string
  sender_id: string
  text: string
  file_url?: string
  message_type?: string
}

interface MessageContextMenuProps {
  message: Message | null
  position: { x: number; y: number }
  onClose: () => void
  onReply: () => void
  onEdit?: () => void
  onDelete?: () => void
  onDeleteForMe?: () => void
  onDeleteForEveryone?: () => void
  onForward?: () => void
  onCopy?: () => void
  onPin?: () => void
  onUnpin?: () => void
  onReaction?: (emoji: string) => void
  isSent: boolean
  isPinned?: boolean
}

export default function MessageContextMenu({
  message,
  position,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onDeleteForMe,
  onDeleteForEveryone,
  onForward,
  onCopy,
  onPin,
  onUnpin,
  onReaction,
  isSent,
  isPinned,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const { t } = useTranslation()
  const [showDeleteSubmenu, setShowDeleteSubmenu] = useState(false)
  const [deleteSubmenuPosition, setDeleteSubmenuPosition] = useState({ x: 0, y: 0 })

  const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '🙏']

  console.log('MessageContextMenu rendered with message:', message?.id)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  useEffect(() => {
    if (showDeleteSubmenu && deleteButtonRef.current) {
      const rect = deleteButtonRef.current.getBoundingClientRect()
      setDeleteSubmenuPosition({
        x: rect.left - 210, // 200px width + 10px gap
        y: rect.top
      })
    }
  }, [showDeleteSubmenu])

  if (!message) return null

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-[100] glass rounded-xl border border-white/10 shadow-2xl overflow-hidden min-w-[180px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="py-1">
          {/* Quick Reactions */}
          {onReaction && (
            <div className="px-2 py-2 flex justify-between gap-1 border-b border-white/10 mb-1">
              {quickReactions.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleAction(() => onReaction(emoji))}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-lg leading-none transform hover:scale-125 duration-200"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Reply */}
          <button
            onClick={() => handleAction(onReply)}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
          >
            <Reply className="w-4 h-4 text-accent" />
            <span className="text-sm">{t('reply')}</span>
          </button>

          {/* Edit (only for sent messages with text) */}
          {isSent && message.text && onEdit && (
            <button
              onClick={() => handleAction(onEdit)}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
            >
              <Edit className="w-4 h-4 text-blue-400" />
              <span className="text-sm">{t('editMessage')}</span>
            </button>
          )}

          {/* Copy text */}
          {message.text && onCopy && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.text)
                handleAction(onCopy)
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
            >
              <Copy className="w-4 h-4 text-green-400" />
              <span className="text-sm">{t('copy')}</span>
            </button>
          )}

          {/* Pin/Unpin */}
          {(onPin || onUnpin) && (
            <button
              onClick={() => handleAction(isPinned ? onUnpin! : onPin!)}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
            >
              {isPinned ? <PinOff className="w-4 h-4 text-white" /> : <Pin className="w-4 h-4 text-white" />}
              <span className="text-sm">{isPinned ? t('unpin') : t('pin')}</span>
            </button>
          )}

          {/* Forward */}
          {onForward && (
            <button
              onClick={() => handleAction(onForward)}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
            >
              <Forward className="w-4 h-4 text-purple-400" />
              <span className="text-sm">{t('forward')}</span>
            </button>
          )}

          {/* Divider */}
          {(onDelete || onDeleteForMe) && !message.id.startsWith('temp-') && (
            <div className="h-px bg-white/10 my-1" />
          )}

          {/* Delete with submenu trigger - hide for temporary messages */}
          {(onDelete || onDeleteForMe) && !message.id.startsWith('temp-') && (
            <button
              ref={deleteButtonRef}
              onMouseEnter={() => setShowDeleteSubmenu(true)}
              onMouseLeave={() => setShowDeleteSubmenu(false)}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/20 transition-colors text-left text-red-400 group"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm flex-1">{t('delete')}</span>
              <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${showDeleteSubmenu ? 'scale-110' : ''}`} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Delete submenu - rendered separately to avoid nesting buttons */}
      <AnimatePresence>
        {showDeleteSubmenu && (onDelete || onDeleteForMe) && !message.id.startsWith('temp-') && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[110] glass rounded-xl border border-white/10 shadow-2xl overflow-hidden min-w-[200px]"
            style={{
              left: `${deleteSubmenuPosition.x}px`,
              top: `${deleteSubmenuPosition.y}px`,
            }}
            onMouseEnter={() => setShowDeleteSubmenu(true)}
            onMouseLeave={() => setShowDeleteSubmenu(false)}
          >
            <div className="py-1">
              {/* Delete for me */}
              {onDeleteForMe && (
                <button
                  onClick={() => {
                    onDeleteForMe()
                    onClose()
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors text-left text-white"
                >
                  <Trash2 className="w-4 h-4 text-orange-400" />
                  <span className="text-sm">{t('deleteForMe')}</span>
                </button>
              )}

              {/* Delete for everyone (only for sent messages) */}
              {isSent && onDeleteForEveryone && (
                <button
                  onClick={() => {
                    onDeleteForEveryone()
                    onClose()
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/20 transition-colors text-left text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">{t('deleteForEveryone')}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

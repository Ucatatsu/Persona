import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Edit, Reply, Forward } from 'lucide-react'
import MessageText from './MessageText'
import MessageImage from './MessageImage'

interface Reaction {
  id: string
  user_id: string
  emoji: string
  created_at: string
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  text: string
  created_at: string
  is_read?: boolean
  file_url?: string
  message_type?: string
  reply_to_id?: string | null
  replied_message?: Message | null
  edited_at?: string | null
  reactions?: Reaction[]
  forwarded_from_username?: string
}

interface MessageItemProps {
  message: Message
  isSent: boolean
  isNewMessage: boolean
  isFirstInGroup: boolean
  currentUserId: string
  chatDisplayName: string
  users: any[]
  deleteAnimation: string
  onReply: (msg: Message) => void
  onContextMenu: (e: React.MouseEvent, msg: Message) => void
  onScrollToMessage: (id: string) => void
  onReaction: (msgId: string, emoji: string) => void
  setMessageRef: (id: string, el: HTMLDivElement | null) => void
  t: any
}

const MessageItem = memo(function MessageItem({
  message: msg,
  isSent,
  isNewMessage,
  isFirstInGroup,
  currentUserId,
  chatDisplayName,
  users,
  deleteAnimation,
  onReply,
  onContextMenu,
  onScrollToMessage,
  onReaction,
  setMessageRef,
  t
}: MessageItemProps) {
  const marginTop = isFirstInGroup ? 'mt-3' : 'mt-0.5'

  // Оптимизированная анимация удаления
  const getExitAnimation = useCallback(() => {
    switch (deleteAnimation) {
      case 'telegram':
        return {
          scaleY: 0,
          opacity: 0,
          transition: { duration: 0.2, ease: 'easeOut' }
        }
      case 'fade':
        return {
          opacity: 0,
          transition: { duration: 0.2 }
        }
      default:
        return {
          opacity: 0,
          scale: 0.8,
          transition: { duration: 0.2 }
        }
    }
  }, [deleteAnimation])

  const handleDragEnd = useCallback((e: any, info: any) => {
    const threshold = 50
    if (info.offset.x < -threshold) {
      onReply(msg)
    }
  }, [msg, onReply])

  return (
    <motion.div
      ref={(el) => setMessageRef(msg.id, el)}
      initial={isNewMessage ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={getExitAnimation()}
      transition={{ duration: 0.15 }}
      className={`flex ${isSent ? 'justify-end' : 'justify-start'} ${marginTop} relative`}
      style={{ willChange: 'transform, opacity' }}
    >
      <motion.div 
        className={`${isSent ? 'message-sent' : 'message-received'} relative max-w-[85%] sm:max-w-md`}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin={true}
        onDragEnd={handleDragEnd}
        onContextMenu={(e) => onContextMenu(e, msg)}
      >
        <div className="flex flex-col gap-1.5">
          {/* Forwarded label */}
          {msg.forwarded_from_username && (
            <div className="flex items-center gap-1 text-xs text-white/50 italic">
              <Forward className="w-3 h-3" />
              <span>{t('forwardedFrom')} @{msg.forwarded_from_username}</span>
            </div>
          )}

          {/* Reply preview */}
          {msg.replied_message && (
            <div 
              className="border-l-2 border-accent/50 pl-2 py-1 bg-black/20 rounded cursor-pointer hover:bg-black/30 transition-colors"
              onClick={() => onScrollToMessage(msg.replied_message!.id)}
            >
              <p className="text-xs text-accent font-medium">
                {msg.replied_message.sender_id === currentUserId ? t('you') : chatDisplayName}
              </p>
              <p className="text-xs opacity-70 line-clamp-1">
                {msg.replied_message.file_url && msg.replied_message.message_type === 'image' 
                  ? '📷 ' + t('photo')
                  : msg.replied_message.text}
              </p>
            </div>
          )}
          
          {/* Image */}
          {msg.file_url && msg.message_type === 'image' && (
            <MessageImage url={msg.file_url} />
          )}

          {/* Text */}
          {msg.text && !msg.text.startsWith('[image]') && (
            <div className="flex items-end gap-2">
              <MessageText text={msg.text} users={users} />
              <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0 pb-0.5">
                {msg.edited_at && (
                  <Edit className="w-3 h-3 opacity-40" title={t('edited')} />
                )}
                <p className="text-xs opacity-60">
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {isSent && (
                  <span className={`text-xs ${msg.is_read ? 'text-accent' : 'opacity-60'}`}>
                    {msg.is_read ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Time for image-only */}
          {msg.file_url && (!msg.text || msg.text.startsWith('[image]')) && (
            <div className="flex items-center gap-1 justify-end">
              {msg.edited_at && <Edit className="w-3 h-3 opacity-40" />}
              <p className="text-xs opacity-60">
                {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {isSent && (
                <span className={`text-xs ${msg.is_read ? 'text-accent' : 'opacity-60'}`}>
                  {msg.is_read ? '✓✓' : '✓'}
                </span>
              )}
            </div>
          )}

          {/* Reactions */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-1">
              {Object.entries(
                msg.reactions.reduce((acc: Record<string, number>, r: Reaction) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1
                  return acc
                }, {})
              ).map(([emoji, count]) => {
                const isMyReaction = msg.reactions?.some((r: Reaction) => r.emoji === emoji && r.user_id === currentUserId)
                return (
                  <button
                    key={emoji}
                    onClick={(e) => { 
                      e.stopPropagation()
                      onReaction(msg.id, emoji)
                    }}
                    className={`text-sm px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                      isMyReaction ? 'bg-accent/20 border border-accent/30' : 'bg-white/5 hover:bg-white/10'
                    } transition-colors`}
                  >
                    <span className="leading-none">{emoji}</span>
                    <span className="opacity-70 text-[10px] leading-none">{count as number}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}, (prevProps, nextProps) => {
  // Оптимизация: ререндерим только если изменились важные поля
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.is_read === nextProps.message.is_read &&
    prevProps.message.edited_at === nextProps.message.edited_at &&
    prevProps.message.reactions?.length === nextProps.message.reactions?.length &&
    prevProps.isNewMessage === nextProps.isNewMessage &&
    prevProps.deleteAnimation === nextProps.deleteAnimation
  )
})

export default MessageItem

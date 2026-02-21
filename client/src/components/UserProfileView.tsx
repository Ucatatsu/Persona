import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Phone, Video } from 'lucide-react'

interface User {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  banner_url?: string
  name_color?: string
}

interface UserProfileViewProps {
  user: User
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileView({ user, isOpen, onClose }: UserProfileViewProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 relative">
              <div className="absolute inset-0 bg-black/20" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 glass-hover rounded-xl transition-all hover:scale-110 z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 -mt-16 relative">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center border-4 border-slate-900 shadow-2xl">
                  <span className="text-5xl font-semibold">{user.username[0].toUpperCase()}</span>
                </div>
              </div>

              {/* User Info */}
              <div className="text-center mb-6">
                <h2 
                  className="text-2xl font-bold mb-1" 
                  style={{ color: user.name_color || '#ffffff' }}
                >
                  {user.display_name || user.username}
                </h2>
                <p className="text-white/60">@{user.username}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Написать
                </button>
                <button className="p-3 glass-hover rounded-xl transition-all hover:scale-110">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-3 glass-hover rounded-xl transition-all hover:scale-110">
                  <Video className="w-5 h-5" />
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 space-y-3">
                <div className="glass rounded-xl p-4">
                  <p className="text-sm text-white/60 mb-1">О пользователе</p>
                  <p className="text-white/80">Пользователь Квант 2.0</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

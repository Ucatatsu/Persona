import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit, X, Upload, Camera } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../hooks/useTranslation'
import api from '../services/api'

interface UserProfileProps {
  // Reserved for future use
}

export default function UserProfile({}: UserProfileProps) {
  const { user, updateUser } = useAuthStore()
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || '')
  const [nameColor, setNameColor] = useState(user?.name_color || '#00D9FF')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [popupPosition, setPopupPosition] = useState<'top' | 'bottom'>('top')
  const menuRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // Calculate popup position based on profile location
  const handleProfileClick = () => {
    // If already open, just close it
    if (isMenuOpen) {
      setIsMenuOpen(false)
      return
    }

    // Calculate position for opening
    if (profileRef.current) {
      const rect = profileRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const spaceBelow = windowHeight - rect.bottom
      
      // If more space below or profile is in top half, show popup below
      // Otherwise show above
      if (spaceBelow > 400 || rect.top < windowHeight / 2) {
        setPopupPosition('bottom')
      } else {
        setPopupPosition('top')
      }
    }
    setIsMenuOpen(true)
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isEditModalOpen) {
      setDisplayName(user?.display_name || user?.username || '')
      setNameColor(user?.name_color || '#00D9FF')
      setAvatarFile(null)
      setBannerFile(null)
      setAvatarPreview(null)
      setBannerPreview(null)
    }
  }, [isEditModalOpen, user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024 // 10MB in bytes
      if (file.size > maxSize) {
        alert('Файл слишком большой! Максимальный размер: 10 МБ')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Можно загружать только изображения!')
        return
      }
      
      setAvatarFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024 // 10MB in bytes
      if (file.size > maxSize) {
        alert(t('fileTooLarge'))
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(t('onlyImages'))
        return
      }
      
      setBannerFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Upload avatar if changed
      let newAvatarUrl = user.avatar_url
      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)
        const avatarResponse = await api.post(`/api/users/${user.id}/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        newAvatarUrl = avatarResponse.data.avatar_url
      }

      // Upload banner if changed
      let newBannerUrl = user.banner_url
      if (bannerFile) {
        const formData = new FormData()
        formData.append('banner', bannerFile)
        const bannerResponse = await api.post(`/api/users/${user.id}/banner`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        newBannerUrl = bannerResponse.data.banner_url
      }

      // Update profile info
      const response = await api.put(`/api/users/${user.id}`, {
        display_name: displayName,
        name_color: nameColor
      })

      // Update local state with all changes
      const updatedUser = {
        ...response.data,
        avatar_url: newAvatarUrl,
        banner_url: newBannerUrl
      }
      
      updateUser(updatedUser)
      
      // Reset file states
      setAvatarFile(null)
      setBannerFile(null)
      
      setIsEditModalOpen(false)
      setIsMenuOpen(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert(t('updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Простой профиль (кликабельный) */}
      <div 
        ref={profileRef}
        className="glass rounded-2xl p-4 h-full flex-shrink-0 cursor-pointer transition-all relative z-50 hover:bg-white/5"
      >
        <div 
          className="flex items-center gap-3"
          onClick={handleProfileClick}
        >
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
              <span className="text-lg font-semibold">{user?.username[0].toUpperCase()}</span>
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-slate-900 shadow-lg shadow-green-500/50" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" style={{ color: user?.name_color || '#ffffff' }}>
              {user?.display_name || user?.username}
            </p>
          </div>
        </div>

        {/* Popup Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: popupPosition === 'bottom' ? -10 : 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: popupPosition === 'bottom' ? -10 : 10, scale: 0.95 }}
              className={`absolute left-0 right-0 ${
                popupPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
              } bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100]`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Banner */}
              <div className="h-24 gradient-accent relative">
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* Profile Info */}
              <div className="p-4 -mt-10 relative">
                <div className="flex items-end gap-3 mb-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center border-4 border-slate-900">
                      <span className="text-2xl font-semibold">{user?.username[0].toUpperCase()}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-green-500 border-2 border-slate-900 shadow-lg shadow-green-500/50" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 mb-2">
                    <p className="font-bold text-lg truncate" style={{ color: user?.name_color || '#ffffff' }}>
                      {user?.display_name || user?.username}
                    </p>
                    <p className="text-sm text-white/60">@{user?.username}</p>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => {
                    setIsEditModalOpen(true)
                    setIsMenuOpen(false)
                  }}
                  className="w-full btn-primary py-2 text-sm"
                >
                  <Edit className="w-4 h-4 inline mr-2" />
                  {t('edit')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold">{t('editProfile')}</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 glass-hover rounded-xl transition-all hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {/* Banner Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('banner')}</label>
                  <div className="relative h-32 rounded-xl overflow-hidden gradient-accent">
                    {bannerPreview && (
                      <img src={bannerPreview} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <input
                      type="file"
                      accept="image/*,image/gif"
                      onChange={handleBannerChange}
                      className="hidden"
                      id="banner-upload"
                    />
                    <label
                      htmlFor="banner-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 cursor-pointer transition-all"
                    >
                      <div className="text-center">
                        <Camera className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">{bannerPreview ? t('bannerChange') : t('bannerUpload')}</p>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-white/40 mt-1">{t('bannerFormat')}</p>
                </div>

                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('avatar')}</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center">
                          <span className="text-2xl font-semibold">{user?.username[0].toUpperCase()}</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*,image/gif"
                        onChange={handleAvatarChange}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full cursor-pointer transition-all"
                      >
                        <Upload className="w-6 h-6" />
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/60">{t('avatarHint')}</p>
                      <p className="text-xs text-white/40 mt-1">{t('avatarFormat')}</p>
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('displayName')}</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input"
                    placeholder={t('displayNamePlaceholder')}
                  />
                  <p className="text-xs text-white/40 mt-1">{t('displayNameHint')}</p>
                </div>

                {/* Name Color */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('nameColor')}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={nameColor}
                      onChange={(e) => setNameColor(e.target.value)}
                      className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white/20"
                    />
                    <input
                      type="text"
                      value={nameColor}
                      onChange={(e) => setNameColor(e.target.value)}
                      className="input flex-1"
                      placeholder="#00D9FF"
                    />
                  </div>
                  <p className="text-sm mt-2" style={{ color: nameColor }}>
                    {t('nameColorPreview')}: {displayName || user?.username}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 btn-secondary"
                  disabled={loading}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 btn-primary"
                  disabled={loading}
                >
                  {loading ? t('saving') : t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

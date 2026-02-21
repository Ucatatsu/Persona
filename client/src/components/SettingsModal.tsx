import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X,
  Bell, 
  Lock, 
  Palette, 
  Globe, 
  Shield,
  Info,
  Moon,
  Sun,
  Monitor,
  Layout,
  Upload
} from 'lucide-react'
import { useLayoutStore } from '../store/layoutStore'
import { useThemeStore } from '../store/themeStore'
import { useLanguageStore } from '../store/languageStore'
import { useNotificationStore } from '../store/notificationStore'
import { useBackgroundStore, presetBackgrounds } from '../store/backgroundStore'
import { useOpacityStore } from '../store/opacityStore'
import { useUIStore } from '../store/uiStore'
import { useAnimationStore, DeleteAnimationType } from '../store/animationStore'
import { useNotifications } from '../hooks/useNotifications'
import { useTranslation } from '../hooks/useTranslation'
import CustomSelect from './CustomSelect'
import LegalModal from './LegalModal'
import api from '../services/api'

type SettingsTab = 'notifications' | 'privacy' | 'appearance' | 'language' | 'security' | 'about'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications')
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const { mode: theme, setMode: setTheme, accentColor, setAccentColor } = useThemeStore()

  const tabs = [
    { id: 'notifications' as SettingsTab, label: t('notifications'), icon: Bell },
    { id: 'privacy' as SettingsTab, label: t('privacy'), icon: Lock },
    { id: 'appearance' as SettingsTab, label: t('appearance'), icon: Palette },
    { id: 'language' as SettingsTab, label: t('language'), icon: Globe },
    { id: 'security' as SettingsTab, label: t('security'), icon: Shield },
    { id: 'about' as SettingsTab, label: t('about'), icon: Info },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-5xl h-[90vh] md:h-[600px] glass rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <h1 className="text-2xl font-bold text-accent">
                {t('settingsTitle')}
              </h1>
              <button
                onClick={onClose}
                className="p-2 glass-hover rounded-xl transition-all hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Sidebar - горизонтальный скролл на мобилках */}
              <div className="md:w-64 border-b md:border-b-0 md:border-r border-white/10 p-2 md:p-4 overflow-x-auto md:overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-shrink-0">
                <nav className="flex md:flex-col gap-2 md:space-y-2 min-w-max md:min-w-0">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'gradient-accent-soft text-accent'
                            : 'hover:bg-white/5 text-white/80'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'notifications' && <NotificationSettings />}
                    {activeTab === 'privacy' && <PrivacySettings />}
                    {activeTab === 'appearance' && <AppearanceSettings theme={theme} setTheme={setTheme} accentColor={accentColor} setAccentColor={setAccentColor} onClose={onClose} />}
                    {activeTab === 'language' && <LanguageSettings />}
                    {activeTab === 'security' && <SecuritySettings />}
                    {activeTab === 'about' && <AboutSettings onShowTerms={() => setShowTermsModal(true)} onShowPrivacy={() => setShowPrivacyModal(true)} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Legal Modals - rendered outside settings modal with higher z-index */}
          <LegalModal
            isOpen={showTermsModal}
            onClose={() => setShowTermsModal(false)}
            type="terms"
          />
          <LegalModal
            isOpen={showPrivacyModal}
            onClose={() => setShowPrivacyModal(false)}
            type="privacy"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Privacy Settings Component
function PrivacySettings() {
  const { t } = useTranslation()
  const [privacy, setPrivacy] = useState({
    profilePhoto: 'everyone',
    lastSeen: 'contacts',
    status: 'everyone',
    readReceipts: true,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('privacyTitle')}</h2>
        <p className="text-white/60">{t('privacyDescription')}</p>
      </div>

      <div className="space-y-4">
        <SelectItem
          label={t('profilePhoto')}
          description={t('profilePhotoDesc')}
          value={privacy.profilePhoto}
          onChange={(value) => setPrivacy(prev => ({ ...prev, profilePhoto: value }))}
          options={[
            { value: 'everyone', label: t('everyone') },
            { value: 'contacts', label: t('contacts') },
            { value: 'nobody', label: t('nobody') },
          ]}
        />
        <SelectItem
          label={t('lastSeen')}
          description={t('lastSeenDesc')}
          value={privacy.lastSeen}
          onChange={(value) => setPrivacy(prev => ({ ...prev, lastSeen: value }))}
          options={[
            { value: 'everyone', label: t('everyone') },
            { value: 'contacts', label: t('contacts') },
            { value: 'nobody', label: t('nobody') },
          ]}
        />
        <SelectItem
          label={t('status')}
          description={t('statusDesc')}
          value={privacy.status}
          onChange={(value) => setPrivacy(prev => ({ ...prev, status: value }))}
          options={[
            { value: 'everyone', label: t('everyone') },
            { value: 'contacts', label: t('contacts') },
            { value: 'nobody', label: t('nobody') },
          ]}
        />
        <ToggleItem
          label={t('readReceipts')}
          description={t('readReceiptsDesc')}
          checked={privacy.readReceipts}
          onChange={() => setPrivacy(prev => ({ ...prev, readReceipts: !prev.readReceipts }))}
        />
      </div>
    </div>
  )
}

// Appearance Settings Component
function AppearanceSettings({ theme, setTheme, accentColor, setAccentColor, onClose }: { 
  theme: string
  setTheme: (theme: any) => void
  accentColor: string
  setAccentColor: (color: string) => void
  onClose: () => void 
}) {
  const { isCustomizing, toggleCustomizing } = useLayoutStore()
  const { t } = useTranslation()

  const handleStartCustomizing = () => {
    toggleCustomizing()
    onClose()
  }

  const colors = [
    { hex: '#00D9FF', name: 'Cyan' },
    { hex: '#3B82F6', name: 'Blue' },
    { hex: '#8B5CF6', name: 'Purple' },
    { hex: '#EC4899', name: 'Pink' },
    { hex: '#F59E0B', name: 'Orange' },
    { hex: '#10B981', name: 'Green' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('appearanceTitle')}</h2>
        <p className="text-white/60">{t('appearanceDescription')}</p>
      </div>

      <div className="space-y-4">
        {/* Customization Section */}
        <div className="glass-hover rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Layout className="w-6 h-6 text-accent" />
            <div>
              <h3 className="font-medium">{t('customization')}</h3>
              <p className="text-sm text-white/60">{t('customizationDesc')}</p>
            </div>
          </div>
          
          <button 
            onClick={handleStartCustomizing}
            className="btn-primary w-full"
          >
            {isCustomizing ? t('disableCustomization') : t('enableCustomization')}
          </button>

          <div className="gradient-accent-soft border border-accent/20 rounded-xl p-3 mt-4">
            <p className="text-xs text-white/80">
              {t('customizationHint')}
            </p>
          </div>
        </div>

        {/* Theme Section */}
        <div>
          <label className="block text-sm font-medium mb-3">{t('theme')}</label>
          <div className="grid grid-cols-3 gap-3">
            <ThemeOption
              icon={Sun}
              label={t('lightTheme')}
              active={theme === 'light'}
              onClick={() => setTheme('light')}
            />
            <ThemeOption
              icon={Moon}
              label={t('darkTheme')}
              active={theme === 'dark'}
              onClick={() => setTheme('dark')}
            />
            <ThemeOption
              icon={Monitor}
              label={t('systemTheme')}
              active={theme === 'system'}
              onClick={() => setTheme('system')}
            />
          </div>
        </div>

        {/* Accent Color Section */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('accentColor')}</label>
          <div className="grid grid-cols-6 gap-3">
            {colors.map((color) => (
              <button
                key={color.hex}
                onClick={() => setAccentColor(color.hex)}
                className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                  accentColor === color.hex
                    ? 'border-white ring-2 ring-white/50 scale-105'
                    : 'border-white/20'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Glass Opacity Section */}
        <GlassOpacitySettings />

        {/* Font Size Section */}
        <FontSizeSettings />

        {/* Border Radius Section */}
        <BorderRadiusSettings />

        {/* Delete Animation Section */}
        <DeleteAnimationSettings />

        {/* Notifications Section */}
        <NotificationSettings />

        {/* Background Section */}
        <BackgroundSettings />
      </div>
    </div>
  )
}

// Glass Opacity Settings Component
function GlassOpacitySettings() {
  const { t } = useTranslation()
  const { glassOpacity, setGlassOpacity } = useOpacityStore()
  
  // Локальный state для мгновенного превью
  const [previewOpacity, setPreviewOpacity] = useState(glassOpacity)
  
  // Синхронизация с глобальным state
  useEffect(() => {
    setPreviewOpacity(glassOpacity)
  }, [glassOpacity])
  
  // Преобразуем 0-1 в проценты для отображения
  const opacityPercent = Math.round(previewOpacity * 100)

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    const opacity = value / 100
    setPreviewOpacity(opacity)
    setGlassOpacity(opacity) // Сразу применяем
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-3">
        {t('glassOpacity') || 'Прозрачность стекла'}
      </label>
      
      <div className="glass-hover rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/80">
            {t('transparent') || 'Прозрачное'}
          </span>
          <span className="text-accent font-bold text-lg">
            {opacityPercent}%
          </span>
          <span className="text-sm text-white/80">
            {t('opaque') || 'Матовое'}
          </span>
        </div>
        
        <input
          type="range"
          min="0"
          max="50"
          value={opacityPercent}
          onChange={handleOpacityChange}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, 
              rgba(var(--accent-rgb), 0.3) 0%, 
              rgba(var(--accent-rgb), 0.6) ${opacityPercent * 2}%, 
              rgba(255, 255, 255, 0.1) ${opacityPercent * 2}%, 
              rgba(255, 255, 255, 0.1) 100%)`
          }}
        />
        
        <div className="flex justify-between mt-2 text-xs text-white/40">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
        </div>
      </div>
      
      <p className="text-xs text-white/40 mt-2">
        {t('glassOpacityHint') || 'Настройте прозрачность фона стеклянных блоков'}
      </p>
    </div>
  )
}

// Font Size Settings Component
function FontSizeSettings() {
  const { t } = useTranslation()
  const { fontSize, setFontSize } = useUIStore()

  const sizes = [
    { value: 'small' as const, label: t('fontSizeSmall') },
    { value: 'medium' as const, label: t('fontSizeMedium') },
    { value: 'large' as const, label: t('fontSizeLarge') },
    { value: 'xlarge' as const, label: t('fontSizeXLarge') },
  ]

  return (
    <div>
      <label className="block text-sm font-medium mb-3">{t('fontSize')}</label>
      <div className="grid grid-cols-4 gap-3">
        {sizes.map((size) => (
          <button
            key={size.value}
            onClick={() => setFontSize(size.value)}
            className={`p-4 rounded-xl border-2 transition-all ${
              fontSize === size.value
                ? 'gradient-accent-soft border-accent'
                : 'glass-hover border-white/10'
            }`}
          >
            <p className={`font-medium ${
              size.value === 'small' ? 'text-xs' :
              size.value === 'medium' ? 'text-sm' :
              size.value === 'large' ? 'text-base' :
              'text-lg'
            }`}>
              Aa
            </p>
            <p className="text-xs mt-1 text-white/60">{size.label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// Delete Animation Settings Component
function DeleteAnimationSettings() {
  const { t } = useTranslation()
  const { deleteAnimation, setDeleteAnimation } = useAnimationStore()

  const animations: Array<{ value: DeleteAnimationType; label: string }> = [
    { value: 'bounce', label: t('animationBounce') },
    { value: 'fade', label: t('animationFade') },
    { value: 'slide', label: t('animationSlide') },
    { value: 'shrink', label: t('animationShrink') },
    { value: 'telegram', label: t('animationTelegram') },
  ]

  return (
    <div>
      <label className="block text-sm font-medium mb-3">{t('deleteAnimation')}</label>
      <CustomSelect
        value={deleteAnimation}
        onChange={(value) => setDeleteAnimation(value as DeleteAnimationType)}
        options={animations}
      />
      <p className="text-xs text-white/40 mt-2">
        {deleteAnimation === 'bounce' && t('animationBounceDesc')}
        {deleteAnimation === 'fade' && t('animationFadeDesc')}
        {deleteAnimation === 'slide' && t('animationSlideDesc')}
        {deleteAnimation === 'shrink' && t('animationShrinkDesc')}
        {deleteAnimation === 'telegram' && t('animationTelegramDesc')}
      </p>
    </div>
  )
}

// Border Radius Settings Component
function BorderRadiusSettings() {
  const { t } = useTranslation()
  const { borderRadius, setBorderRadius } = useUIStore()
  const [previewRadius, setPreviewRadius] = useState(borderRadius)

  // Синхронизация с глобальным state при изменении
  useEffect(() => {
    setPreviewRadius(borderRadius)
  }, [borderRadius])

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setPreviewRadius(value)
    setBorderRadius(value) // Сразу применяем
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-3">{t('borderRadius')}</label>
      
      <div className="glass-hover rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/80">
            {t('borderRadiusSharp')}
          </span>
          <span className="text-accent font-bold text-lg">
            {previewRadius}px
          </span>
          <span className="text-sm text-white/80">
            {t('borderRadiusRound')}
          </span>
        </div>
        
        {/* Preview box */}
        <div className="flex justify-center mb-4">
          <div 
            className="w-24 h-24 bg-accent/30 border-2 border-accent"
            style={{ borderRadius: `${previewRadius}px` }}
          />
        </div>
        
        <input
          type="range"
          min="0"
          max="32"
          value={previewRadius}
          onChange={handleRadiusChange}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, 
              rgba(var(--accent-rgb), 0.3) 0%, 
              rgba(var(--accent-rgb), 0.6) ${(previewRadius / 32) * 100}%, 
              rgba(255, 255, 255, 0.1) ${(previewRadius / 32) * 100}%, 
              rgba(255, 255, 255, 0.1) 100%)`
          }}
        />
        
        <div className="flex justify-between mt-2 text-xs text-white/40">
          <span>0px</span>
          <span>16px</span>
          <span>32px</span>
        </div>
      </div>
    </div>
  )
}

// Background Settings Component
function BackgroundSettings() {
  const { t } = useTranslation()
  const { type, presetId, customUrl, setBackground } = useBackgroundStore()
  const [uploadedFile, setUploadedFile] = useState<string | null>(customUrl)

  const handlePresetClick = (preset: any) => {
    console.log('=== PRESET CLICKED ===')
    console.log('Preset:', preset.name, preset.id)
    setBackground('preset', preset.id)
    console.log('setBackground called')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('=== FILE UPLOAD ===')
    console.log('File:', file.name, file.type, file.size)

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Можно загружать только изображения!')
      return
    }

    // Проверка размера (5MB max - base64 увеличивает размер на ~33%)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой! Максимум 5 МБ')
      return
    }

    // Создаём URL для предпросмотра
    const reader = new FileReader()
    reader.onloadend = () => {
      const url = reader.result as string
      console.log('File read complete, URL length:', url.length)
      setUploadedFile(url)
      
      // Пытаемся сохранить в sessionStorage, если не получается - просто применяем
      try {
        sessionStorage.setItem('persona-custom-bg', url)
        console.log('Saved to sessionStorage')
      } catch (e) {
        console.warn('Failed to save to sessionStorage (file too large), will apply directly:', e)
        // Не критично, просто не сохранится между перезагрузками
      }
      
      setBackground('custom', undefined, url)
      console.log('setBackground called with custom URL')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-3">{t('background') || 'Фон'}</label>
      
      <div className="grid grid-cols-3 gap-3">
        {/* Предустановленные фоны */}
        {presetBackgrounds.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            className={`aspect-square rounded-xl border-2 transition-all hover:scale-105 overflow-hidden ${
              type === 'preset' && presetId === preset.id
                ? 'border-accent ring-2 ring-accent/50'
                : 'border-white/20'
            }`}
            title={preset.name}
          >
            <div 
              className="w-full h-full"
              style={{ 
                background: preset.url.startsWith('linear-gradient') || preset.url.startsWith('radial-gradient')
                  ? preset.url
                  : `${preset.url}, #1e293b`
              }}
            />
          </button>
        ))}

        {/* Загрузка своего фона */}
        <label className={`aspect-square rounded-xl border-2 transition-all hover:scale-105 overflow-hidden cursor-pointer ${
          type === 'custom'
            ? 'border-accent ring-2 ring-accent/50'
            : 'border-white/20 hover:border-white/40'
        }`}>
          <input
            type="file"
            accept="image/*,image/gif"
            onChange={handleFileUpload}
            className="hidden"
          />
          {uploadedFile ? (
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${uploadedFile})` }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white/5">
              <Upload className="w-6 h-6 text-accent mb-1" />
              <p className="text-xs text-center px-2">{t('uploadBackground') || 'Загрузить'}</p>
            </div>
          )}
        </label>
      </div>
      
      <p className="text-xs text-white/40 mt-2">
        {t('uploadBackgroundHint') || 'PNG, JPG, GIF до 5 МБ. Большие файлы не сохраняются между сеансами.'}
      </p>
    </div>
  )
}

// Language Settings Component
function LanguageSettings() {
  const { language, setLanguage } = useLanguageStore()
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('languageTitle')}</h2>
        <p className="text-white/60">{t('languageDescription')}</p>
      </div>

      <div className="space-y-2">
        {[
          { code: 'ru' as const, name: t('russian'), flag: '🇷🇺' },
          { code: 'en' as const, name: t('english'), flag: '🇬🇧' },
          { code: 'uk' as const, name: t('ukrainian'), flag: '🇺🇦' },
          { code: 'zh' as const, name: t('chinese'), flag: '🇨🇳' },
          { code: 'ja' as const, name: t('japanese'), flag: '🇯🇵' },
          { code: 'de' as const, name: t('german'), flag: '🇩🇪' },
          { code: 'be' as const, name: t('belarusian'), flag: '🇧🇾' },
        ].map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
              language === lang.code
                ? 'gradient-accent-soft border-2 border-accent'
                : 'glass-hover border-2 border-transparent'
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Security Settings Component
function SecuritySettings() {
  const { t } = useTranslation()
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false)
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false)
  
  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{t('securityTitle')}</h2>
          <p className="text-white/60">{t('securityDescription')}</p>
        </div>

        <div className="space-y-4">
          <div className="glass-hover rounded-xl p-4">
            <h3 className="font-medium mb-1">{t('changePassword')}</h3>
            <p className="text-sm text-white/60 mb-3">{t('changePasswordDesc')}</p>
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="btn-secondary text-sm"
            >
              {t('changePassword')}
            </button>
          </div>

          <div className="glass-hover rounded-xl p-4">
            <h3 className="font-medium mb-1">{t('twoFactor')}</h3>
            <p className="text-sm text-white/60 mb-3">{t('twoFactorDesc')}</p>
            <button 
              onClick={() => setIs2FAModalOpen(true)}
              className="btn-secondary text-sm"
            >
              {t('setup2FA')}
            </button>
          </div>

          <div className="glass-hover rounded-xl p-4">
            <h3 className="font-medium mb-1">{t('activeSessions')}</h3>
            <p className="text-sm text-white/60 mb-3">{t('activeSessionsDesc')}</p>
            <button 
              onClick={() => setIsSessionsModalOpen(true)}
              className="btn-secondary text-sm"
            >
              {t('viewSessions')}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
      <Setup2FAModal 
        isOpen={is2FAModalOpen} 
        onClose={() => setIs2FAModalOpen(false)} 
      />
      <ActiveSessionsModal 
        isOpen={isSessionsModalOpen} 
        onClose={() => setIsSessionsModalOpen(false)} 
      />
    </>
  )
}

// Change Password Modal
function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    if (newPassword.length < 6) {
      setError(t('passwordTooShort'))
      return
    }

    try {
      setLoading(true)
      await api.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      })
      
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onClose()
      alert(t('passwordChanged'))
    } catch (err: any) {
      setError(err.response?.data?.error || t('passwordChangeFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            style={{ backdropFilter: 'blur(80px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('changePassword')}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">{t('currentPassword')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                  disabled={loading}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={loading}
                >
                  {loading ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Setup 2FA Modal
function Setup2FAModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'info' | 'qr' | 'verify'>('info')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEnable2FA = async () => {
    try {
      setLoading(true)
      const response = await api.post('/api/auth/2fa/enable')
      setQrCode(response.data.qr_code)
      setSecret(response.data.secret)
      setStep('qr')
    } catch (err: any) {
      setError(err.response?.data?.error || t('2faEnableFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      setLoading(true)
      await api.post('/api/auth/2fa/verify', {
        code: verifyCode
      })
      
      alert(t('2faEnabled'))
      onClose()
      setStep('info')
      setVerifyCode('')
    } catch (err: any) {
      setError(err.response?.data?.error || t('2faVerifyFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            style={{ backdropFilter: 'blur(80px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('twoFactor')}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {step === 'info' && (
                <div className="space-y-4">
                  <p className="text-white/80">{t('2faInfo')}</p>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li>• {t('2faStep1')}</li>
                    <li>• {t('2faStep2')}</li>
                    <li>• {t('2faStep3')}</li>
                  </ul>
                  <button
                    onClick={handleEnable2FA}
                    className="btn-primary w-full"
                    disabled={loading}
                  >
                    {loading ? t('loading') : t('continue')}
                  </button>
                </div>
              )}

              {step === 'qr' && (
                <div className="space-y-4">
                  <p className="text-sm text-white/80">{t('2faScanQR')}</p>
                  {qrCode && (
                    <div className="bg-white p-4 rounded-xl">
                      <img src={qrCode} alt="QR Code" className="w-full" />
                    </div>
                  )}
                  <div className="bg-slate-700/50 border border-white/10 rounded-xl p-3">
                    <p className="text-xs text-white/60 mb-1">{t('2faManualCode')}</p>
                    <code className="text-sm text-accent break-all">{secret}</code>
                  </div>
                  <button
                    onClick={() => setStep('verify')}
                    className="btn-primary w-full"
                  >
                    {t('continue')}
                  </button>
                </div>
              )}

              {step === 'verify' && (
                <form onSubmit={handleVerify} className="space-y-4">
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('2faEnterCode')}</label>
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary w-full"
                    disabled={loading || verifyCode.length !== 6}
                  >
                    {loading ? t('verifying') : t('verify')}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Active Sessions Modal
function ActiveSessionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSessions()
    }
  }, [isOpen])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/auth/sessions')
      setSessions(response.data || [])
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm(t('confirmRevokeSession'))) return

    try {
      await api.delete(`/api/auth/sessions/${sessionId}`)
      setSessions(sessions.filter(s => s.id !== sessionId))
    } catch (err) {
      alert(t('revokeSessionFailed'))
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            style={{ backdropFilter: 'blur(80px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('activeSessions')}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {loading ? (
                <div className="text-center py-8 text-white/60">{t('loading')}</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-white/60">{t('noActiveSessions')}</div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="bg-slate-700/30 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{session.device || t('unknownDevice')}</p>
                          {session.is_current && (
                            <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                              {t('currentSession')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/60">
                          {session.ip_address} • {session.location || t('unknownLocation')}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {t('lastActive')}: {new Date(session.last_active).toLocaleString()}
                        </p>
                      </div>
                      {!session.is_current && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          className="btn-secondary text-sm text-red-400 hover:bg-red-500/20"
                        >
                          {t('revoke')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// About Settings Component
function AboutSettings({ onShowTerms, onShowPrivacy }: { onShowTerms: () => void; onShowPrivacy: () => void }) {
  const { t } = useTranslation()
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('aboutTitle')}</h2>
        <p className="text-white/60">{t('aboutDescription')}</p>
      </div>

      <div className="space-y-4">
        {/* Version Info */}
        <div className="glass-hover rounded-xl p-6 border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-accent">Persona Messenger</h3>
            <span className="text-sm px-3 py-1 rounded-full bg-accent/20 text-accent font-mono">
              2H1C1S
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">{t('releaseDate')}:</span>
              <span className="text-white/90">24.01.2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t('status')}:</span>
              <span className="text-green-400">{t('stableVersion')} ✓</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t('versionSystem')}:</span>
              <span className="text-white/90">PVS</span>
            </div>
          </div>
        </div>

        {/* Legal Documents */}
        <div className="glass-hover rounded-xl p-4">
          <h3 className="font-medium mb-3">{t('legalDocuments')}</h3>
          <div className="space-y-2">
            <button 
              onClick={onShowTerms}
              className="block w-full p-3 rounded-lg hover:bg-white/5 transition-colors text-sm text-left"
            >
              <div className="flex items-center justify-between">
                <span>{t('termsOfService')}</span>
                <span className="text-white/40">→</span>
              </div>
            </button>
            <button 
              onClick={onShowPrivacy}
              className="block w-full p-3 rounded-lg hover:bg-white/5 transition-colors text-sm text-left"
            >
              <div className="flex items-center justify-between">
                <span>{t('privacyPolicy')}</span>
                <span className="text-white/40">→</span>
              </div>
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="glass-hover rounded-xl p-4">
          <h3 className="font-medium mb-3">{t('dataManagement')}</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-white/60 mb-2">{t('exportDataDesc')}</p>
              <button className="btn-secondary text-sm w-full">{t('exportData')}</button>
            </div>
            <div>
              <p className="text-sm text-white/60 mb-2">{t('clearCacheDesc')}</p>
              <button className="btn-secondary text-sm w-full">{t('clearCache')}</button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-hover rounded-xl p-4 border-2 border-red-500/20">
          <h3 className="font-medium mb-2 text-red-400">{t('dangerZone')}</h3>
          <p className="text-sm text-white/60 mb-3">{t('deleteAccountDesc')}</p>
          <button className="bg-red-500/20 text-red-400 px-4 py-2 rounded-xl hover:bg-red-500/30 transition-all text-sm w-full">
            {t('deleteAccount')}
          </button>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-white/40 pt-4">
          <p>© 2026 Persona Messenger</p>
          <p className="mt-1">{t('allRightsReserved')}</p>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function ToggleItem({ label, description, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-4 glass-hover rounded-xl">
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-all ${
          checked ? 'bg-accent' : 'bg-white/20'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}

function SelectItem({ label, description, value, onChange, options }: {
  label: string
  description: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="p-4 glass-hover rounded-xl">
      <p className="font-medium mb-1">{label}</p>
      <p className="text-sm text-white/60 mb-3">{description}</p>
      <div className="relative">
        <CustomSelect
          value={value}
          onChange={onChange}
          options={options}
        />
      </div>
    </div>
  )
}

function ThemeOption({ icon: Icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all ${
        active
          ? 'gradient-accent-soft border-accent'
          : 'glass-hover border-white/10'
      }`}
    >
      <Icon className="w-6 h-6 mx-auto mb-2" />
      <p className="text-sm font-medium">{label}</p>
    </button>
  )
}


// Notification Settings Component
function NotificationSettings() {
  const { t } = useTranslation()
  const { settings, updateSettings } = useNotificationStore()
  const { isEnabled, toggleNotifications, permission } = useNotifications()

  const handleToggleDesktop = async () => {
    const enabled = await toggleNotifications()
    updateSettings({ desktop: enabled })
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-3">{t('notifications')}</label>
      
      {/* Desktop Notifications */}
      <div className="flex items-center justify-between mb-3 p-3 glass-hover rounded-lg">
        <div>
          <p className="text-sm">{t('desktopNotifications')}</p>
          {permission === 'denied' && (
            <p className="text-xs text-red-400 mt-1">
              Notifications blocked in browser
            </p>
          )}
        </div>
        <button
          onClick={handleToggleDesktop}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isEnabled ? 'bg-accent' : 'bg-white/20'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {/* Sound Notifications */}
      <div className="flex items-center justify-between mb-3 p-3 glass-hover rounded-lg">
        <p className="text-sm">{t('soundNotifications')}</p>
        <button
          onClick={() => updateSettings({ sound: !settings.sound })}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            settings.sound ? 'bg-accent' : 'bg-white/20'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
              settings.sound ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {/* Volume Slider */}
      {settings.sound && (
        <div className="mb-3 p-3 glass-hover rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm">{t('notificationVolume')}</label>
            <span className="text-accent font-bold text-lg">
              {Math.round(settings.soundVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.soundVolume * 100}
            onChange={(e) => updateSettings({ soundVolume: parseInt(e.target.value) / 100 })}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                rgba(var(--accent-rgb), 0.3) 0%, 
                rgba(var(--accent-rgb), 0.6) ${settings.soundVolume * 100}%, 
                rgba(255, 255, 255, 0.1) ${settings.soundVolume * 100}%, 
                rgba(255, 255, 255, 0.1) 100%)`
            }}
          />
          <div className="flex justify-between mt-2 text-xs text-white/40">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Message Preview */}
      <div className="flex items-center justify-between p-3 glass-hover rounded-lg">
        <p className="text-sm">{t('messagePreview')}</p>
        <button
          onClick={() => updateSettings({ preview: !settings.preview })}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            settings.preview ? 'bg-accent' : 'bg-white/20'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
              settings.preview ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>
    </div>
  )
}

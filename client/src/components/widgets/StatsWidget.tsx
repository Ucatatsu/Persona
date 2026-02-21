import { useState, useEffect } from 'react'
import { MessageSquare, Image, Flame } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import api from '../../services/api'

export default function StatsWidget() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    messages: 0,
    images: 0,
    streak: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Пробуем загрузить с бэкенда
        const response = await api.get('/api/users/stats')
        if (response.data) {
          setStats({
            messages: response.data.total_messages || 0,
            images: response.data.total_images || 0,
            streak: response.data.streak_days || 0
          })
          // Сохраняем в localStorage
          localStorage.setItem('user-stats', JSON.stringify(response.data))
        }
      } catch (error) {
        console.log('Статистика с сервера недоступна, используем локальные данные')
        
        // Если бэкенд не отвечает - считаем локально
        const stored = localStorage.getItem('user-stats-local')
        if (stored) {
          setStats(JSON.parse(stored))
        } else {
          // Инициализируем нулями
          const initialStats = { messages: 0, images: 0, streak: 0 }
          setStats(initialStats)
          localStorage.setItem('user-stats-local', JSON.stringify(initialStats))
        }
      } finally {
        setLoading(false)
      }
    }

    loadStats()

    // Слушаем события отправки сообщений
    const handleMessageSent = () => {
      setStats(prev => {
        const newStats = { ...prev, messages: prev.messages + 1 }
        localStorage.setItem('user-stats-local', JSON.stringify(newStats))
        return newStats
      })
    }

    const handleImageSent = () => {
      setStats(prev => {
        const newStats = { ...prev, images: prev.images + 1 }
        localStorage.setItem('user-stats-local', JSON.stringify(newStats))
        return newStats
      })
    }

    // Подписываемся на кастомные события
    window.addEventListener('message-sent', handleMessageSent)
    window.addEventListener('image-sent', handleImageSent)

    return () => {
      window.removeEventListener('message-sent', handleMessageSent)
      window.removeEventListener('image-sent', handleImageSent)
    }
  }, [])

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center justify-center h-full min-h-[200px]">
        <div className="text-white/40">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6 flex flex-col justify-center h-full min-h-[200px]">
      <div className="text-lg font-semibold mb-4 text-accent">
        📊 {t('yourActivity') || 'Твоя активность'}
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-accent" />
          <span className="text-sm">{stats.messages} {t('messages') || 'сообщений'}</span>
        </div>
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5 text-accent" />
          <span className="text-sm">{stats.images} {t('photos') || 'фото'}</span>
        </div>
        <div className="flex items-center gap-3">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-sm">{stats.streak} {t('daysInRow') || 'дней подряд'}</span>
        </div>
      </div>
    </div>
  )
}

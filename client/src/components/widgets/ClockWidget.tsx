import { useState, useEffect } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { useLanguageStore } from '../../store/languageStore'

export default function ClockWidget() {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Маппинг языков на локали
  const localeMap: Record<string, string> = {
    ru: 'ru-RU',
    en: 'en-US',
    uk: 'uk-UA',
    zh: 'zh-CN',
    ja: 'ja-JP',
    de: 'de-DE',
    be: 'be-BY',
  }

  const locale = localeMap[language] || 'en-US'

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
      <div className="text-5xl font-bold text-accent mb-2 font-mono">
        {formatTime(time)}
      </div>
      <div className="text-sm text-white/60">
        {formatDate(time)}
      </div>
    </div>
  )
}

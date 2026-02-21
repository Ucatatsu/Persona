import { useState, useEffect } from 'react'
import { Cpu, HardDrive, Battery, Zap } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'

export default function SystemWidget() {
  const { t } = useTranslation()
  const [system, setSystem] = useState({
    memory: 0,
    battery: null as number | null,
    charging: false,
    connection: 'online' as 'online' | 'offline'
  })

  useEffect(() => {
    const updateStats = async () => {
      // Память (если доступно)
      if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory
        const usedMemory = memory.usedJSHeapSize
        const totalMemory = memory.jsHeapSizeLimit
        const memoryPercent = Math.round((usedMemory / totalMemory) * 100)
        setSystem(prev => ({ ...prev, memory: memoryPercent }))
      }

      // Батарея (если доступно)
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery()
          setSystem(prev => ({
            ...prev,
            battery: Math.round(battery.level * 100),
            charging: battery.charging
          }))

          // Слушаем изменения батареи
          battery.addEventListener('levelchange', () => {
            setSystem(prev => ({
              ...prev,
              battery: Math.round(battery.level * 100)
            }))
          })

          battery.addEventListener('chargingchange', () => {
            setSystem(prev => ({
              ...prev,
              charging: battery.charging
            }))
          })
        } catch (error) {
          console.log('Battery API недоступен')
        }
      }

      // Статус подключения
      setSystem(prev => ({
        ...prev,
        connection: navigator.onLine ? 'online' : 'offline'
      }))
    }

    updateStats()
    
    // Обновляем память каждые 3 секунды
    const memoryInterval = setInterval(() => {
      if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory
        const usedMemory = memory.usedJSHeapSize
        const totalMemory = memory.jsHeapSizeLimit
        const memoryPercent = Math.round((usedMemory / totalMemory) * 100)
        setSystem(prev => ({ ...prev, memory: memoryPercent }))
      }
    }, 3000)

    // Слушаем изменения подключения
    const handleOnline = () => setSystem(prev => ({ ...prev, connection: 'online' }))
    const handleOffline = () => setSystem(prev => ({ ...prev, connection: 'offline' }))
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(memoryInterval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getColor = (value: number) => {
    if (value < 50) return 'text-green-500'
    if (value < 80) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="glass rounded-2xl p-6 flex flex-col justify-center h-full min-h-[200px]">
      <div className="text-lg font-semibold mb-4 text-accent">
        💻 {t('system') || 'Система'}
      </div>
      <div className="space-y-3">
        {/* Память */}
        {system.memory > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span className="text-sm">{t('memory') || 'Память'}</span>
            </div>
            <span className={`text-sm font-mono ${getColor(system.memory)}`}>
              {system.memory}%
            </span>
          </div>
        )}

        {/* Батарея */}
        {system.battery !== null && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {system.charging ? (
                <Zap className="w-4 h-4 text-yellow-500" />
              ) : (
                <Battery className="w-4 h-4" />
              )}
              <span className="text-sm">{t('battery') || 'Батарея'}</span>
            </div>
            <span className={`text-sm font-mono ${
              system.battery < 20 ? 'text-red-500' : 
              system.battery < 50 ? 'text-yellow-500' : 
              'text-green-500'
            }`}>
              {system.battery}% {system.charging && '⚡'}
            </span>
          </div>
        )}

        {/* Подключение */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              system.connection === 'online' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm">{t('connection') || 'Подключение'}</span>
          </div>
          <span className="text-sm font-mono">
            {system.connection === 'online' ? (t('online') || 'Онлайн') : (t('offline') || 'Офлайн')}
          </span>
        </div>

        {/* Если нет данных */}
        {system.memory === 0 && system.battery === null && (
          <div className="text-xs text-white/40 text-center py-2">
            {t('systemDataUnavailable') || 'Системные данные недоступны в этом браузере'}
          </div>
        )}
      </div>
    </div>
  )
}

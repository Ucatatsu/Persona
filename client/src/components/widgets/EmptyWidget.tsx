import { useState, useEffect, useRef } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

export default function EmptyWidget() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>(() => {
    const saved = localStorage.getItem('emptyWidget-height')
    return saved ? parseInt(saved) : 850
  })
  const [maxHeight, setMaxHeight] = useState<number>(1200)

  // Вычисляем максимальную высоту на основе количества соседних виджетов
  useEffect(() => {
    const updateMaxHeight = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement
        if (parent) {
          // Считаем количество соседних элементов (не включая себя)
          const siblingsCount = parent.children.length - 1
          
          // Определяем максимум в зависимости от количества соседей
          let calculated: number
          if (siblingsCount >= 2) {
            calculated = 850  // 2+ виджета
          } else if (siblingsCount === 1) {
            calculated = 1050 // 1 виджет
          } else {
            calculated = 1200 // 0 виджетов (только EmptyWidget)
          }
          
          setMaxHeight(calculated)
        }
      }
    }

    updateMaxHeight()
    
    // Обновляем при изменении layout
    const observer = new MutationObserver(updateMaxHeight)
    if (containerRef.current?.parentElement) {
      observer.observe(containerRef.current.parentElement, {
        childList: true,
      })
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  const changeHeight = (delta: number) => {
    const newHeight = Math.max(100, Math.min(maxHeight, height + delta))
    setHeight(newHeight)
    localStorage.setItem('emptyWidget-height', newHeight.toString())
  }

  // Ограничиваем текущую высоту если она больше максимальной
  useEffect(() => {
    if (height > maxHeight) {
      setHeight(maxHeight)
      localStorage.setItem('emptyWidget-height', maxHeight.toString())
    }
  }, [maxHeight, height])

  return (
    <div 
      ref={containerRef}
      className="glass rounded-2xl flex items-center justify-center relative group"
      style={{ height: `${Math.min(height, maxHeight)}px` }}
    >
      {/* Кнопки изменения размера - показываются при наведении */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={() => changeHeight(-25)}
          disabled={height <= 100}
          className="p-1 glass-hover rounded-lg hover:bg-accent/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Уменьшить (мин: 100px)"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => changeHeight(25)}
          disabled={height >= maxHeight}
          className="p-1 glass-hover rounded-lg hover:bg-accent/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title={`Увеличить (макс: ${maxHeight}px)`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      {/* Показываем текущую высоту при наведении */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-white/40 font-mono">
          {height}px / {maxHeight}px
        </span>
      </div>
    </div>
  )
}

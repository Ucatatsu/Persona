import { ReactNode, useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, rectIntersection, pointerWithin } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useLayoutStore, LayoutComponent } from '../store/layoutStore'
import { useTranslation } from '../hooks/useTranslation'
import { TranslationKey } from '../i18n/translations'
import { Plus } from 'lucide-react'

interface SortableItemProps {
  id: string
  children: ReactNode
  isCustomizing: boolean
  columnId?: 'left' | 'center' | 'right'
}

function SortableItem({ id, children, isCustomizing, columnId }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id, disabled: id === 'chatMessages' || !isCustomizing })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Определяем, должен ли элемент растягиваться
  // chatMessages всегда растягивается
  // contacts растягивается только в left/right колонках (вертикальный режим)
  const shouldGrow = id === 'chatMessages' || 
    (id === 'contacts' && columnId !== 'center')
  const canDrag = id !== 'chatMessages'

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative ${shouldGrow ? 'flex-1 flex flex-col min-h-0' : ''} ${
        isCustomizing && canDrag ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDragging ? 'z-50' : ''}`}
      {...(isCustomizing && canDrag ? { ...attributes, ...listeners } : {})}
    >
      {/* Индикатор вставки сверху */}
      {isCustomizing && isOver && (
        <div className="absolute -top-3 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent rounded-full animate-pulse" />
      )}
      
      {isCustomizing && canDrag && (
        <div className={`absolute inset-0 border-2 rounded-2xl pointer-events-none z-10 transition-all ${
          isDragging ? 'border-accent shadow-lg shadow-accent/50' : 'border-accent/30'
        }`} />
      )}
      {isCustomizing && !canDrag && (
        <div className="absolute inset-0 border-2 border-gray-500/20 rounded-2xl pointer-events-none z-10" />
      )}
      <div className={shouldGrow ? 'flex-1 flex flex-col min-h-0' : ''}>
        {children}
      </div>
    </div>
  )
}

interface DroppableColumnProps {
  id: 'left' | 'center' | 'right'
  items: LayoutComponent[]
  components: Record<LayoutComponent, ReactNode>
  isCustomizing: boolean
  t: (key: TranslationKey) => string
}

function DroppableColumn({ id, items, components, isCustomizing, t }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  
  // Защита от undefined
  const safeItems = items || []
  
  // Определяем ширину колонки
  const getColumnWidth = () => {
    if (id === 'left') return 'w-80'
    if (id === 'right') {
      // В режиме редактирования правая колонка всегда видна
      if (isCustomizing) return 'w-80'
      // В обычном режиме показываем только если есть элементы
      return safeItems.length > 0 ? 'w-80' : 'w-0'
    }
    return 'flex-1' // center
  }
  
  // Показываем колонку если есть элементы ИЛИ в режиме редактирования
  const shouldShow = safeItems.length > 0 || isCustomizing
  
  // Название колонки для подсказки
  const columnName = id === 'left' ? 'Левая панель' : id === 'center' ? 'Центр' : 'Правая панель'
  
  return (
    <div
      ref={setNodeRef}
      className={`relative flex flex-col gap-4 h-full overflow-hidden ${getColumnWidth()} ${
        isOver && isCustomizing ? 'bg-accent/10 border-2 border-accent/50' : isCustomizing ? 'border-2 border-white/10' : ''
      } rounded-2xl transition-all p-2 ${!shouldShow ? 'hidden' : ''}`}
    >
      {/* Умная подсказка при наведении */}
      {isOver && isCustomizing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-accent text-white text-sm font-medium rounded-full shadow-lg shadow-accent/50 animate-bounce">
          📦 {columnName}
        </div>
      )}

      <SortableContext items={safeItems} strategy={verticalListSortingStrategy}>
        {safeItems.map((itemId) => (
          <SortableItem key={itemId} id={itemId} isCustomizing={isCustomizing} columnId={id}>
            {components[itemId]}
          </SortableItem>
        ))}
      </SortableContext>
      
      {/* Empty state indicator - показываем только в режиме редактирования */}
      {safeItems.length === 0 && isCustomizing && (
        <div className="flex-1 min-h-[200px] border-2 border-dashed border-accent/30 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <p className="text-white/40 mb-2">
              {id === 'right' ? '📦 Правая колонка' : t('dragHere')}
            </p>
            <p className="text-xs text-white/30">
              {id === 'right' ? 'Перетащите сюда блоки' : 'Перетащите элементы сюда'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface ComponentPanelProps {
  unusedComponents: LayoutComponent[]
  components: Record<LayoutComponent, ReactNode>
  isCustomizing: boolean
  t: (key: TranslationKey) => string
  componentNameMap: Record<string, TranslationKey>
}

function ComponentPanel({ unusedComponents, components, isCustomizing, t, componentNameMap }: ComponentPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'componentPanel' })
  
  // Группируем компоненты
  const widgets = unusedComponents.filter(c => c.includes('Widget'))
  const mainComponents = unusedComponents.filter(c => !c.includes('Widget'))
  
  return (
    <div 
      ref={setNodeRef}
      className={`w-64 flex-shrink-0 glass rounded-2xl p-4 overflow-y-auto transition-all ${
        isOver ? 'bg-red-500/20 border-2 border-red-500' : 'border-2 border-white/10'
      }`}
    >
      {/* Подсказка при наведении */}
      {isOver && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-full shadow-lg shadow-red-500/50 animate-bounce">
          🗑️ {t('removeWidget') || 'Удалить'}
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-4 text-accent flex items-center gap-2">
        <Plus className="w-5 h-5" />
        {t('availableComponents') || 'Доступные компоненты'}
      </h3>
      
      {unusedComponents.length > 0 ? (
        <>
          {/* Основные компоненты */}
          {mainComponents.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-white/60 mb-2 font-medium">{t('mainComponents') || 'Основные'}</p>
              <div className="space-y-2">
                {mainComponents.map((compId) => (
                  <SortableContext key={compId} items={[compId]} strategy={verticalListSortingStrategy}>
                    <SortableItem id={compId} isCustomizing={isCustomizing}>
                      <div className="glass-hover rounded-xl p-3 cursor-grab active:cursor-grabbing border border-blue-500/30">
                        <p className="text-sm font-medium">
                          {t((componentNameMap[compId] || compId) as TranslationKey)}
                        </p>
                      </div>
                    </SortableItem>
                  </SortableContext>
                ))}
              </div>
            </div>
          )}
          
          {/* Виджеты */}
          {widgets.length > 0 && (
            <div>
              <p className="text-xs text-white/60 mb-2 font-medium">{t('widgets') || 'Виджеты'}</p>
              <div className="space-y-2">
                {widgets.map((widgetId) => (
                  <SortableContext key={widgetId} items={[widgetId]} strategy={verticalListSortingStrategy}>
                    <SortableItem id={widgetId} isCustomizing={isCustomizing}>
                      <div className="glass-hover rounded-xl p-3 cursor-grab active:cursor-grabbing border border-accent/30">
                        <p className="text-sm font-medium">{t(widgetId as TranslationKey)}</p>
                      </div>
                    </SortableItem>
                  </SortableContext>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-xs text-white/40 mt-4">
            {t('dragComponentHint') || 'Перетащите компонент в нужную колонку'}
          </p>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-white/40 text-sm mb-2">
            {t('allComponentsUsed') || 'Все компоненты добавлены'}
          </p>
          <p className="text-xs text-white/30">
            {t('dragBackToRemove') || 'Перетащите сюда компонент, чтобы удалить'}
          </p>
        </div>
      )}
    </div>
  )
}

interface DualColumnLayoutProps {
  components: Record<LayoutComponent, ReactNode>
}

export default function DualColumnLayout({ components }: DualColumnLayoutProps) {
  const { layout, isCustomizing, setLayout } = useLayoutStore()
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState<string | null>(null)

  // Список всех доступных виджетов
  const availableWidgets: LayoutComponent[] = [
    'clockWidget',
    'weatherWidget',
    'quoteWidget',
    'statsWidget',
    'systemWidget',
    'asciiWidget',
    'emptyWidget'
  ]

  // Список всех компонентов (включая основные)
  const allComponents: LayoutComponent[] = [
    'header',
    'search',
    'contacts',
    'profile',
    'chatHeader',
    'chatMessages',
    'chatInput',
    ...availableWidgets
  ]

  // Маппинг для отображения имен компонентов
  const componentNameMap: Record<string, TranslationKey> = {
    'contacts': 'contactsList',
  }

  // Компоненты, которые еще не добавлены в layout
  const unusedComponents = allComponents.filter(comp => 
    !layout.left.includes(comp) && 
    !layout.center.includes(comp) && 
    !layout.right.includes(comp)
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Минимальная дистанция для быстрого захвата
      },
    })
  )

  // Кастомный алгоритм коллизий - комбинация pointerWithin и rectIntersection
  const customCollisionDetection = (args: any) => {
    // Сначала пробуем pointerWithin - более чувствительный
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }
    // Если не сработало, используем rectIntersection
    return rectIntersection(args)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as LayoutComponent
    const overId = over.id as string

    // Если бросили на ту же позицию
    if (activeId === overId) return

    // Проверяем, находится ли activeId в layout
    const isInLayout = layout.left.includes(activeId) || 
                       layout.center.includes(activeId) || 
                       layout.right.includes(activeId)

    // Если бросили на панель компонентов - удаляем из layout (только если он там есть)
    if (overId === 'componentPanel') {
      if (isInLayout) {
        // Удаляем компонент из всех колонок
        setLayout({
          left: layout.left.filter(id => id !== activeId),
          center: layout.center.filter(id => id !== activeId),
          right: layout.right.filter(id => id !== activeId)
        })
      }
      return
    }

    // Определяем исходную колонку (только если компонент в layout)
    let sourceColumn: 'left' | 'center' | 'right' | null = null
    if (layout.left.includes(activeId)) sourceColumn = 'left'
    else if (layout.center.includes(activeId)) sourceColumn = 'center'
    else if (layout.right.includes(activeId)) sourceColumn = 'right'

    // Определяем целевую колонку
    let targetColumn: 'left' | 'center' | 'right' | null = null
    
    // Проверяем, бросили ли на саму колонку
    if (overId === 'left') targetColumn = 'left'
    else if (overId === 'center') targetColumn = 'center'
    else if (overId === 'right') targetColumn = 'right'
    // Или на элемент внутри колонки
    else if (layout.left.includes(overId as LayoutComponent)) targetColumn = 'left'
    else if (layout.center.includes(overId as LayoutComponent)) targetColumn = 'center'
    else if (layout.right.includes(overId as LayoutComponent)) targetColumn = 'right'

    if (!targetColumn) return

    // Если компонент из панели (не в layout) - просто добавляем в целевую колонку
    if (!isInLayout) {
      setLayout({
        ...layout,
        [targetColumn]: [...layout[targetColumn], activeId]
      })
      return
    }

    // Если бросили на пустую колонку или на саму колонку
    if (overId === 'left' || overId === 'center' || overId === 'right') {
      if (targetColumn === sourceColumn) return // Та же колонка

      // Перемещаем между колонками
      const newSource = layout[sourceColumn!].filter(id => id !== activeId)
      const newTarget = [...layout[targetColumn], activeId]

      setLayout({
        ...layout,
        [sourceColumn!]: newSource,
        [targetColumn]: newTarget
      })
      return
    }

    // Если бросили на элемент в той же колонке - меняем порядок
    if (sourceColumn === targetColumn) {
      const items = [...layout[sourceColumn]]
      const oldIndex = items.indexOf(activeId)
      const newIndex = items.indexOf(overId as LayoutComponent)

      if (oldIndex !== newIndex && newIndex !== -1) {
        items.splice(oldIndex, 1)
        items.splice(newIndex, 0, activeId)

        setLayout({
          ...layout,
          [sourceColumn]: items
        })
      }
      return
    }

    // Если бросили на элемент в другой колонке - вставляем после него
    const sourceItems = layout[sourceColumn!].filter(id => id !== activeId)
    const targetItems = [...layout[targetColumn]]
    const targetIndex = targetItems.indexOf(overId as LayoutComponent)

    targetItems.splice(targetIndex + 1, 0, activeId)

    setLayout({
      ...layout,
      [sourceColumn!]: sourceItems,
      [targetColumn]: targetItems
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex overflow-hidden p-4 gap-4">
        {/* Панель виджетов в режиме кастомизации */}
        {isCustomizing && (
          <ComponentPanel 
            unusedComponents={unusedComponents} 
            components={components}
            isCustomizing={isCustomizing}
            t={t}
            componentNameMap={componentNameMap}
          />
        )}

        <DroppableColumn
          id="left"
          items={layout.left}
          components={components}
          isCustomizing={isCustomizing}
          t={t}
        />

        <DroppableColumn
          id="center"
          items={layout.center}
          components={components}
          isCustomizing={isCustomizing}
          t={t}
        />

        <DroppableColumn
          id="right"
          items={layout.right}
          components={components}
          isCustomizing={isCustomizing}
          t={t}
        />
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="glass rounded-2xl p-4 opacity-90 border-2 border-accent shadow-2xl shadow-accent/50">
            <p className="text-accent font-medium">📦 {t('moving')}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

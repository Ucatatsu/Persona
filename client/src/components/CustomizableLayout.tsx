import { ReactNode } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useLayoutStore, LayoutComponent } from '../store/layoutStore'

interface SortableItemProps {
  id: string
  children: ReactNode
  isCustomizing: boolean
}

function SortableItem({ id, children, isCustomizing }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isCustomizing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-8 top-1/2 -translate-y-1/2 z-50 cursor-grab active:cursor-grabbing p-2 glass rounded-lg hover:bg-white/20 transition-all"
        >
          <GripVertical className="w-5 h-5 text-cyan-400" />
        </div>
      )}
      {children}
    </div>
  )
}

interface CustomizableLayoutProps {
  components: {
    header: ReactNode
    search: ReactNode
    contacts: ReactNode
    profile: ReactNode
  }
}

export default function CustomizableLayout({ components }: CustomizableLayoutProps) {
  const { layout, isCustomizing, setLayout } = useLayoutStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = layout.left.indexOf(active.id as LayoutComponent)
      const newIndex = layout.left.indexOf(over.id as LayoutComponent)

      const newLeft = arrayMove(layout.left, oldIndex, newIndex)
      setLayout({ ...layout, left: newLeft })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={layout.left}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-4">
          {layout.left.map((componentId: LayoutComponent) => (
            <SortableItem
              key={componentId}
              id={componentId}
              isCustomizing={isCustomizing}
            >
              {components[componentId as keyof typeof components]}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

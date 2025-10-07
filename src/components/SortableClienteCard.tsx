import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ClienteCard } from './ClienteCard'
import { Cliente } from '@/lib/supabase'

interface SortableClienteCardProps {
  cliente: Cliente
  onDelete: (id: string) => Promise<{ error: string } | boolean>
  onStatusChange: (id: string, status: Cliente['status']) => Promise<void>
  onEdit: (id: string) => void
  isExpanded: boolean
  onToggleExpanded: (id: string) => void
}

export function SortableClienteCard({ cliente, onDelete, onStatusChange, onEdit, isExpanded, onToggleExpanded }: SortableClienteCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cliente.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ClienteCard
        cliente={cliente}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        isExpanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          attributes,
          listeners,
        }}
      />
    </div>
  )
}
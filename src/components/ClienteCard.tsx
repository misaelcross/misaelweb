import { useState } from 'react'
import { ChevronDown, ChevronUp, Edit, Trash2, Calendar, User, Briefcase, GripVertical } from 'lucide-react'
import { Cliente } from '@/lib/supabase'
import { toast } from 'sonner'

interface ClienteCardProps {
  cliente: Cliente
  onDelete: (id: string) => Promise<{ error: string } | boolean>
  onStatusChange: (id: string, status: Cliente['status']) => Promise<void>
  onPriorityChange: (id: string, prioridade: Cliente['prioridade']) => Promise<void>
  onEdit: (id: string) => void
  isExpanded?: boolean
  onToggleExpanded?: (id: string) => void
  dragHandleProps?: {
    ref: (element: HTMLElement | null) => void
    attributes: any
    listeners: any
  }
}

const statusColors = {
  'Pausado': 'bg-black/20 text-gray-200 border-neutral-700',
  'Não iniciado': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Em negociação': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Problemático': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Fixo': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Aguardando Feedback': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Em andamento': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Concluído': 'bg-green-500/20 text-green-300 border-green-500/30',
}

const prioridadeColors = {
  'Alta': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Normal': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Baixa': 'bg-slate-600/20 text-slate-200 border-slate-400/50',
}

export function ClienteCard({ cliente, onDelete, onStatusChange, onPriorityChange, onEdit, isExpanded, onToggleExpanded, dragHandleProps }: ClienteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)


  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    
    setIsDeleting(true)
    try {
      const result = await onDelete(cliente.id)
      if (typeof result === 'boolean') {
        if (result) {
          toast.success('Cliente excluído com sucesso!')
        } else {
          toast.error('Erro ao excluir cliente')
        }
      } else {
        toast.error('Erro ao excluir cliente: ' + result.error)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (newStatus: Cliente['status']) => {
    try {
      await onStatusChange(cliente.id, newStatus)
      toast.success('Status atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handlePriorityChange = async (newPriority: Cliente['prioridade']) => {
    try {
      await onPriorityChange(cliente.id, newPriority)
    } catch (error) {
      console.error('Erro ao alterar prioridade:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className={`border border-neutral-700 rounded-lg overflow-hidden hover:bg-neutral-700/30 transition-colors ${isExpanded ? 'bg-neutral-800/50' : ''}`}>
      {/* Header - Always Visible */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => onToggleExpanded?.(cliente.id)}
      >
        <div className="flex items-center justify-between">
          {/* Drag Handle */}
          {dragHandleProps && (
            <div
              ref={dragHandleProps.ref}
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
              className="flex items-center justify-center w-6 h-6 mr-3 cursor-grab active:cursor-grabbing hover:bg-neutral-600/50 rounded transition-colors"
              title="Arrastar para reordenar"
            >
              <GripVertical className="h-4 w-4 text-neutral-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-white truncate">
                {cliente.nome}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full border ${statusColors[cliente.status]}`}>
                {cliente.status}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full border ${prioridadeColors[cliente.prioridade]}`}>
                {cliente.prioridade}
              </span>
            </div>
            <p className="text-neutral-300 text-sm truncate">
              {cliente.tarefa}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(cliente.id)
              }}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-600 rounded-lg transition-colors"
              title="Editar cliente"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              disabled={isDeleting}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-600 rounded-lg transition-colors disabled:opacity-50"
              title="Excluir cliente"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
            
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-neutral-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-neutral-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-neutral-600">
          <div className="pt-4 space-y-4">
            {/* Detalhes do Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-neutral-300">
                <User className="h-4 w-4 text-neutral-400" />
                <span className="text-sm">Cliente: {cliente.nome}</span>
              </div>
              
              <div className="flex items-center gap-2 text-neutral-300">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <span className="text-sm">Início: {formatDate(cliente.data_inicio)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-neutral-300">
                <Briefcase className="h-4 w-4 text-neutral-400" />
                <span className="text-sm">Projeto: {cliente.tarefa}</span>
              </div>
            </div>

            {/* Descrição */}
            {cliente.descricao && (
              <div>
                <h4 className="text-sm font-medium text-neutral-300 mb-2">Descrição:</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {cliente.descricao}
                </p>
              </div>
            )}

            {/* Alterar Status */}
            <div>
              <h4 className="text-sm font-medium text-neutral-300 mb-2">Alterar Status:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(statusColors).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status as Cliente['status'])}
                    disabled={cliente.status === status}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      cliente.status === status
                        ? statusColors[status as Cliente['status']]
                        : 'bg-neutral-600 text-neutral-300 border-neutral-500 hover:bg-neutral-500'
                    } disabled:opacity-50`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Alterar Prioridade */}
            <div>
              <h4 className="text-sm font-medium text-neutral-300 mb-2">Alterar Prioridade:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(prioridadeColors).map((prioridade) => (
                  <button
                    key={prioridade}
                    onClick={() => handlePriorityChange(prioridade as Cliente['prioridade'])}
                    disabled={cliente.prioridade === prioridade}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      cliente.prioridade === prioridade
                        ? prioridadeColors[prioridade as Cliente['prioridade']]
                        : 'bg-neutral-600 text-neutral-300 border-neutral-500 hover:bg-neutral-500'
                    } disabled:opacity-50`}
                  >
                    {prioridade}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
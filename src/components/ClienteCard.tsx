import { useState } from 'react'
import { ChevronDown, ChevronUp, Edit, Trash2, Calendar, User, Briefcase } from 'lucide-react'
import { Cliente } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface ClienteCardProps {
  cliente: Cliente
  onDelete: (id: string) => Promise<{ error: string | null }>
  onStatusChange: (id: string, status: Cliente['status']) => Promise<void>
}

const statusColors = {
  'Fixo': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Em andamento': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Aguardando feedback': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Pausado': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Concluído': 'bg-green-500/20 text-green-300 border-green-500/30',
}

const prioridadeColors = {
  'High': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Normal': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Low': 'bg-green-500/20 text-green-300 border-green-500/30',
}

export function ClienteCard({ cliente, onDelete, onStatusChange }: ClienteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    
    setIsDeleting(true)
    try {
      const { error } = await onDelete(cliente.id)
      if (error) {
        toast.error('Erro ao excluir cliente: ' + error)
      } else {
        toast.success('Cliente excluído com sucesso!')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className={`border border-neutral-700 rounded-lg overflow-hidden hover:bg-neutral-700/30 transition-colors ${isExpanded ? 'bg-neutral-800/50' : ''}`}>
      {/* Header - Always Visible */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
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
                navigate(`/cliente/editar/${cliente.id}`)
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
          </div>
        </div>
      )}
    </div>
  )
}
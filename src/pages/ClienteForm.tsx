import { useState, useEffect } from 'react'
import { X, Save, Calendar, User, Briefcase, FileText, AlertCircle } from 'lucide-react'
import { useClientes } from '@/hooks/useClientes'
import { Cliente } from '@/lib/supabase'
import { toast } from 'sonner'

interface ClienteFormProps {
  isOpen: boolean
  onClose: () => void
  clienteId?: string
}

export function ClienteForm({ isOpen, onClose, clienteId }: ClienteFormProps) {
  const isEditing = Boolean(clienteId)
  const { clientes, createCliente, updateCliente, loading } = useClientes()
  
  const [formData, setFormData] = useState({
    nome: '',
    status: 'Não iniciado' as Cliente['status'],
    tarefa: '',
    prioridade: 'Normal' as Cliente['prioridade'],
    descricao: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_termino: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isEditing && clienteId) {
      const cliente = clientes.find(c => c.id === clienteId)
      if (cliente) {
        setFormData({
          nome: cliente.nome,
          status: cliente.status,
          tarefa: cliente.tarefa,
          prioridade: cliente.prioridade,
          descricao: cliente.descricao || '',
          data_inicio: cliente.data_inicio.split('T')[0],
          data_termino: cliente.data_termino ? cliente.data_termino.split('T')[0] : ''
        })
      }
    } else {
      // Reset form when opening for new client
      setFormData({
        nome: '',
        status: 'Não iniciado' as Cliente['status'],
        tarefa: '',
        prioridade: 'Normal' as Cliente['prioridade'],
        descricao: '',
        data_inicio: new Date().toISOString().split('T')[0],
        data_termino: ''
      })
      setErrors({})
    }
  }, [isEditing, clienteId, clientes, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome do cliente é obrigatório'
    }
    
    if (!formData.tarefa.trim()) {
      newErrors.tarefa = 'Projeto/Tarefa é obrigatório'
    }
    
    if (!formData.data_inicio) {
      newErrors.data_inicio = 'Data de início é obrigatória'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (isEditing && clienteId) {
        const { error } = await updateCliente(clienteId, formData)
        if (error) {
          toast.error('Erro ao atualizar cliente: ' + error)
        } else {
          toast.success('Cliente atualizado com sucesso!')
          onClose()
        }
      } else {
        const { error } = await createCliente(formData)
        if (error) {
          toast.error('Erro ao criar cliente: ' + error)
        } else {
          toast.success('Cliente criado com sucesso!')
          onClose()
        }
      }
    } catch (error) {
      toast.error('Erro inesperado ao salvar cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay com blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-neutral-800 rounded-lg border border-neutral-700 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header Fixo */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-neutral-50">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo Scrollável */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="p-6 space-y-6 flex-1">
          {/* Nome do Cliente */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <User className="h-4 w-4" />
              Nome do Cliente
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className={`w-full px-3 py-2 bg-neutral-700 border rounded-lg text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white ${
                errors.nome ? 'border-red-500' : 'border-neutral-600'
              }`}
              placeholder="Digite o nome do cliente"
            />
            {errors.nome && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.nome}
              </p>
            )}
          </div>

          {/* Projeto/Tarefa */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Briefcase className="h-4 w-4" />
              Projeto/Tarefa
            </label>
            <input
              type="text"
              value={formData.tarefa}
              onChange={(e) => handleInputChange('tarefa', e.target.value)}
              className={`w-full px-3 py-2 bg-neutral-700 border rounded-lg text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white ${
                errors.tarefa ? 'border-red-500' : 'border-neutral-600'
              }`}
              placeholder="Digite o nome do projeto ou tarefa"
            />
            {errors.tarefa && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.tarefa}
              </p>
            )}
          </div>

          {/* Status e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="Não iniciado">Não iniciado</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Aguardando feedback">Aguardando feedback</option>
                <option value="Pausado">Pausado</option>
                <option value="Problemático">Problemático</option>
                <option value="Fixo">Fixo</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Prioridade
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) => handleInputChange('prioridade', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="Alta">Alta</option>
                <option value="Normal">Normal</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
          </div>

          {/* Data de Início */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Calendar className="h-4 w-4" />
              Data de Início
            </label>
            <input
              type="date"
              value={formData.data_inicio}
              onChange={(e) => handleInputChange('data_inicio', e.target.value)}
              className={`w-full px-3 py-2 bg-neutral-700 border rounded-lg text-neutral-50 focus:outline-none focus:ring-2 focus:ring-white ${
                errors.data_inicio ? 'border-red-500' : 'border-neutral-600'
              }`}
            />
            {errors.data_inicio && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.data_inicio}
              </p>
            )}
          </div>

          {/* Data de Término */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Calendar className="h-4 w-4" />
              Data de Término
            </label>
            <input
              type="date"
              value={formData.data_termino}
              onChange={(e) => handleInputChange('data_termino', e.target.value)}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <FileText className="h-4 w-4" />
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white resize-none"
              placeholder="Descreva detalhes sobre o projeto ou cliente (opcional)"
            />
          </div>

            </div>

            {/* Footer Fixo com Botões */}
            <div className="p-6 border-t border-neutral-700 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-white text-black hover:bg-neutral-100 disabled:bg-neutral-200 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Cliente' : 'Criar Cliente')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
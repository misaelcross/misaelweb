import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Users, Clock, CheckCircle, AlertCircle, ChevronDown, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useClientes } from '@/hooks/useClientes'
import { ClienteCard } from '@/components/ClienteCard'
import { SortableClienteCard } from '@/components/SortableClienteCard'
import { ClienteForm } from '@/pages/ClienteForm'
import { Cliente, supabase } from '@/lib/supabase'
import { useUserProfile } from '@/contexts/UserContext'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers'

export function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { clientes, loading, error, refetch, deleteCliente, updateCliente } = useClientes()
  const { userProfile } = useUserProfile()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Cliente['status'] | 'all'>('all')
  const [prioridadeFilter, setPrioridadeFilter] = useState<Cliente['prioridade'] | 'all'>('all')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showClienteForm, setShowClienteForm] = useState(false)
  const [editingClienteId, setEditingClienteId] = useState<string | undefined>()
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [orderedClientes, setOrderedClientes] = useState<Cliente[]>([])
  const [expandedClienteId, setExpandedClienteId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Configurar sensores para drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Função para obter iniciais do usuário
  const getUserInitials = (email: string) => {
    const name = email.split('@')[0]
    return name.substring(0, 2).toUpperCase()
  }

  // Função para obter nome do usuário
  const getUserName = (email: string) => {
    return email.split('@')[0]
  }

  // Função para carregar dados do perfil do usuário
  const loadUserProfile = async () => {
    if (!user?.id) return

    try {
      // Buscar dados do perfil na tabela profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single()

      if (profileError) {
        // Se não existe perfil, usar dados do email como fallback
        if (profileError.code === 'PGRST116') {
          setUserName(user.email?.split('@')[0] || 'Usuário')
        }
        console.error('Erro ao buscar perfil:', profileError)
      } else if (profile) {
        // Usar nome do perfil se disponível, senão usar email
        setUserName(profile.name || user.email?.split('@')[0] || 'Usuário')
        
        // Se tem avatar_url no perfil, usar ele
        if (profile.avatar_url) {
          setUserAvatarUrl(profile.avatar_url)
          return
        }
      }

      // Se não tem avatar_url no perfil, buscar no storage (compatibilidade)
      const { data: files, error } = await supabase.storage
        .from('avatars')
        .list(user.id, {
          limit: 1,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('Erro ao buscar avatar:', error)
        return
      }

      if (files && files.length > 0) {
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(`${user.id}/${files[0].name}`)
        
        setUserAvatarUrl(data.publicUrl)
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      // Fallback para email
      setUserName(user.email?.split('@')[0] || 'Usuário')
    }
  }

  // Carregar perfil quando o componente montar ou usuário mudar
  useEffect(() => {
    if (user?.id) {
      loadUserProfile()
    }
  }, [user?.id])

  // Atualizar clientes ordenados quando clientes mudarem
  useEffect(() => {
    // Ordenar clientes por order_position (se existir) ou manter ordem original
    const sorted = [...clientes].sort((a, b) => {
      const orderA = a.order_position ?? 999999
      const orderB = b.order_position ?? 999999
      return orderA - orderB
    })
    setOrderedClientes(sorted)
  }, [clientes])

  // Função para lidar com o fim do drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = orderedClientes.findIndex(cliente => cliente.id === active.id)
    const newIndex = orderedClientes.findIndex(cliente => cliente.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrderedClientes = arrayMove(orderedClientes, oldIndex, newIndex)
      setOrderedClientes(newOrderedClientes)

      // Atualizar order_position no banco de dados
      try {
        const updates = newOrderedClientes.map((cliente, index) => ({
          id: cliente.id,
          order_position: index
        }))

        // Atualizar cada cliente com sua nova posição
        for (const update of updates) {
          await updateCliente(update.id, { order_position: update.order_position })
        }

        toast.success('Ordem dos clientes atualizada!')
      } catch (error) {
        console.error('Erro ao atualizar ordem:', error)
        toast.error('Erro ao salvar nova ordem')
        // Reverter mudança local em caso de erro
        setOrderedClientes(orderedClientes)
      }
    }
  }

  const handleDeleteCliente = async (id: string) => {
    const result = await deleteCliente(id)
    return result
  }

  const handleStatusChange = async (id: string, status: Cliente['status']) => {
    await updateCliente(id, { status })
  }

  // Filtrar clientes ordenados
  const filteredClientes = orderedClientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.tarefa.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || cliente.status === statusFilter
    const matchesPrioridade = prioridadeFilter === 'all' || cliente.prioridade === prioridadeFilter
    
    return matchesSearch && matchesStatus && matchesPrioridade
  })

  // Estatísticas
  const stats = {
    total: clientes.length,
    emAndamento: clientes.filter(c => c.status === 'Em andamento').length,
    concluidos: clientes.filter(c => c.status === 'Concluído').length,
    aguardandoFeedback: clientes.filter(c => c.status === 'Aguardando feedback').length,
  }

  const handleLogout = async () => {
    try {
      const result = await signOut()
      
      if (result.localLogout) {
        toast.success('Logout realizado localmente (sem conexão com servidor)')
      } else {
        toast.success('Logout realizado com sucesso!')
      }
      
      navigate('/login')
    } catch (error) {
      console.error('Erro no logout:', error)
      // Mesmo com erro, redirecionar para login
      navigate('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-white">
                Cliengo
              </h1>
            </div>
            
            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center overflow-hidden">
                  {userProfile.avatarUrl ? (
                    <img 
                      src={userProfile.avatarUrl} 
                      alt="Avatar do usuário" 
                      className="w-full h-full object-cover rounded-full"
                      onError={() => setUserAvatarUrl(null)}
                    />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {user?.email ? getUserInitials(user.email) : 'U'}
                    </span>
                  )}
                </div>
                
                {/* Nome */}
                <span className="text-neutral-300 text-sm font-medium">
                  {userProfile.name || (user?.email ? getUserName(user.email) : 'Usuário')}
                </span>
                
                {/* Chevron */}
                <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/perfil')
                        setShowUserDropdown(false)
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </button>
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowUserDropdown(false)
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-lg border border-neutral-700">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-300">Total de Clientes</p>
                <p className="text-2xl font-semibold text-neutral-50">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-lg border border-neutral-700">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-300">Em Andamento</p>
                <p className="text-2xl font-semibold text-neutral-50">{stats.emAndamento}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-lg border border-neutral-700">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-300">Concluídos</p>
                <p className="text-2xl font-semibold text-neutral-50">{stats.concluidos}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-lg border border-neutral-700">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-300">Aguardando Feedback</p>
                <p className="text-2xl font-semibold text-neutral-50">{stats.aguardandoFeedback}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nome ou projeto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Cliente['status'] | 'all')}
              className="px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-neutral-50 focus:outline-none focus:ring-2 focus:ring-white min-w-[180px]"
            >
              <option value="all">Todos os status</option>
              <option value="Não iniciado">Não iniciado</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Aguardando feedback">Aguardando feedback</option>
              <option value="Pausado">Pausado</option>
              <option value="Problemático">Problemático</option>
              <option value="Fixo">Fixo</option>
              <option value="Concluído">Concluído</option>
            </select>
            
            <select
              value={prioridadeFilter}
              onChange={(e) => setPrioridadeFilter(e.target.value as Cliente['prioridade'] | 'all')}
              className="px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-neutral-50 focus:outline-none focus:ring-2 focus:ring-white min-w-[180px]"
            >
              <option value="all">Todas as prioridades</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
            
            <button
              onClick={() => {
                setEditingClienteId(undefined)
                setShowClienteForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-neutral-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </button>
          </div>
        </div>



        {/* Lista de Clientes */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6">
            Erro ao carregar clientes: {error}
          </div>
        )}

        {filteredClientes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-300">Nenhum cliente encontrado</h3>
            <p className="mt-1 text-sm text-neutral-400">
              {clientes.length === 0 
                ? 'Comece adicionando seu primeiro cliente.'
                : 'Tente ajustar os filtros de busca.'
              }
            </p>
            {clientes.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    setEditingClienteId(undefined)
                    setShowClienteForm(true)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Cliente
                </button>
              </div>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={filteredClientes.map(cliente => cliente.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {filteredClientes.map((cliente) => (
                  <SortableClienteCard
                    key={cliente.id}
                    cliente={cliente}
                    onDelete={handleDeleteCliente}
                    onStatusChange={handleStatusChange}
                    onEdit={(id) => {
                      setEditingClienteId(id)
                      setShowClienteForm(true)
                    }}
                    isExpanded={expandedClienteId === cliente.id}
                    onToggleExpanded={(id) => {
                      setExpandedClienteId(expandedClienteId === id ? null : id)
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Modal do Formulário de Cliente */}
        <ClienteForm
          isOpen={showClienteForm}
          onClose={() => {
            setShowClienteForm(false)
            setEditingClienteId(undefined)
          }}
          clienteId={editingClienteId}
        />
      </div>
    </div>
  )
}
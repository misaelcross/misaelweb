import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Calendar, Shield, ChevronDown, ChevronRight, Edit2, Check, X, Upload, Camera } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useUserProfile } from '@/contexts/UserContext'

export function Perfil() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { userProfile, updateUserProfile } = useUserProfile()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de edição
  const [editingField, setEditingField] = useState<'name' | 'email' | 'photo' | null>(null)
  const [tempName, setTempName] = useState('')
  const [tempEmail, setTempEmail] = useState('')
  const [tempPhoto, setTempPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [localProfile, setLocalProfile] = useState({
    name: '',
    email: user?.email || '',
    photo_url: null as string | null
  })

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

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      toast.success('Logout realizado com sucesso!')
      navigate('/login')
    } catch (error) {
      toast.error('Erro ao fazer logout')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Função para carregar foto do avatar do usuário
  const loadUserAvatar = async () => {
    if (!user?.id) return

    try {
      // Buscar a foto mais recente do usuário no bucket avatars
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
        
        setLocalProfile(prev => ({ ...prev, photo_url: data.publicUrl }))
      }
    } catch (error) {
      console.error('Erro ao carregar avatar:', error)
    }
  }

  // Função para carregar dados do perfil do Supabase
  const loadProfile = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single()

      if (error) {
        // Se não existe perfil, criar um novo
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: user.email?.split('@')[0] || 'Usuário'
            })

          if (!insertError) {
            setLocalProfile(prev => ({
              ...prev,
              name: user.email?.split('@')[0] || 'Usuário',
              email: user.email || ''
            }))
          }
        }
        return
      }

      if (data) {
        setLocalProfile(prev => ({
            ...prev,
            name: data.name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || ''
          }))
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  // Carregar dados do perfil
  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user?.id])

  // Carregar avatar quando o componente montar ou usuário mudar
  useEffect(() => {
    if (user?.id) {
      loadUserAvatar()
    }
  }, [user?.id])

  // Funções de edição
  const startEditing = (field: 'name' | 'email' | 'photo') => {
    setEditingField(field)
    if (field === 'name') {
      setTempName(userProfile.name || localProfile.name)
    } else if (field === 'email') {
      setTempEmail(localProfile.email)
    } else if (field === 'photo') {
      fileInputRef.current?.click()
    }
  }

  const cancelEditing = () => {
    setEditingField(null)
    setTempName('')
    setTempEmail('')
    setTempPhoto(null)
    setPhotoPreview(null)
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setTempPhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setEditingField('photo')
    }
  }

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      // Verificar se o arquivo é válido
      if (!file || !user?.id) {
        throw new Error('Arquivo ou usuário inválido')
      }

      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Use JPG, PNG ou WebP.')
      }

      // Validar tamanho do arquivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo 5MB.')
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Tentar fazer upload
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Erro no upload:', uploadError)
        throw new Error(`Erro no upload: ${uploadError.message}`)
      }

      // Obter URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (!data.publicUrl) {
        throw new Error('Erro ao obter URL da imagem')
      }

      return data.publicUrl
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error)
      
      // Mensagens de erro mais específicas
      if (error.message?.includes('Bucket not found')) {
        toast.error('Erro de configuração do storage. Contate o administrador.')
      } else if (error.message?.includes('não suportado')) {
        toast.error(error.message)
      } else if (error.message?.includes('muito grande')) {
        toast.error(error.message)
      } else {
        toast.error('Erro ao fazer upload da foto. Tente novamente.')
      }
      
      return null
    }
  }

  const saveField = async () => {
    if (!editingField) return

    setIsLoading(true)
    try {
      let success = false

      if (editingField === 'name' && tempName.trim()) {
        // Salvar nome no Supabase
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user?.id,
            name: tempName.trim()
          })

        if (error) {
          console.error('Erro ao salvar nome:', error)
          toast.error('Erro ao salvar nome')
          return
        }

        setLocalProfile(prev => ({ ...prev, name: tempName.trim() }))
        // Atualizar contexto global para sincronizar com navbar
        updateUserProfile({ name: tempName.trim() })
        toast.success('Nome atualizado com sucesso!')
        success = true
      } else if (editingField === 'email' && tempEmail.trim()) {
        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(tempEmail.trim())) {
          toast.error('Formato de email inválido')
          return
        }
        
        // Para email, seria necessário usar o Supabase Auth
        toast.info('Atualização de email ainda não implementada')
        success = false
      } else if (editingField === 'photo' && tempPhoto) {
        const photoUrl = await uploadPhoto(tempPhoto)
        if (photoUrl) {
          // Salvar URL do avatar no Supabase
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user?.id,
              avatar_url: photoUrl
            })

          if (error) {
            console.error('Erro ao salvar avatar:', error)
            toast.error('Erro ao salvar avatar')
            return
          }

          setLocalProfile(prev => ({ ...prev, photo_url: photoUrl }))
          // Atualizar contexto global para sincronizar com navbar
          updateUserProfile({ avatarUrl: photoUrl })
          toast.success('Foto atualizada com sucesso!')
          success = true
        } else {
          // O erro já foi mostrado na função uploadPhoto
          return
        }
      }

      if (success) {
        cancelEditing()
      } else if (editingField !== 'email') {
        toast.error('Nenhuma alteração foi feita')
      }
    } catch (error: any) {
      toast.error('Erro ao atualizar informação')
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-2xl font-semibold text-white hover:text-neutral-200 transition-colors"
              >
                Cliengo
              </button>
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
                      onError={() => updateUserProfile({ avatarUrl: null })}
                    />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {user?.email ? getUserInitials(user.email) : 'U'}
                    </span>
                  )}
                </div>
                
                {/* Nome */}
                <span className="text-neutral-300 text-sm font-medium">
                  {userProfile?.name || (user?.email ? getUserName(user.email) : 'Usuário')}
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

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center py-3 text-sm">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="h-4 w-4 text-neutral-500 mx-2" />
          <span className="text-neutral-300">Perfil</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="rounded-lg border border-neutral-700 overflow-hidden">
          {/* Profile Header */}
          <div className="px-6 py-8">
            <div className="flex items-center">
              <div className="relative group">
                {userProfile.avatarUrl || photoPreview ? (
                  <img 
                    src={photoPreview || userProfile.avatarUrl || ''} 
                    alt="Foto do perfil" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-white/20 rounded-full p-4 w-20 h-20 flex items-center justify-center">
                    <User className="h-12 w-12 text-white" />
                  </div>
                )}
                
                {editingField === 'photo' ? (
                  <div className="absolute -bottom-2 -right-2 flex gap-1">
                    <button
                      onClick={saveField}
                      disabled={isLoading || !tempPhoto}
                      className="bg-green-600 hover:bg-green-700 text-white p-1 rounded-full transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditing('photo')}
                    className="absolute -bottom-2 -right-2 bg-neutral-700 hover:bg-neutral-600 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                )}
              </div>
              
              <div className="ml-6 flex-1">
                <div className="flex items-center gap-2 group">
                  {editingField === 'name' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="text-2xl font-bold bg-neutral-800 text-white border border-neutral-600 rounded px-2 py-1"
                        autoFocus
                      />
                      <button
                        onClick={saveField}
                        disabled={isLoading || !tempName.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white p-1 rounded transition-colors disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-red-600 hover:bg-red-700 text-white p-1 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-white">
                        {userProfile.name || localProfile.name || 'Usuário'}
                      </h2>
                      <button
                        onClick={() => startEditing('name')}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white transition-all p-1"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-neutral-100">
                  Administrador da Plataforma
                </p>
              </div>
            </div>
          </div>

          {/* Input oculto para upload de foto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />

          {/* Profile Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações Pessoais */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-neutral-50 border-b border-neutral-700 pb-2">
                  Informações Pessoais
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 group">
                    <Mail className="h-5 w-5 text-neutral-400" />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-400">Email</p>
                      {editingField === 'email' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={tempEmail}
                            onChange={(e) => setTempEmail(e.target.value)}
                            className="bg-neutral-800 text-white border border-neutral-600 rounded px-2 py-1 flex-1"
                            autoFocus
                          />
                          <button
                            onClick={saveField}
                            disabled={isLoading || !tempEmail.trim()}
                            className="bg-green-600 hover:bg-green-700 text-white p-1 rounded transition-colors disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-neutral-50">{localProfile.email || 'Não informado'}</p>
                          <button
                            onClick={() => startEditing('email')}
                            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white transition-all p-1"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-400">ID do Usuário</p>
                      <p className="text-neutral-50 font-mono text-sm">
                        {user?.id || 'Não disponível'}
                      </p>
                    </div>
                  </div>
                  
                  {user?.created_at && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-400">Membro desde</p>
                        <p className="text-neutral-50">
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Configurações da Conta */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-neutral-50 border-b border-neutral-700 pb-2">
                  Configurações da Conta
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-neutral-700 rounded-lg p-4">
                    <h4 className="text-neutral-50 font-medium mb-2">Segurança</h4>
                    <p className="text-neutral-400 text-sm mb-3">
                      Sua conta está protegida pela autenticação do Supabase
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span className="text-white text-sm">Conta Verificada</span>
                    </div>
                  </div>
                  
                  <div className="bg-neutral-700 rounded-lg p-4">
                    <h4 className="text-neutral-50 font-medium mb-2">Sessão Ativa</h4>
                    <p className="text-neutral-400 text-sm mb-3">
                      Você está conectado e pode acessar todos os recursos
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white text-sm">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
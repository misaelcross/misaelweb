import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  name: string
  avatarUrl: string | null
}

interface UserContextType {
  userProfile: UserProfile
  updateUserProfile: (updates: Partial<UserProfile>) => void
  refreshUserProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    avatarUrl: null
  })

  // Função para carregar dados do perfil do Supabase
  const loadUserProfile = async () => {
    if (!user?.id) return

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single()

      if (profileError) {
        // Se não existe perfil, usar dados do email como fallback
        if (profileError.code === 'PGRST116') {
          setUserProfile({
            name: user.email?.split('@')[0] || 'Usuário',
            avatarUrl: null
          })
        }
        console.error('Erro ao buscar perfil:', profileError)
      } else if (profile) {
        setUserProfile({
          name: profile.name || user.email?.split('@')[0] || 'Usuário',
          avatarUrl: profile.avatar_url
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      // Fallback para email
      setUserProfile({
        name: user.email?.split('@')[0] || 'Usuário',
        avatarUrl: null
      })
    }
  }

  // Função para atualizar o perfil localmente
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updates }))
  }

  // Função para recarregar o perfil do banco
  const refreshUserProfile = async () => {
    await loadUserProfile()
  }

  // Carregar perfil quando o usuário mudar
  useEffect(() => {
    if (user?.id) {
      loadUserProfile()
    } else {
      // Limpar perfil quando não há usuário
      setUserProfile({ name: '', avatarUrl: null })
    }
  }, [user?.id])

  return (
    <UserContext.Provider value={{
      userProfile,
      updateUserProfile,
      refreshUserProfile
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserProfile() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProvider')
  }
  return context
}
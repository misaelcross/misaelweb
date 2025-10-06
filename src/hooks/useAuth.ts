import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    try {
      // Verificar se há uma sessão válida antes de tentar logout remoto
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('Nenhuma sessão ativa encontrada, fazendo logout local')
        setUser(null)
        // Limpar dados locais do Supabase
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.token')
        return { error: null, localLogout: true }
      }

      // Verificar se a sessão não está expirada
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.log('Sessão expirada, fazendo logout local')
        setUser(null)
        // Limpar dados locais do Supabase
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.token')
        return { error: null, localLogout: true }
      }
      
      // Tentar logout remoto apenas se a sessão for válida
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.warn('Erro no logout remoto:', error.message)
        
        // Verificar se é erro de sessão não encontrada (403)
        if (error.message.includes('session_not_found') || error.message.includes('Auth session missing')) {
          console.log('Sessão não encontrada no servidor, fazendo logout local')
          setUser(null)
          // Limpar dados locais do Supabase
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.removeItem('supabase.auth.token')
          return { error: null, localLogout: true }
        }
        
        // Para outros erros, também fazer logout local
        setUser(null)
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.token')
        return { error: null, localLogout: true }
      }
      
      return { error: null, localLogout: false }
    } catch (networkError) {
      console.warn('Erro de rede no logout, fazendo logout local:', networkError)
      // Em caso de erro de rede (como net::ERR_ABORTED), fazer logout local
      setUser(null)
      // Limpar dados locais do Supabase
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.removeItem('supabase.auth.token')
      return { error: null, localLogout: true }
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
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
      // Tentar logout remoto primeiro
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.warn('Erro no logout remoto:', error.message)
        // Se houver erro no logout remoto, fazer logout local
        setUser(null)
        // Limpar dados locais do Supabase
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
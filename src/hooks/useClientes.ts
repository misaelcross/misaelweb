import { useState, useEffect } from 'react'
import { supabase, Cliente } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useClientes() {
  const { user } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClientes = async () => {
    if (!user) {
      setClientes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setClientes(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [user])

  const createCliente = async (clienteData: Omit<Cliente, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{ ...clienteData, user_id: user.id }])
        .select()
        .single()

      if (error) throw error

      setClientes(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente'
      return { data: null, error: errorMessage }
    }
  }

  const updateCliente = async (id: string, updates: Partial<Cliente>) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      console.log('Tentando atualizar cliente:', { id, updates, user_id: user.id })
      
      const { data, error } = await supabase
        .from('clientes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      console.log('Resultado da atualização:', { data, error })

      if (error) {
        console.error('Erro do Supabase:', error)
        throw error
      }

      setClientes(prev => prev.map(cliente => 
        cliente.id === id ? data : cliente
      ))
      return { data, error: null }
    } catch (err) {
      console.error('Erro completo na atualização:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente'
      return { data: null, error: errorMessage }
    }
  }

  const deleteCliente = async (id: string) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setClientes(prev => prev.filter(cliente => cliente.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar cliente'
      return { error: errorMessage }
    }
  }

  return {
    clientes,
    loading,
    error,
    createCliente,
    updateCliente,
    deleteCliente,
    refetch: fetchClientes,
  }
}
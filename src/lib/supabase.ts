import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Cliente {
  id: string
  user_id: string
  nome: string
  status: 'Fixo' | 'Em andamento' | 'Aguardando feedback' | 'Pausado' | 'Concluído'
  tarefa: string
  prioridade: 'High' | 'Normal' | 'Low'
  descricao?: string
  data_inicio: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name?: string
}
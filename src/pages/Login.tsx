import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Login() {
  const { user, signIn, signUp, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  if (user && !loading) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    if (isSignUp) {
      if (!name) {
        toast.error('Por favor, preencha o nome')
        return
      }
      
      if (password !== confirmPassword) {
        toast.error('As senhas não coincidem')
        return
      }

      if (password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres')
        return
      }
    }

    setIsLoading(true)
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password)
        
        if (error) {
          toast.error('Erro ao criar conta: ' + error.message)
        } else {
          toast.success('Conta criada com sucesso! Verifique seu email para confirmar.')
          setIsSignUp(false)
          setName('')
          setConfirmPassword('')
        }
      } else {
        const { error } = await signIn(email, password)
        
        if (error) {
          toast.error('Erro ao fazer login: ' + error.message)
        } else {
          toast.success('Login realizado com sucesso!')
        }
      }
    } catch (err) {
      toast.error('Erro inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-neutral-800 rounded-lg shadow-xl p-8 border border-neutral-700">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-50 mb-2">
              Gerenciamento de Clientes
            </h1>
            <p className="text-neutral-300">
              {isSignUp ? 'Crie sua conta para começar' : 'Faça login para acessar sua plataforma'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-2">
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent pr-10"
                  placeholder={isSignUp ? "Mínimo 6 caracteres" : "Sua senha"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent pr-10"
                    placeholder="Confirme sua senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Criar Conta
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Entrar
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-400 text-sm">
              {isSignUp ? (
                <>
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false)
                      setName('')
                      setConfirmPassword('')
                    }}
                    className="text-white hover:text-neutral-300 cursor-pointer underline"
                  >
                    Fazer login
                  </button>
                </>
              ) : (
                <>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-white hover:text-neutral-300 cursor-pointer underline"
                  >
                    Criar conta
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
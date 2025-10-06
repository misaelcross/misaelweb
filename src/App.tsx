import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { UserProvider } from '@/contexts/UserContext'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Perfil } from '@/pages/Perfil'

function App() {
  return (
    <Router>
      <UserProvider>
        <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
        </Routes>
        
        <Toaster 
          theme="dark"
          position="top-right"
          richColors
        />
        </div>
      </UserProvider>
    </Router>
  )
}

export default App

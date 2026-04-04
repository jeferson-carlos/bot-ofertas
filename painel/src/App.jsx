import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import RotaProtegida from './components/RotaProtegida'
import AppLayout from './components/layouts/AppLayout'

import Landing       from './pages/public/Landing'
import Login         from './pages/public/Login'
import Cadastro      from './pages/public/Cadastro'

import Dashboard     from './pages/app/Dashboard'
import Ofertas       from './pages/app/Ofertas'
import Keywords      from './pages/app/Keywords'
import Planos        from './pages/app/Planos'
import Configuracoes from './pages/app/Configuracoes'
import Tutorial      from './pages/app/Tutorial'
import Perfil        from './pages/app/Perfil'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Páginas públicas */}
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Páginas protegidas */}
        <Route path="/app/*" element={
          <RotaProtegida>
            <AppLayout>
              <Routes>
                <Route index                  element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"       element={<Dashboard />} />
                <Route path="ofertas"         element={<Ofertas />} />
                <Route path="keywords"        element={<Keywords />} />
                <Route path="planos"          element={<Planos />} />
                <Route path="configuracoes"   element={<Configuracoes />} />
                <Route path="tutorial"        element={<Tutorial />} />
                <Route path="perfil"          element={<Perfil />} />
              </Routes>
            </AppLayout>
          </RotaProtegida>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

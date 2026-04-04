import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RotaProtegida({ children }) {
  const { user, loading, logoutManual } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Carregando...</p>
      </div>
    )
  }

  if (!user) {
    if (logoutManual.current) {
      logoutManual.current = false
      return <Navigate to="/" replace />
    }
    return <Navigate to="/login" state={{ sessaoExpirada: true }} replace />
  }

  return children
}

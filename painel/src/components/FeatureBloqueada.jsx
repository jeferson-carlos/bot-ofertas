import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const LABELS = { pro: 'Pro', premium: 'Premium' }

export default function FeatureBloqueada({ plano = 'pro', children }) {
  const navigate      = useNavigate()
  const { temAcesso } = useAuth()

  if (temAcesso(plano)) return children

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>
      <div style={styles.overlay}>
        <div style={styles.card}>
          <span style={styles.icone}>🔒</span>
          <p style={styles.titulo}>Disponível no plano {LABELS[plano]}</p>
          <p style={styles.subtitulo}>Faça upgrade para desbloquear esta funcionalidade.</p>
          <button onClick={() => navigate('/app/planos')} style={styles.botao}>
            Ver planos
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay:   { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card:      { background: '#1e293b', border: '1px solid #374151', borderRadius: '16px', padding: '32px', textAlign: 'center', maxWidth: '320px' },
  icone:     { fontSize: '32px' },
  titulo:    { color: '#e2e8f0', fontWeight: 'bold', margin: '12px 0 6px', fontSize: '16px' },
  subtitulo: { color: '#6b7280', fontSize: '13px', margin: '0 0 20px' },
  botao:     { background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
}

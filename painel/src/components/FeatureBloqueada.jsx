import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { color, shadow, radius, borda } from '../theme'

const LABELS = { pro: 'Pro', premium: 'Premium' }

export default function FeatureBloqueada({ plano = 'pro', children }) {
  const navigate      = useNavigate()
  const { temAcesso } = useAuth()

  if (temAcesso(plano)) return children

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ opacity: 0.2, pointerEvents: 'none', userSelect: 'none', filter: 'blur(1px)' }}>
        {children}
      </div>
      <div style={styles.overlay}>
        <div style={styles.card}>
          <div style={styles.iconeWrap}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <p style={styles.titulo}>Disponível no plano {LABELS[plano]}</p>
          <p style={styles.subtitulo}>Faça upgrade para desbloquear esta funcionalidade e automatizar seu canal.</p>
          <button onClick={() => navigate('/app/planos')} style={styles.botao}>
            Ver planos e fazer upgrade
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: `radial-gradient(ellipse at center, rgba(7,11,18,0.5) 0%, rgba(7,11,18,0.85) 100%)`,
  },
  card: {
    background: color.card,
    border: borda.primary,
    borderRadius: radius.xl,
    padding: '36px 32px',
    textAlign: 'center',
    maxWidth: '340px',
    boxShadow: shadow.elevated,
  },
  iconeWrap: {
    width: '52px', height: '52px',
    background: color.primaryMuted,
    border: borda.primary,
    borderRadius: radius.lg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  titulo: {
    color: color.textPrimary,
    fontWeight: '700', margin: '0 0 8px',
    fontSize: '17px', letterSpacing: '-0.2px',
  },
  subtitulo: {
    color: color.textMuted,
    fontSize: '13px', lineHeight: '1.6',
    margin: '0 0 24px',
  },
  botao: {
    background: color.primary,
    color: color.white,
    border: 'none', borderRadius: radius.md,
    padding: '12px 28px', cursor: 'pointer',
    fontWeight: '700', fontSize: '14px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: `0 4px 16px rgba(99,102,241,0.40)`,
    width: '100%',
  },
}

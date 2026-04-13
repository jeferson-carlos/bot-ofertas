import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { color, shadow, radius, transition } from '../../theme'

export default function PublicLayout({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: color.bg, fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      <nav style={styles.nav}>
        <Link to="/" style={styles.logoWrap}>
          <div style={styles.logoIcone}>P</div>
          <span style={styles.logoTexto}>PropagAI</span>
        </Link>
        <div style={styles.navLinks}>
          <a href="#como-funciona" style={styles.navLink}>Como funciona</a>
          <a href="#precos" style={styles.navLink}>Planos</a>
          {user ? (
            <button onClick={() => navigate('/app/dashboard')} style={styles.botaoPrimario}>
              Acessar painel
            </button>
          ) : (
            <>
              <Link to="/login" style={styles.navLink}>Entrar</Link>
              <Link to="/cadastro" style={styles.botaoPrimario}>Começar grátis</Link>
            </>
          )}
        </div>
      </nav>

      <main>{children}</main>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerLogo}>
            <div style={{ ...styles.logoIcone, width: '22px', height: '22px', fontSize: '11px' }}>P</div>
            <span style={{ ...styles.logoTexto, fontSize: '14px' }}>PropagAI</span>
          </div>
          <p style={styles.footerText}>© 2024 PropagAI. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 40px', height: '64px',
    borderBottom: `1px solid rgba(255,255,255,0.06)`,
    position: 'sticky', top: 0,
    background: `rgba(8,8,12,0.92)`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    zIndex: 100, width: '100%',
    boxSizing: 'border-box',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    textDecoration: 'none',
  },
  logoIcone: {
    width: '28px', height: '28px',
    background: color.primaryGrad,
    borderRadius: radius.md,
    boxShadow: '0 0 16px rgba(99,102,241,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '800', fontSize: '13px', flexShrink: 0,
  },
  logoTexto: {
    fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: '32px' },
  navLink: {
    color: color.textSecondary, fontSize: '14px', textDecoration: 'none',
    fontWeight: '500', transition: transition.fast,
  },
  botaoPrimario: {
    background: color.primaryGrad,
    color: color.white,
    border: 'none',
    borderRadius: radius.md,
    padding: '9px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    textDecoration: 'none',
    boxShadow: shadow.primary,
    transition: transition.fast,
    display: 'inline-flex', alignItems: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    letterSpacing: '0.2px',
  },
  footer: {
    borderTop: `1px solid rgba(255,255,255,0.06)`,
    background: color.surface,
  },
  footerInner: {
    maxWidth: '1140px', margin: '0 auto',
    padding: '32px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '16px',
  },
  footerLogo: { display: 'flex', alignItems: 'center', gap: '8px' },
  footerText: { color: color.textDisabled, fontSize: '13px' },
}

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { color, shadow, radius, transition } from '../../theme'

export default function PublicLayout({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: color.bg, fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <Link to="/" style={styles.logo}>PropagAI</Link>
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

      {/* Conteúdo */}
      <main>{children}</main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>© 2024 PropagAI. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 40px', height: '64px',
    borderBottom: `1px solid ${color.border}`,
    position: 'sticky', top: 0,
    background: `rgba(7,11,18,0.92)`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    zIndex: 100, width: '100%',
    boxSizing: 'border-box',
  },
  logo: {
    color: color.primary, fontSize: '20px', fontWeight: '800',
    textDecoration: 'none', letterSpacing: '-0.5px',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: '28px' },
  navLink: {
    color: color.textMuted, fontSize: '14px', textDecoration: 'none',
    fontWeight: '500', transition: transition.fast,
  },
  botaoPrimario: {
    background: color.primary,
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
  },
  footer: {
    textAlign: 'center', padding: '40px 24px',
    borderTop: `1px solid ${color.border}`,
    background: color.surface,
  },
  footerText: { color: color.textDisabled, fontSize: '13px' },
}

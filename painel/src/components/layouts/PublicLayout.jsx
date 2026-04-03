import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function PublicLayout({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: 'sans-serif' }}>
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
  nav:          { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, background: '#0f1117', zIndex: 100 },
  logo:         { color: '#6366f1', fontSize: '20px', fontWeight: 'bold', textDecoration: 'none', letterSpacing: '-0.5px' },
  navLinks:     { display: 'flex', alignItems: 'center', gap: '24px' },
  navLink:      { color: '#9ca3af', fontSize: '14px', textDecoration: 'none' },
  botaoPrimario:{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' },
  footer:       { textAlign: 'center', padding: '32px', borderTop: '1px solid #1e293b', marginTop: '64px' },
  footerText:   { color: '#4b5563', fontSize: '13px' },
}

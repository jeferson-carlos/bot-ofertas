import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const PLANO_LABEL = { free: 'Free', pro: 'Pro', premium: 'Premium' }
const PLANO_COR   = { free: '#6b7280', pro: '#6366f1', premium: '#f59e0b' }

const MENU = [
  { path: '/app/dashboard', label: 'Dashboard',  icone: '📊', planoMinimo: null },
  { path: '/app/ofertas',   label: 'Ofertas',     icone: '🏷️', planoMinimo: null },
  { path: '/app/keywords',  label: 'Keywords',    icone: '🔍', planoMinimo: 'pro' },
]

export default function AppLayout({ children }) {
  const { user, profile, signOut, temAcesso } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const plano = profile?.plan || 'free'

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoWrap}>
          <span style={styles.logo}>PropagAI</span>
          <span style={{ ...styles.planoBadge, background: PLANO_COR[plano] }}>
            {PLANO_LABEL[plano]}
          </span>
        </div>

        <nav style={styles.nav}>
          {MENU.map(item => {
            const bloqueado = item.planoMinimo && !temAcesso(item.planoMinimo)
            return (
              <NavLink
                key={item.path}
                to={bloqueado ? '/app/upgrade' : item.path}
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive && !bloqueado ? styles.navItemAtivo : {}),
                  ...(bloqueado ? styles.navItemBloqueado : {}),
                })}
                title={bloqueado ? `Disponível no plano ${PLANO_LABEL[item.planoMinimo]}` : ''}
              >
                <span>{item.icone}</span>
                <span>{item.label}</span>
                {bloqueado && <span style={styles.lockIcon}>🔒</span>}
              </NavLink>
            )
          })}
        </nav>

        <div style={styles.userWrap}>
          <p style={styles.userEmail}>{user?.email}</p>
          <button onClick={handleSignOut} style={styles.botaoSair}>Sair</button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main style={styles.main}>
        {children}
      </main>
    </div>
  )
}

const styles = {
  container:        { display: 'flex', minHeight: '100vh', background: '#0f1117', fontFamily: 'sans-serif' },
  sidebar:          { width: '220px', minHeight: '100vh', background: '#111827', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 },
  logoWrap:         { padding: '0 20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '8px' },
  logo:             { color: '#6366f1', fontSize: '18px', fontWeight: 'bold' },
  planoBadge:       { alignSelf: 'flex-start', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' },
  nav:              { flex: 1, padding: '16px 0' },
  navItem:          { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#9ca3af', textDecoration: 'none', fontSize: '14px', transition: 'all 0.15s' },
  navItemAtivo:     { color: '#e2e8f0', background: '#1e293b', borderRight: '2px solid #6366f1' },
  navItemBloqueado: { color: '#4b5563', cursor: 'not-allowed', opacity: 0.6 },
  lockIcon:         { marginLeft: 'auto', fontSize: '11px' },
  userWrap:         { padding: '16px 20px', borderTop: '1px solid #1e293b' },
  userEmail:        { color: '#6b7280', fontSize: '11px', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  botaoSair:        { background: 'transparent', color: '#6b7280', border: '1px solid #374151', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', width: '100%' },
  main:             { flex: 1, padding: '32px', overflowY: 'auto' },
}

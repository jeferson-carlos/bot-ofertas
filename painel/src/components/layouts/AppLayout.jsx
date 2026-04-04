import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const PLANO_LABEL = { free: 'Free', pro: 'Pro', premium: 'Premium' }
const PLANO_COR   = { free: '#64748b', pro: '#6366f1', premium: '#f59e0b' }

const ICONS = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  ofertas: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  keywords: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  planos: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  config: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  perfil: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  lock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  hamburger: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  fechar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
}

const MENU = [
  { path: '/app/dashboard',     label: 'Dashboard',      icon: ICONS.dashboard, planoMinimo: null },
  { path: '/app/ofertas',       label: 'Ofertas',        icon: ICONS.ofertas,   planoMinimo: null },
  { path: '/app/keywords',      label: 'Keywords',       icon: ICONS.keywords,  planoMinimo: 'pro' },
]

const MENU_INFERIOR = [
  { path: '/app/planos',        label: 'Planos',         icon: ICONS.planos,    planoMinimo: null },
  { path: '/app/configuracoes', label: 'Configurações',  icon: ICONS.config,    planoMinimo: null },
  { path: '/app/perfil',        label: 'Perfil',         icon: ICONS.perfil,    planoMinimo: null },
]

export default function AppLayout({ children }) {
  const { user, profile, signOut, temAcesso } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [largura, setLargura]           = useState(window.innerWidth)
  const [sidebarAberta, setSidebarAberta] = useState(false)

  useEffect(() => {
    function onResize() { setLargura(window.innerWidth) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Fechar sidebar ao navegar no mobile
  useEffect(() => { setSidebarAberta(false) }, [location.pathname])

  const isMobile = largura < 768

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const plano = profile?.plan || 'free'

  function renderItem(item) {
    const bloqueado = item.planoMinimo && !temAcesso(item.planoMinimo)
    if (bloqueado) {
      return (
        <button
          key={item.path}
          onClick={() => navigate('/app/planos')}
          style={s.navItemBloqueado}
          title={`Disponível no plano ${PLANO_LABEL[item.planoMinimo]}`}
        >
          <span style={s.navIcone}>{item.icon}</span>
          <span style={s.navTexto}>{item.label}</span>
          <span style={s.lockWrap}>{ICONS.lock}</span>
        </button>
      )
    }
    return (
      <NavLink
        key={item.path}
        to={item.path}
        style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navItemAtivo : {}) })}
      >
        <span style={s.navIcone}>{item.icon}</span>
        <span style={s.navTexto}>{item.label}</span>
      </NavLink>
    )
  }

  const sidebar = (
    <aside style={{ ...s.sidebar, ...(isMobile ? s.sidebarMobile : {}) }}>

      {/* Logo */}
      <div style={s.logoWrap}>
        <div style={s.logoMarca}>
          <div style={s.logoIcone}>P</div>
          <span style={s.logoTexto}>PropagAI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ ...s.planoBadge, background: PLANO_COR[plano] + '22', color: PLANO_COR[plano], border: `1px solid ${PLANO_COR[plano]}44` }}>
            {PLANO_LABEL[plano]}
          </span>
          {isMobile && (
            <button onClick={() => setSidebarAberta(false)} style={s.fecharBtn}>
              {ICONS.fechar}
            </button>
          )}
        </div>
      </div>

      {/* Navegação principal */}
      <nav style={s.nav}>
        <p style={s.navLabel}>Menu</p>
        {MENU.map(renderItem)}
      </nav>

      {/* Navegação inferior */}
      <nav style={{ ...s.nav, borderTop: '1px solid #1e293b', paddingTop: '16px', flex: 'none' }}>
        <p style={s.navLabel}>Conta</p>
        {MENU_INFERIOR.map(renderItem)}
      </nav>

      {/* Upgrade banner para free */}
      {plano === 'free' && (
        <div style={s.upgradeBanner}>
          <p style={s.upgradeTexto}>Desbloqueie o plano <strong>Pro</strong> e automatize tudo.</p>
          <button onClick={() => navigate('/app/planos')} style={s.upgradeBotao}>
            Ver planos →
          </button>
        </div>
      )}

      {/* Usuário */}
      <div style={s.userWrap}>
        <div style={s.userAvatar}>{user?.email?.[0]?.toUpperCase()}</div>
        <div style={s.userInfo}>
          <p style={s.userEmail}>{user?.email}</p>
          <button onClick={handleSignOut} style={s.sairLink}>Sair da conta</button>
        </div>
      </div>

    </aside>
  )

  return (
    <div style={{ ...s.container, flexDirection: isMobile ? 'column' : 'row' }}>

      {/* Topbar mobile */}
      {isMobile && (
        <header style={s.topbar}>
          <div style={s.topbarMarca}>
            <div style={s.logoIcone}>P</div>
            <span style={s.logoTexto}>PropagAI</span>
          </div>
          <button onClick={() => setSidebarAberta(true)} style={s.hamburgerBtn}>
            {ICONS.hamburger}
          </button>
        </header>
      )}

      {/* Sidebar desktop — sempre visível */}
      {!isMobile && sidebar}

      {/* Sidebar mobile — overlay */}
      {isMobile && sidebarAberta && (
        <>
          <div style={s.overlay} onClick={() => setSidebarAberta(false)} />
          {sidebar}
        </>
      )}

      <main style={{ ...s.main, padding: isMobile ? '24px 16px' : '36px 40px' }}>
        {children}
      </main>
    </div>
  )
}

const s = {
  container:        { display: 'flex', minHeight: '100vh', background: '#0b0f1a', fontFamily: 'system-ui, sans-serif' },

  sidebar:          { width: '240px', height: '100vh', position: 'sticky', top: 0, background: '#0f1117', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' },
  sidebarMobile:    { position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 200, boxShadow: '4px 0 32px rgba(0,0,0,0.5)' },

  topbar:           { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f1117', borderBottom: '1px solid #1e293b', padding: '0 16px', height: '56px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 100 },
  topbarMarca:      { display: 'flex', alignItems: 'center', gap: '10px' },
  hamburgerBtn:     { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' },
  fecharBtn:        { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', borderRadius: '6px' },

  overlay:          { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 199, backdropFilter: 'blur(2px)' },

  logoWrap:         { padding: '20px 20px 16px', borderBottom: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '10px' },
  logoMarca:        { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcone:        { width: '28px', height: '28px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '14px', flexShrink: 0 },
  logoTexto:        { color: '#f1f5f9', fontSize: '16px', fontWeight: '700', letterSpacing: '-0.3px' },
  planoBadge:       { alignSelf: 'flex-start', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.8px' },

  nav:              { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' },
  navLabel:         { color: '#374151', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '0 8px', marginBottom: '6px' },
  navItem:          { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', color: '#64748b', textDecoration: 'none', fontSize: '14px', borderRadius: '8px', transition: 'all 0.15s', fontWeight: '500' },
  navItemAtivo:     { color: '#f1f5f9', background: '#1e293b' },
  navItemBloqueado: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', color: '#374151', fontSize: '14px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit', fontWeight: '500' },
  navIcone:         { flexShrink: 0, display: 'flex' },
  navTexto:         { flex: 1 },
  lockWrap:         { color: '#374151', display: 'flex' },

  upgradeBanner:    { margin: '0 12px 12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.08))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', padding: '16px' },
  upgradeTexto:     { color: '#94a3b8', fontSize: '12px', lineHeight: 1.5, marginBottom: '10px' },
  upgradeBotao:     { background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: 'inherit' },

  userWrap:         { padding: '14px 16px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px' },
  userAvatar:       { width: '32px', height: '32px', background: '#1e293b', border: '1px solid #374151', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '700', flexShrink: 0 },
  userInfo:         { flex: 1, minWidth: 0 },
  userEmail:        { color: '#64748b', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' },
  sairLink:         { background: 'none', border: 'none', color: '#475569', fontSize: '11px', cursor: 'pointer', padding: 0, fontFamily: 'inherit' },

  main:             { flex: 1, overflowY: 'auto', minWidth: 0 },
}

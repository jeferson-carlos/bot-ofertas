import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

const PLANO_LABEL = { free: 'Free', pro: 'Pro', premium: 'Premium' }
const PLANO_COR   = { free: '#64748b', pro: '#6366f1', premium: '#f59e0b' }

const STAT_CONFIG = [
  { status: 'pendente',   label: 'Pendentes',      cor: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icone: '⏳' },
  { status: 'enviado',    label: 'Enviadas',        cor: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icone: '✈️' },
  { status: 'descartado', label: 'Descartadas',     cor: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icone: '🗑️' },
  { status: null,         label: 'Total coletadas', cor: '#6366f1', bg: 'rgba(99,102,241,0.1)',  icone: '📦' },
]

export default function Dashboard() {
  const { user, profile, temAcesso } = useAuth()
  const [stats, setStats]     = useState({ pendente: 0, enviado: 0, descartado: 0 })
  const [recentes, setRecentes] = useState([])
  const navigate = useNavigate()

  async function carregarStats() {
    const { data } = await supabase.from('ofertas').select('status')
    if (data) {
      const s = { pendente: 0, enviado: 0, descartado: 0 }
      data.forEach(o => { if (s[o.status] !== undefined) s[o.status]++ })
      setStats(s)
    }
  }

  async function carregarRecentes() {
    const { data } = await supabase
      .from('ofertas')
      .select('id, titulo, preco_desconto, percentual_desconto, enviado_em, loja')
      .eq('status', 'enviado')
      .order('enviado_em', { ascending: false })
      .limit(5)
    setRecentes(data || [])
  }

  useEffect(() => {
    carregarStats()
    carregarRecentes()

    const channel = supabase
      .channel('ofertas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ofertas' }, () => {
        carregarStats()
        carregarRecentes()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const plano = profile?.plan || 'free'
  const hora  = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const nome  = user?.email?.split('@')[0] || 'usuário'

  function valorStat(status) {
    if (!status) return stats.pendente + stats.enviado + stats.descartado
    return stats[status] ?? 0
  }

  return (
    <div>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>{saudacao}, {nome} 👋</h1>
          <p style={s.subtitulo}>Aqui está o resumo do seu painel hoje</p>
        </div>
        <div style={{ ...s.planoBadge, background: PLANO_COR[plano] + '22', color: PLANO_COR[plano], border: `1px solid ${PLANO_COR[plano]}44` }}>
          Plano {PLANO_LABEL[plano]}
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsGrid}>
        {STAT_CONFIG.map(({ status, label, cor, bg, icone }) => (
          <div
            key={label}
            onClick={() => status && navigate('/app/ofertas', { state: { filtro: status } })}
            style={{ ...s.statCard, ...(status ? s.statClicavel : {}) }}
          >
            <div style={{ ...s.statIconeWrap, background: bg }}>
              <span style={s.statIcone}>{icone}</span>
            </div>
            <div>
              <p style={s.statValor}>{valorStat(status)}</p>
              <p style={s.statLabel}>{label}</p>
            </div>
            {status && (
              <div style={s.statSeta}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            )}
            <div style={{ ...s.statBarra, background: cor }} />
          </div>
        ))}
      </div>

      {/* Grid inferior */}
      <div style={s.gridInferior}>

        {/* Ações rápidas */}
        <div style={s.bloco}>
          <h2 style={s.blocoTitulo}>Ações rápidas</h2>
          <div style={s.acoesLista}>
            <button onClick={() => navigate('/app/ofertas', { state: { filtro: 'pendente' } })} style={s.acaoItem}>
              <div style={{ ...s.acaoIconeWrap, background: 'rgba(245,158,11,0.1)' }}>
                <span>⏳</span>
              </div>
              <div style={s.acaoInfo}>
                <span style={s.acaoLabel}>Ofertas pendentes</span>
                <span style={s.acaoSub}>Revisar e enviar ao Telegram</span>
              </div>
              <div style={s.acaoCount}>{stats.pendente}</div>
            </button>

            {temAcesso('pro') ? (
              <button onClick={() => navigate('/app/keywords')} style={s.acaoItem}>
                <div style={{ ...s.acaoIconeWrap, background: 'rgba(99,102,241,0.1)' }}>
                  <span>🔍</span>
                </div>
                <div style={s.acaoInfo}>
                  <span style={s.acaoLabel}>Keywords</span>
                  <span style={s.acaoSub}>Gerenciar e buscar ofertas</span>
                </div>
              </button>
            ) : (
              <button onClick={() => navigate('/#precos')} style={{ ...s.acaoItem, opacity: 0.6 }}>
                <div style={{ ...s.acaoIconeWrap, background: 'rgba(99,102,241,0.1)' }}>
                  <span>🔒</span>
                </div>
                <div style={s.acaoInfo}>
                  <span style={s.acaoLabel}>Keywords</span>
                  <span style={s.acaoSub}>Disponível no plano Pro</span>
                </div>
                <span style={s.upgradePill}>Upgrade</span>
              </button>
            )}
          </div>
        </div>

        {/* Últimas enviadas */}
        <div style={s.bloco}>
          <h2 style={s.blocoTitulo}>Últimas enviadas</h2>
          {recentes.length === 0 ? (
            <div style={s.vazioWrap}>
              <span style={s.vazioIcone}>✈️</span>
              <p style={s.vazioTexto}>Nenhuma oferta enviada ainda.</p>
            </div>
          ) : (
            <div style={s.recenteLista}>
              {recentes.map(oferta => (
                <div key={oferta.id} style={s.recenteItem}>
                  <div style={s.recenteInfo}>
                    <p style={s.recenteTitulo}>{oferta.titulo?.slice(0, 55)}{oferta.titulo?.length > 55 ? '…' : ''}</p>
                    <p style={s.recenteSub}>{oferta.loja || 'Shopee'}</p>
                  </div>
                  <div style={s.recenteDireita}>
                    <span style={s.recentePreco}>R$ {parseFloat(oferta.preco_desconto).toFixed(2)}</span>
                    <span style={s.recenteDesconto}>{oferta.percentual_desconto}% OFF</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

const s = {
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  titulo:         { color: '#f1f5f9', fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  subtitulo:      { color: '#64748b', fontSize: '14px' },
  planoBadge:     { fontSize: '11px', fontWeight: '700', padding: '5px 14px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.8px' },

  // Stats
  statsGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' },
  statCard:       { background: '#111827', border: '1px solid #1e293b', borderRadius: '14px', padding: '20px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '14px' },
  statClicavel:   { cursor: 'pointer' },
  statIconeWrap:  { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statIcone:      { fontSize: '18px' },
  statValor:      { color: '#f1f5f9', fontSize: '26px', fontWeight: '800', margin: '0 0 2px', letterSpacing: '-0.5px' },
  statLabel:      { color: '#64748b', fontSize: '12px' },
  statSeta:       { marginLeft: 'auto' },
  statBarra:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px' },

  // Grid inferior
  gridInferior:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  bloco:          { background: '#111827', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' },
  blocoTitulo:    { color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' },

  // Ações
  acoesLista:     { display: 'flex', flexDirection: 'column', gap: '8px' },
  acaoItem:       { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#0f1117', border: '1px solid #1e293b', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' },
  acaoIconeWrap:  { width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 },
  acaoInfo:       { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  acaoLabel:      { color: '#e2e8f0', fontSize: '13px', fontWeight: '600' },
  acaoSub:        { color: '#64748b', fontSize: '11px' },
  acaoCount:      { background: '#f59e0b', color: '#000', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '100px', flexShrink: 0 },
  upgradePill:    { background: '#6366f1', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px', flexShrink: 0 },

  // Recentes
  recenteLista:   { display: 'flex', flexDirection: 'column', gap: '1px' },
  recenteItem:    { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #1e293b' },
  recenteInfo:    { flex: 1, minWidth: 0 },
  recenteTitulo:  { color: '#cbd5e1', fontSize: '12px', fontWeight: '500', marginBottom: '2px' },
  recenteSub:     { color: '#475569', fontSize: '11px' },
  recenteDireita: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 },
  recentePreco:   { color: '#22c55e', fontSize: '13px', fontWeight: '700' },
  recenteDesconto:{ color: '#64748b', fontSize: '10px' },

  // Vazio
  vazioWrap:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '8px' },
  vazioIcone:     { fontSize: '28px' },
  vazioTexto:     { color: '#475569', fontSize: '13px' },
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { color, shadow, radius, borda, transition } from '../../theme'

const PLANO_LABEL = { free: 'Free', pro: 'Pro', premium: 'Premium' }
const PLANO_COR   = { free: color.planFree, pro: color.planPro, premium: color.planPremium }

// SVG icons — removidos os emojis para linguagem visual coerente
const IconPendente = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconEnviado = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const IconDescartado = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)
const IconTotal = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)
const IconKeywords = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)
const IconArrow = ({ cor }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

const STAT_CONFIG = [
  { status: 'pendente',   label: 'Pendentes',      cor: color.warning, bg: color.warningMuted, Icone: IconPendente },
  { status: 'enviado',    label: 'Enviadas',        cor: color.success, bg: color.successMuted,  Icone: IconEnviado },
  { status: 'descartado', label: 'Descartadas',     cor: color.danger,  bg: color.dangerMuted,   Icone: IconDescartado },
  { status: null,         label: 'Total coletadas', cor: color.primary, bg: color.primaryMuted,  Icone: IconTotal },
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

  const credenciaisOk = profile?.telegram_bot_token && profile?.shopee_app_id
  const telegramOk    = !!profile?.telegram_bot_token
  const shopeeOk      = !!profile?.shopee_app_id

  function tempoRelativo(iso) {
    if (!iso) return null
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60)    return 'há menos de 1 min'
    if (diff < 3600)  return `há ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
    return `há ${Math.floor(diff / 86400)} dias`
  }

  const tempoColeta = tempoRelativo(profile?.ultima_coleta_em)

  function proximaExecucao() {
    const agora = new Date()
    const proxima = new Date(agora)
    proxima.setMinutes(0, 0, 0)
    proxima.setHours(proxima.getHours() + 1)
    const mins = Math.round((proxima - agora) / 60000)
    return mins <= 1 ? 'em breve' : `em ${mins} min`
  }

  return (
    <div>

      {!credenciaisOk && (
        <div style={s.onboardingBanner}>
          <div style={s.onboardingIconeWrap}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div style={s.onboardingTexto}>
            <p style={s.onboardingTitulo}>Configure sua conta para começar</p>
            <p style={s.onboardingSub}>Conecte o Shopee e o Telegram para receber ofertas automaticamente.</p>
            <div style={s.onboardingPassos}>
              <span style={{ ...s.onboardingPasso, color: shopeeOk ? color.success : color.textMuted }}>
                {shopeeOk
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                }
                Shopee Afiliados
              </span>
              <span style={{ color: color.textDisabled, fontSize: '10px' }}>→</span>
              <span style={{ ...s.onboardingPasso, color: telegramOk ? color.success : color.textMuted }}>
                {telegramOk
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                }
                Telegram Bot
              </span>
            </div>
          </div>
          <div style={s.onboardingBotoes}>
            <button onClick={() => navigate('/app/tutorial')} style={s.onboardingBotaoSec}>Ver tutorial</button>
            <button onClick={() => navigate('/app/configuracoes')} style={s.onboardingBotao}>Configurar agora →</button>
          </div>
        </div>
      )}

      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>{saudacao}, {nome}</h1>
          <p style={s.subtitulo}>Aqui está o resumo do seu painel hoje</p>
        </div>
        <div style={{
          ...s.planoBadge,
          background: PLANO_COR[plano] + '18',
          color: PLANO_COR[plano],
          border: `1px solid ${PLANO_COR[plano]}40`,
        }}>
          Plano {PLANO_LABEL[plano]}
        </div>
      </div>

      <div style={s.statsGrid}>
        {STAT_CONFIG.map(({ status, label, cor, bg, Icone }) => (
          <div
            key={label}
            onClick={() => status && navigate('/app/ofertas', { state: { filtro: status } })}
            style={{ ...s.statCard, ...(status ? s.statClicavel : {}) }}
          >
            <div style={{ ...s.statIconeWrap, background: bg, color: cor }}>
              <Icone />
            </div>
            <div style={{ flex: 1 }}>
              <p style={s.statValor}>{valorStat(status)}</p>
              <p style={s.statLabel}>{label}</p>
            </div>
            {status && <IconArrow cor={cor} />}
            <div style={{ ...s.statBarra, background: cor }} />
          </div>
        ))}
      </div>

      <div style={s.botStatus}>
        <div style={s.botStatusEsq}>
          <div style={{ ...s.botDot, background: credenciaisOk ? color.success : color.textDisabled }} />
          <span style={s.botLabel}>
            {credenciaisOk
              ? tempoColeta ? `Última coleta ${tempoColeta}` : 'Bot ativo — aguardando primeira coleta'
              : 'Bot inativo — credenciais não configuradas'}
          </span>
        </div>
        {credenciaisOk && (
          <span style={s.botProxima}>Próxima: {proximaExecucao()}</span>
        )}
      </div>

      <div style={s.gridInferior}>

        <div style={s.bloco}>
          <h2 style={s.blocoTitulo}>Ações rápidas</h2>
          <div style={s.acoesLista}>
            <button onClick={() => navigate('/app/ofertas', { state: { filtro: 'pendente' } })} style={s.acaoItem}>
              <div style={{ ...s.acaoIconeWrap, background: color.warningMuted, color: color.warning }}>
                <IconPendente />
              </div>
              <div style={s.acaoInfo}>
                <span style={s.acaoLabel}>Ofertas pendentes</span>
                <span style={s.acaoSub}>Revisar e enviar ao Telegram</span>
              </div>
              {stats.pendente > 0 && <div style={s.acaoCount}>{stats.pendente}</div>}
            </button>

            {temAcesso('pro') ? (
              <button onClick={() => navigate('/app/keywords')} style={s.acaoItem}>
                <div style={{ ...s.acaoIconeWrap, background: color.primaryMuted, color: color.primaryLight }}>
                  <IconKeywords />
                </div>
                <div style={s.acaoInfo}>
                  <span style={s.acaoLabel}>Keywords</span>
                  <span style={s.acaoSub}>Gerenciar e buscar ofertas</span>
                </div>
              </button>
            ) : (
              <button onClick={() => navigate('/app/planos')} style={s.acaoItemBloqueado}>
                <div style={{ ...s.acaoIconeWrap, background: color.primaryMuted, color: color.textDisabled }}>
                  <IconLock />
                </div>
                <div style={s.acaoInfo}>
                  <span style={{ ...s.acaoLabel, color: color.textMuted }}>Keywords</span>
                  <span style={s.acaoSub}>Disponível no plano Pro</span>
                </div>
                <span style={s.upgradePill}>Upgrade</span>
              </button>
            )}
          </div>
        </div>

        <div style={s.bloco}>
          <h2 style={s.blocoTitulo}>Últimas enviadas</h2>
          {recentes.length === 0 ? (
            <div style={s.vazioWrap}>
              <div style={s.vazioIconeWrap}>
                <IconEnviado />
              </div>
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
  onboardingBanner: {
    display: 'flex', alignItems: 'flex-start', gap: '16px',
    background: color.warningMuted,
    border: borda.warning,
    borderRadius: radius.lg, padding: '20px 24px',
    marginBottom: '28px', flexWrap: 'wrap',
  },
  onboardingIconeWrap: {
    width: '40px', height: '40px', flexShrink: 0,
    background: color.warningMuted, border: borda.warning,
    borderRadius: radius.md,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  onboardingTexto:  { flex: 1, minWidth: '200px' },
  onboardingTitulo: { color: color.textPrimary, fontSize: '14px', fontWeight: '700', marginBottom: '4px' },
  onboardingSub:    { color: color.textSecondary, fontSize: '12px', lineHeight: '1.5', marginBottom: '12px' },
  onboardingPassos: { display: 'flex', alignItems: 'center', gap: '10px' },
  onboardingPasso:  { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' },
  onboardingBotoes: { display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' },
  onboardingBotao: {
    background: color.warning, color: '#000',
    border: 'none', borderRadius: radius.md,
    padding: '9px 16px', cursor: 'pointer',
    fontWeight: '700', fontSize: '13px', fontFamily: 'inherit',
    boxShadow: shadow.premium,
  },
  onboardingBotaoSec: {
    background: 'transparent', color: color.textSecondary,
    border: `1px solid rgba(255,255,255,0.08)`, borderRadius: radius.md,
    padding: '9px 16px', cursor: 'pointer',
    fontSize: '13px', fontFamily: 'inherit',
  },

  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  titulo:    { color: color.textPrimary, fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  subtitulo: { color: color.textMuted, fontSize: '14px' },
  planoBadge:{ fontSize: '11px', fontWeight: '700', padding: '5px 14px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.8px' },

  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' },
  statCard:     {
    background: color.card, border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: radius.lg, padding: '20px',
    position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', gap: '14px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.45)',
  },
  statClicavel:  { cursor: 'pointer', transition: transition.fast },
  statIconeWrap: { width: '44px', height: '44px', borderRadius: radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValor:     { color: color.textPrimary, fontSize: '28px', fontWeight: '800', margin: '0 0 2px', letterSpacing: '-0.5px' },
  statLabel:     { color: color.textMuted, fontSize: '12px' },
  statBarra:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', opacity: 0.7 },

  botStatus:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: color.card, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: radius.md, padding: '12px 16px', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' },
  botStatusEsq: { display: 'flex', alignItems: 'center', gap: '10px' },
  botDot:       { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  botLabel:     { color: color.textSecondary, fontSize: '13px' },
  botProxima:   { color: color.textDisabled, fontSize: '12px' },

  gridInferior: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  bloco:        {
    background: color.card, border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: radius.lg, padding: '24px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.45)',
  },
  blocoTitulo:  { color: color.textDisabled, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '16px' },

  acoesLista:       { display: 'flex', flexDirection: 'column', gap: '8px' },
  acaoItem:         {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
    background: color.input, border: `1px solid rgba(255,255,255,0.06)`,
    borderRadius: radius.md, cursor: 'pointer', textAlign: 'left',
    width: '100%', fontFamily: 'inherit', transition: transition.fast,
  },
  acaoItemBloqueado:{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: color.surface, border: `1px solid rgba(255,255,255,0.04)`, borderRadius: radius.md, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit', opacity: 0.7 },
  acaoIconeWrap:    { width: '38px', height: '38px', borderRadius: radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  acaoInfo:         { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  acaoLabel:        { color: color.textPrimary, fontSize: '13px', fontWeight: '600' },
  acaoSub:          { color: color.textMuted, fontSize: '11px' },
  acaoCount:        {
    background: color.warning, color: '#000',
    fontSize: '11px', fontWeight: '800',
    padding: '2px 8px', borderRadius: '100px', flexShrink: 0,
    minWidth: '20px', textAlign: 'center',
  },
  upgradePill:      {
    background: color.primaryGrad, color: color.white,
    fontSize: '10px', fontWeight: '700', padding: '3px 10px',
    borderRadius: '100px', flexShrink: 0,
  },

  recenteLista:    { display: 'flex', flexDirection: 'column', gap: '1px' },
  recenteItem:     { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid rgba(255,255,255,0.05)` },
  recenteInfo:     { flex: 1, minWidth: 0 },
  recenteTitulo:   { color: color.textSecondary, fontSize: '12px', fontWeight: '500', marginBottom: '2px' },
  recenteSub:      { color: color.textMuted, fontSize: '11px' },
  recenteDireita:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 },
  recentePreco:    { color: color.success, fontSize: '13px', fontWeight: '700' },
  recenteDesconto: { color: color.textMuted, fontSize: '10px' },

  vazioWrap:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '12px' },
  vazioIconeWrap:{ color: color.textDisabled },
  vazioTexto:    { color: color.textMuted, fontSize: '13px' },
}

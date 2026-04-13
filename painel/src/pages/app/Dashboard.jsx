import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { color, shadow, radius, borda, transition } from '../../theme'

const PLANO_LABEL = { free: 'Free', pro: 'Pro', premium: 'Premium' }
const PLANO_COR   = { free: color.planFree, pro: color.planPro, premium: color.planPremium }

const STAT_CONFIG = [
  { status: 'pendente',   label: 'Pendentes',      cor: color.warning, bg: color.warningMuted, icone: '⏳' },
  { status: 'enviado',    label: 'Enviadas',        cor: color.success, bg: color.successMuted,  icone: '✈️' },
  { status: 'descartado', label: 'Descartadas',     cor: color.danger,  bg: color.dangerMuted,   icone: '🗑️' },
  { status: null,         label: 'Total coletadas', cor: color.primary, bg: color.primaryMuted,  icone: '📦' },
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

  function tempoRelativo(iso) {
    if (!iso) return null
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60)   return 'há menos de 1 min'
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
    return `há ${Math.floor(diff / 86400)} dias`
  }

  const ultimaColeta  = profile?.ultima_coleta_em
  const tempoColeta   = tempoRelativo(ultimaColeta)
  function proximaExecucao() {
    const agora = new Date()
    const proxima = new Date(agora)
    proxima.setMinutes(0, 0, 0)
    proxima.setHours(proxima.getHours() + 1)
    const mins = Math.round((proxima - agora) / 60000)
    return mins <= 1 ? 'em breve' : `em ${mins} min`
  }
  const telegramOk    = !!profile?.telegram_bot_token
  const shopeeOk      = !!profile?.shopee_app_id

  return (
    <div>

      {!credenciaisOk && (
        <div style={s.onboardingBanner}>
          <div style={s.onboardingIcone}>🚀</div>
          <div style={s.onboardingTexto}>
            <p style={s.onboardingTitulo}>Configure sua conta para começar</p>
            <p style={s.onboardingSub}>Você precisa conectar o Shopee e o Telegram para receber ofertas automaticamente.</p>
            <div style={s.onboardingPassos}>
              <span style={{ ...s.onboardingPasso, color: shopeeOk ? color.success : color.warning }}>
                {shopeeOk ? '✓' : '○'} Shopee Afiliados
              </span>
              <span style={s.onboardingSep}>→</span>
              <span style={{ ...s.onboardingPasso, color: telegramOk ? color.success : color.warning }}>
                {telegramOk ? '✓' : '○'} Telegram Bot
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
          <h1 style={s.titulo}>{saudacao}, {nome} 👋</h1>
          <p style={s.subtitulo}>Aqui está o resumo do seu painel hoje</p>
        </div>
        <div style={{
          ...s.planoBadge,
          background: PLANO_COR[plano] + '1a',
          color: PLANO_COR[plano],
          border: `1px solid ${PLANO_COR[plano]}44`,
        }}>
          Plano {PLANO_LABEL[plano]}
        </div>
      </div>

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

      <div style={s.botStatus}>
        <div style={s.botStatusEsq}>
          <div style={{ ...s.botDot, background: credenciaisOk ? color.success : color.border }} />
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
              <div style={{ ...s.acaoIconeWrap, background: color.warningMuted }}>
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
                <div style={{ ...s.acaoIconeWrap, background: color.primaryMuted }}>
                  <span>🔍</span>
                </div>
                <div style={s.acaoInfo}>
                  <span style={s.acaoLabel}>Keywords</span>
                  <span style={s.acaoSub}>Gerenciar e buscar ofertas</span>
                </div>
              </button>
            ) : (
              <button onClick={() => navigate('/app/planos')} style={s.acaoItemBloqueado}>
                <div style={{ ...s.acaoIconeWrap, background: color.primaryMuted }}>
                  <span>🔒</span>
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
  onboardingBanner: {
    display: 'flex', alignItems: 'center', gap: '16px',
    background: color.warningMuted,
    border: borda.warning,
    borderRadius: radius.lg, padding: '20px 24px',
    marginBottom: '28px', flexWrap: 'wrap',
  },
  onboardingIcone:  { fontSize: '32px', flexShrink: 0 },
  onboardingTexto:  { flex: 1, minWidth: '200px' },
  onboardingTitulo: { color: color.textPrimary, fontSize: '15px', fontWeight: '700', marginBottom: '4px' },
  onboardingSub:    { color: color.textMuted, fontSize: '12px', lineHeight: '1.5', marginBottom: '10px' },
  onboardingPassos: { display: 'flex', alignItems: 'center', gap: '8px' },
  onboardingPasso:  { fontSize: '12px', fontWeight: '600' },
  onboardingSep:    { color: color.textDisabled, fontSize: '12px' },
  onboardingBotoes: { display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' },
  onboardingBotao: {
    background: color.warning, color: '#000',
    border: 'none', borderRadius: radius.md,
    padding: '9px 16px', cursor: 'pointer',
    fontWeight: '700', fontSize: '13px', fontFamily: 'inherit',
    boxShadow: shadow.premium,
  },
  onboardingBotaoSec: {
    background: 'transparent', color: color.textSecondary,
    border: borda.base, borderRadius: radius.md,
    padding: '9px 16px', cursor: 'pointer',
    fontSize: '13px', fontFamily: 'inherit',
  },

  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  titulo:    { color: color.textPrimary, fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  subtitulo: { color: color.textMuted, fontSize: '14px' },
  planoBadge:{ fontSize: '11px', fontWeight: '700', padding: '5px 14px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.8px' },

  statsGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' },
  statCard:      { background: color.card, border: borda.base, borderRadius: radius.lg, padding: '20px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: shadow.card },
  statClicavel:  { cursor: 'pointer', transition: transition.fast },
  statIconeWrap: { width: '44px', height: '44px', borderRadius: radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statIcone:     { fontSize: '18px' },
  statValor:     { color: color.textPrimary, fontSize: '26px', fontWeight: '800', margin: '0 0 2px', letterSpacing: '-0.5px' },
  statLabel:     { color: color.textMuted, fontSize: '12px' },
  statSeta:      { marginLeft: 'auto' },
  statBarra:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px' },

  botStatus:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: color.card, border: borda.base, borderRadius: radius.md, padding: '12px 16px', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' },
  botStatusEsq: { display: 'flex', alignItems: 'center', gap: '10px' },
  botDot:       { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  botLabel:     { color: color.textSecondary, fontSize: '13px' },
  botProxima:   { color: color.textDisabled, fontSize: '12px' },

  gridInferior: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  bloco:        { background: color.card, border: borda.base, borderRadius: radius.lg, padding: '24px', boxShadow: shadow.card },
  blocoTitulo:  { color: color.textMuted, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' },

  acoesLista:       { display: 'flex', flexDirection: 'column', gap: '8px' },
  acaoItem:         { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: color.input, border: borda.base, borderRadius: radius.md, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit', transition: transition.fast },
  acaoItemBloqueado:{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: color.surface, border: borda.base, borderRadius: radius.md, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit', opacity: 0.75 },
  acaoIconeWrap:    { width: '38px', height: '38px', borderRadius: radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 },
  acaoInfo:         { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  acaoLabel:        { color: color.textPrimary, fontSize: '13px', fontWeight: '600' },
  acaoSub:          { color: color.textMuted, fontSize: '11px' },
  acaoCount:        { background: color.warning, color: '#000', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '100px', flexShrink: 0 },
  upgradePill:      { background: color.primary, color: color.white, fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px', flexShrink: 0 },

  recenteLista:    { display: 'flex', flexDirection: 'column', gap: '1px' },
  recenteItem:     { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: borda.base },
  recenteInfo:     { flex: 1, minWidth: 0 },
  recenteTitulo:   { color: color.textSecondary, fontSize: '12px', fontWeight: '500', marginBottom: '2px' },
  recenteSub:      { color: color.textMuted, fontSize: '11px' },
  recenteDireita:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 },
  recentePreco:    { color: color.success, fontSize: '13px', fontWeight: '700' },
  recenteDesconto: { color: color.textMuted, fontSize: '10px' },

  vazioWrap:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '8px' },
  vazioIcone: { fontSize: '28px' },
  vazioTexto: { color: color.textMuted, fontSize: '13px' },
}

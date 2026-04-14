import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { color, shadow, radius, borda, transition } from '../../theme'

const PLANOS = [
  {
    id: 'free',
    nome: 'Free',
    preco: 'R$ 0',
    per: '',
    cor: color.planFree,
    descricao: 'Para explorar o sistema sem compromisso',
    features: [
      { ok: true,  texto: 'Painel de ofertas' },
      { ok: true,  texto: 'Envio manual para Telegram' },
      { ok: false, texto: 'Keywords personalizadas' },
      { ok: false, texto: 'Busca automática de ofertas' },
      { ok: false, texto: 'Credenciais próprias Shopee' },
      { ok: false, texto: 'Canal Telegram próprio' },
      { ok: false, texto: 'Suporte prioritário' },
    ],
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'R$ 49',
    per: '/mês',
    cor: color.planPro,
    descricao: 'Para quem quer automatizar e monetizar',
    features: [
      { ok: true, texto: 'Tudo do Free' },
      { ok: true, texto: 'Até 3 keywords ativas' },
      { ok: true, texto: '5 buscas manuais por dia' },
      { ok: true, texto: 'Credenciais próprias Shopee' },
      { ok: true, texto: 'Canal Telegram próprio' },
      { ok: true, texto: 'Auto-envio para Telegram (2 ofertas a cada 5 min)' },
      { ok: false, texto: 'Keywords ilimitadas' },
      { ok: false, texto: 'Suporte prioritário' },
    ],
  },
  {
    id: 'premium',
    nome: 'Premium',
    preco: 'R$ 99',
    per: '/mês',
    cor: color.planPremium,
    destaque: true,
    descricao: 'Para escalar sem limites',
    features: [
      { ok: true, texto: 'Tudo do Pro' },
      { ok: true, texto: 'Keywords ilimitadas' },
      { ok: true, texto: 'Buscas manuais ilimitadas' },
      { ok: true, texto: 'Credenciais próprias Shopee' },
      { ok: true, texto: 'Canal Telegram próprio' },
      { ok: true, texto: 'Relatórios avançados' },
      { ok: true, texto: 'Suporte prioritário' },
    ],
  },
]

export default function Planos() {
  const { user, profile } = useAuth()
  const planoAtual = profile?.plan || 'free'

  const [planoSelecionado, setPlanoSelecionado] = useState(null)
  const [salvando, setSalvando]                 = useState(false)
  const [erro, setErro]                         = useState('')
  const [largura, setLargura]                   = useState(window.innerWidth)
  const confirmacaoRef                          = useRef(null)

  useEffect(() => {
    function onResize() { setLargura(window.innerWidth) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isMobile = largura < 640
  const isTablet = largura < 1024

  function selecionar(planoId) {
    if (planoId === planoAtual) return
    setPlanoSelecionado(planoId)
    setErro('')
    setTimeout(() => confirmacaoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  async function confirmarAssinatura() {
    if (!planoSelecionado) return
    setSalvando(true)
    setErro('')

    const { error: erroPerfil } = await supabase
      .from('profiles')
      .update({ plan: planoSelecionado })
      .eq('id', user.id)

    if (erroPerfil) {
      setErro('Erro ao atualizar plano. Tente novamente.')
      setSalvando(false)
      return
    }

    await supabase.from('lista_espera').upsert(
      { email: user.email, plano: planoSelecionado, user_id: user.id },
      { onConflict: 'email' }
    )

    await supabase.auth.refreshSession()
    window.location.reload()
  }

  const planoInfo = PLANOS.find(p => p.id === planoAtual)

  return (
    <div style={s.pagina}>

      <div style={s.hero}>
        <div style={s.heroBadge}>
          <span style={s.heroBadgeDot} />
          Plano atual: <strong style={{ color: planoInfo?.cor }}>{planoInfo?.nome}</strong>
        </div>
        <h1 style={s.heroTitulo}>Escolha o plano ideal para você</h1>
        <p style={s.heroSub}>
          Automatize a publicação de ofertas afiliadas da Shopee no seu canal Telegram e gere comissões no piloto automático.
        </p>
      </div>

      <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }}>
        {PLANOS.map(plano => {
          const ativo       = plano.id === planoAtual
          const selecionado = plano.id === planoSelecionado
          return (
            <div
              key={plano.id}
              style={{
                ...s.card,
                ...(plano.destaque ? s.cardDestaque : {}),
                borderColor: selecionado ? plano.cor
                           : ativo       ? plano.cor + '66'
                           : plano.destaque ? color.primaryBorder : color.border,
                background:  selecionado ? plano.cor + '15'
                           : plano.destaque ? `linear-gradient(160deg, #0f1628 0%, ${color.card} 100%)`
                           : color.card,
              }}
            >
              {(plano.destaque || ativo) && (
                <div style={{
                  ...s.tag,
                  background: ativo ? color.hover : plano.cor,
                  color:      ativo ? color.textMuted : color.white,
                  border:     ativo ? borda.base : 'none',
                }}>
                  {ativo ? '✓ Plano atual' : '⭐ Mais popular'}
                </div>
              )}

              <div style={s.cardHead}>
                <p style={{ ...s.planNome, color: plano.cor }}>{plano.nome}</p>
                <div style={s.precoWrap}>
                  <span style={s.preco}>{plano.preco}</span>
                  {plano.per && <span style={s.per}>{plano.per}</span>}
                </div>
                <p style={s.planDesc}>{plano.descricao}</p>
              </div>

              <div style={{ ...s.separador, background: ativo ? plano.cor + '44' : color.border }} />

              <ul style={s.features}>
                {plano.features.map((f, i) => (
                  <li key={i} style={s.featureItem}>
                    <span style={{ ...s.featureIcone, color: f.ok ? color.success : color.textDisabled }}>
                      {f.ok
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      }
                    </span>
                    <span style={{ color: f.ok ? color.textSecondary : color.textDisabled, fontSize: '13px' }}>{f.texto}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => selecionar(plano.id)}
                disabled={ativo}
                style={{
                  ...s.botao,
                  background: ativo       ? color.hover
                            : selecionado  ? plano.cor
                            : plano.destaque ? plano.cor : 'transparent',
                  color:      ativo       ? color.textDisabled
                            : selecionado || plano.destaque ? color.white : plano.cor,
                  border:     `1.5px solid ${ativo ? color.border : plano.cor}`,
                  cursor:     ativo ? 'default' : 'pointer',
                  boxShadow:  selecionado || plano.destaque
                              ? plano.cor === color.planPremium ? shadow.premium : shadow.primary
                              : 'none',
                }}
              >
                {ativo        ? 'Plano atual'
                : selecionado ? '✓ Selecionado — confirmar abaixo'
                :               `Assinar ${plano.nome}`}
              </button>
            </div>
          )
        })}
      </div>

      {planoSelecionado && planoSelecionado !== planoAtual && (
        <div ref={confirmacaoRef} style={s.confirmacaoBox}>
          <div style={s.confirmacaoInner}>
            <div style={s.confirmacaoIcone}>🚀</div>
            <div style={s.confirmacaoTextos}>
              <p style={s.confirmacaoTitulo}>
                Assinar plano <strong style={{ color: color.primary }}>
                  {PLANOS.find(p => p.id === planoSelecionado)?.nome}
                </strong>
              </p>
              <p style={s.confirmacaoSub}>
                Seu plano será atualizado agora. Nossa equipe entrará em contato para processar o pagamento.
              </p>
              {erro && <p style={s.erroTexto}>{erro}</p>}
            </div>
            <div style={s.confirmacaoBotoes}>
              <button onClick={() => setPlanoSelecionado(null)} style={s.botaoCancelar}>Cancelar</button>
              <button onClick={confirmarAssinatura} disabled={salvando} style={salvando ? s.botaoConfirmarDisabled : s.botaoConfirmar}>
                {salvando ? 'Processando...' : 'Confirmar →'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={s.rodape}>
        {[
          { icone: '🔒', texto: 'Acesso imediato após confirmação' },
          { icone: '💬', texto: 'Suporte via Telegram' },
          { icone: '⚡', texto: 'Cancele quando quiser' },
        ].map(({ icone, texto }) => (
          <div key={texto} style={s.rodapeItem}>
            <span style={s.rodapeIcone}>{icone}</span>
            <span style={s.rodapeTexto}>{texto}</span>
          </div>
        ))}
      </div>

      <p style={s.nota}>* Sistema em fase beta. O acesso é liberado manualmente pela nossa equipe após o contato.</p>
    </div>
  )
}

const s = {
  pagina: { display: 'flex', flexDirection: 'column', minHeight: '100%' },

  hero:        { textAlign: 'center', paddingBottom: '40px', paddingTop: '8px' },
  heroBadge:   { display: 'inline-flex', alignItems: 'center', gap: '8px', background: color.card, border: borda.base, borderRadius: '100px', padding: '6px 16px', fontSize: '13px', color: color.textSecondary, marginBottom: '20px', boxShadow: shadow.card },
  heroBadgeDot:{ width: '7px', height: '7px', borderRadius: '50%', background: color.success, flexShrink: 0 },
  heroTitulo:  { color: color.textPrimary, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '12px' },
  heroSub:     { color: color.textMuted, fontSize: '14px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.7' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'stretch', marginBottom: '28px' },

  card: {
    position: 'relative', borderRadius: radius.xl, border: '1px solid',
    padding: '28px 24px 24px', display: 'flex', flexDirection: 'column',
    transition: transition.normal, boxShadow: shadow.card,
  },
  cardDestaque: { boxShadow: `0 0 0 1px ${color.primaryBorder}, 0 20px 40px rgba(99,102,241,0.12)` },

  tag: { display: 'inline-flex', alignSelf: 'flex-start', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '100px', marginBottom: '20px', letterSpacing: '0.2px' },

  cardHead:    { marginBottom: '20px' },
  planNome:    { fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px' },
  precoWrap:   { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' },
  preco:       { color: color.textPrimary, fontSize: '36px', fontWeight: '800', letterSpacing: '-1.5px' },
  per:         { color: color.textMuted, fontSize: '14px' },
  planDesc:    { color: color.textMuted, fontSize: '12px', lineHeight: '1.5' },

  separador: { height: '1px', marginBottom: '20px' },

  features:     { display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '24px', flex: 1 },
  featureItem:  { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  featureIcone: { flexShrink: 0, marginTop: '1px', display: 'flex' },

  botao: { width: '100%', padding: '13px', borderRadius: radius.md, fontWeight: '700', fontSize: '13px', fontFamily: 'inherit', transition: transition.fast, marginTop: 'auto' },

  confirmacaoBox:    { position: 'relative', zIndex: 10, background: color.card, border: borda.primary, borderRadius: radius.lg, padding: '20px 24px', marginBottom: '24px', boxShadow: shadow.elevated },
  confirmacaoInner:  { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' },
  confirmacaoIcone:  { fontSize: '32px', flexShrink: 0 },
  confirmacaoTextos: { flex: 1, minWidth: '200px' },
  confirmacaoTitulo: { color: color.textPrimary, fontSize: '15px', fontWeight: '600', marginBottom: '4px' },
  confirmacaoSub:    { color: color.textMuted, fontSize: '12px', lineHeight: '1.5' },
  erroTexto:         { color: color.danger, fontSize: '12px', marginTop: '6px' },
  confirmacaoBotoes: { display: 'flex', gap: '10px', flexShrink: 0 },
  botaoCancelar:     { padding: '10px 18px', background: 'transparent', border: borda.base, color: color.textMuted, borderRadius: radius.md, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', transition: transition.fast },
  botaoConfirmar:    { padding: '10px 20px', background: color.primary, border: 'none', color: color.white, borderRadius: radius.md, cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit', boxShadow: shadow.primary, transition: transition.fast },
  botaoConfirmarDisabled: { padding: '10px 20px', background: color.hover, border: `1px solid #1a2432`, color: color.textDisabled, borderRadius: radius.md, cursor: 'not-allowed', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit' },

  rodape:      { display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', padding: '20px 0', borderTop: borda.base, borderBottom: borda.base, marginBottom: '20px' },
  rodapeItem:  { display: 'flex', alignItems: 'center', gap: '8px' },
  rodapeIcone: { fontSize: '16px' },
  rodapeTexto: { color: color.textMuted, fontSize: '13px' },

  nota: { color: color.textDisabled, fontSize: '11px', textAlign: 'center' },
}

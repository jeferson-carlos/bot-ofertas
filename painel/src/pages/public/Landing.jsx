import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PublicLayout from '../../components/layouts/PublicLayout'
import WaitlistModal from '../../components/WaitlistModal'
import { color, shadow, radius, borda, transition } from '../../theme'

const PLANOS = [
  {
    nome: 'Free',
    preco: 'Grátis',
    precoSub: 'para sempre',
    cor: color.planFree,
    features: [
      'Acesso ao painel de ofertas',
      'Visualizar últimas 10 ofertas',
      'Filtros por status',
    ],
    bloqueado: [
      'Keywords personalizadas',
      'Busca manual de ofertas',
      'Envio ao Telegram',
    ],
    cta: 'Criar conta grátis',
    acao: 'cadastro',
  },
  {
    nome: 'Pro',
    preco: 'R$ 49',
    precoSub: '/ mês',
    cor: color.planPro,
    features: [
      'Todas as ofertas coletadas',
      'Até 3 keywords personalizadas',
      '5 buscas manuais por dia',
      'Envio direto ao Telegram',
      'Filtros de ordenação por keyword',
    ],
    bloqueado: [],
    cta: 'Entrar na lista de espera',
    acao: 'waitlist',
  },
  {
    nome: 'Premium',
    preco: 'R$ 99',
    precoSub: '/ mês',
    cor: color.planPremium,
    destaque: true,
    features: [
      'Tudo do plano Pro',
      'Keywords ilimitadas',
      'Buscas ilimitadas por dia',
      'Relatórios de desempenho',
      'Suporte prioritário',
    ],
    bloqueado: [],
    cta: 'Entrar na lista de espera',
    acao: 'waitlist',
  },
]

const PASSOS = [
  { num: '01', titulo: 'Configure suas keywords', desc: 'Defina os produtos que quer monitorar. O sistema busca automaticamente os melhores descontos na Shopee a cada hora.' },
  { num: '02', titulo: 'Coletamos as ofertas', desc: 'A cada hora vasculhamos a Shopee em busca de descontos reais — calculados a partir do preço original, sem depender de dados imprecisos.' },
  { num: '03', titulo: 'Você aprova', desc: 'No painel você revisa cada oferta e decide o que enviar ou descartar. Controle total sobre o que vai para o seu canal.' },
  { num: '04', titulo: 'Dispara no Telegram', desc: 'Com um clique a oferta é enviada formatada para o seu canal, com imagem, preços, desconto e link de afiliado.' },
]

const FAQ = [
  { q: 'Como funciona a coleta de ofertas?', a: 'Utilizamos a API oficial de afiliados da Shopee. A cada hora buscamos produtos nas suas keywords e calculamos o desconto real a partir dos preços — sem depender de informações imprecisas dos vendedores.' },
  { q: 'Preciso ter um canal no Telegram?', a: 'Sim. Você configura o seu canal do Telegram no painel e todas as ofertas aprovadas são enviadas diretamente para ele, já formatadas com foto, preços e link de afiliado.' },
  { q: 'O plano Free tem acesso a quê?', a: 'No plano Free você pode visualizar as ofertas coletadas e explorar o painel. Para enviar ao Telegram, usar keywords personalizadas e buscar manualmente, é necessário o plano Pro.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim. Sem fidelidade e sem burocracia. Você cancela a qualquer momento diretamente pelo painel, sem precisar entrar em contato.' },
  { q: 'O que é a lista de espera?', a: 'Os planos pagos estão em fase de lançamento. Ao entrar na lista você será o primeiro a saber quando abrirem as vagas — e pode garantir condições especiais de early adopter.' },
]

export default function Landing() {
  const [waitlistPlano, setWaitlistPlano] = useState(null)
  const [faqAberto, setFaqAberto]         = useState(null)
  const navigate = useNavigate()

  function handleCta(plano) {
    if (plano.acao === 'cadastro') navigate('/cadastro')
    else setWaitlistPlano(plano.nome)
  }

  return (
    <PublicLayout>

      {/* ── HERO ── */}
      <section style={s.hero}>
        <div style={s.container}>
          <div style={s.heroInner}>
            <div style={s.heroBadge}>
              <span style={s.heroBadgeDot} />
              Automatize seus links afiliados da Shopee
            </div>
            <h1 style={s.heroTitulo}>
              Encontre ofertas reais.<br />
              <span style={s.heroDestaque}>Dispare no Telegram.</span>
            </h1>
            <p style={s.heroSub}>
              O PropagAI monitora a Shopee automaticamente, filtra os melhores descontos
              e entrega prontos para você aprovar e publicar — sem esforço manual.
            </p>
            <div style={s.heroBotoes}>
              <button onClick={() => navigate('/cadastro')} style={s.btnPrimario}>
                Começar grátis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <a href="#como-funciona" style={s.btnGhost}>Ver como funciona</a>
            </div>
            <p style={s.heroNota}>Sem cartão de crédito &nbsp;·&nbsp; Plano free para sempre</p>
          </div>
        </div>
      </section>

      {/* ── NÚMEROS ── */}
      <div style={s.numerosWrap}>
        <div style={s.numerosGrid}>
          {[
            { valor: '1h',       label: 'Intervalo de coleta automática' },
            { valor: '50+',      label: 'Produtos analisados por keyword' },
            { valor: '10%',      label: 'Desconto mínimo filtrado' },
            { valor: '1 clique', label: 'Para disparar no Telegram' },
          ].map(({ valor, label }, i) => (
            <div key={label} style={{ ...s.numeroCard, ...(i < 3 ? s.numeroCardBorder : {}) }}>
              <span style={s.numeroValor}>{valor}</span>
              <span style={s.numeroLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" style={s.secaoWrap}>
        <div style={s.container}>
          <div style={s.secaoHeader}>
            <span style={s.secaoBadge}>Como funciona</span>
            <h2 style={s.secaoTitulo}>Do produto ao canal em 4 passos</h2>
            <p style={s.secaoSub}>Configure uma vez e deixe o PropagAI trabalhar por você</p>
          </div>
          <div style={s.passosGrid}>
            {PASSOS.map((p) => (
              <div key={p.num} style={s.passoCard}>
                <span style={s.passoNum}>{p.num}</span>
                <h3 style={s.passoTitulo}>{p.titulo}</h3>
                <p style={s.passoDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="precos" style={{ ...s.secaoWrap, background: color.surface }}>
        <div style={s.container}>
          <div style={s.secaoHeader}>
            <span style={s.secaoBadge}>Planos e preços</span>
            <h2 style={s.secaoTitulo}>Comece grátis, escale quando precisar</h2>
            <p style={s.secaoSub}>Sem surpresas. Cancele quando quiser.</p>
          </div>
          <div style={s.planosGrid}>
            {PLANOS.map((plano) => (
              <div
                key={plano.nome}
                style={{
                  ...s.planoCard,
                  ...(plano.destaque ? s.planoDestaque : {}),
                }}
              >
                {plano.destaque && (
                  <div style={s.popularBadge}>Mais popular</div>
                )}

                <div>
                  <h3 style={{ ...s.planoNome, color: plano.cor }}>{plano.nome}</h3>
                  <div style={s.planoPrecoWrap}>
                    <span style={s.planoPreco}>{plano.preco}</span>
                    <span style={s.planoPrecoSub}>{plano.precoSub}</span>
                  </div>
                </div>

                <ul style={s.planoLista}>
                  {plano.features.map((f, i) => (
                    <li key={i} style={s.planoItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span style={{ color: color.textSecondary }}>{f}</span>
                    </li>
                  ))}
                  {plano.bloqueado.map((f, i) => (
                    <li key={i} style={{ ...s.planoItem, opacity: 0.35 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color.textDisabled} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      <span style={{ color: color.textDisabled }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCta(plano)}
                  style={{
                    ...s.planoBotao,
                    ...(plano.destaque
                      ? { background: plano.cor === color.planPremium ? color.premiumGrad : color.primaryGrad, color: plano.cor === color.planPremium ? '#000' : '#fff', border: 'none', boxShadow: plano.cor === color.planPremium ? shadow.premium : shadow.primary }
                      : { background: 'transparent', border: `1px solid rgba(255,255,255,0.12)`, color: color.textSecondary }
                    ),
                  }}
                >
                  {plano.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={s.secaoWrap}>
        <div style={s.container}>
          <div style={s.secaoHeader}>
            <span style={s.secaoBadge}>Dúvidas frequentes</span>
            <h2 style={s.secaoTitulo}>Perguntas frequentes</h2>
          </div>
          <div style={s.faqLista}>
            {FAQ.map((item, i) => (
              <div
                key={i}
                style={{
                  ...s.faqItem,
                  background:  faqAberto === i ? color.card : 'transparent',
                  borderColor: faqAberto === i ? 'rgba(99,102,241,0.28)' : 'rgba(255,255,255,0.08)',
                }}
                onClick={() => setFaqAberto(faqAberto === i ? null : i)}
              >
                <div style={s.faqPergunta}>
                  <span style={s.faqTexto}>{item.q}</span>
                  <span style={{ ...s.faqSeta, color: faqAberto === i ? color.primaryLight : color.textMuted }}>
                    {faqAberto === i ? '−' : '+'}
                  </span>
                </div>
                {faqAberto === i && (
                  <p style={s.faqResposta}>{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={s.ctaWrap}>
        <div style={s.container}>
          <div style={s.ctaCard}>
            <div style={s.ctaGlow} />
            <h2 style={s.ctaTitulo}>Pronto para automatizar seu canal?</h2>
            <p style={s.ctaSub}>Cadastre-se grátis e comece a explorar o painel agora.</p>
            <button onClick={() => navigate('/cadastro')} style={{ ...s.btnPrimario, fontSize: '16px', padding: '16px 40px' }}>
              Criar conta grátis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <p style={s.heroNota}>Sem cartão de crédito &nbsp;·&nbsp; Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {waitlistPlano && (
        <WaitlistModal plano={waitlistPlano} onClose={() => setWaitlistPlano(null)} />
      )}
    </PublicLayout>
  )
}

const s = {
  container: { width: '100%', maxWidth: '1140px', margin: '0 auto', padding: '0 24px' },

  // Hero — aurora gradient + grid sutil (transmite precisão técnica)
  hero: {
    padding: '140px 0 120px',
    backgroundImage: `
      radial-gradient(ellipse 130% 60% at 50% -10%, rgba(99,102,241,0.32) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 85% 20%, rgba(139,92,246,0.18) 0%, transparent 55%),
      linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
    `,
    backgroundSize: 'auto, auto, 60px 60px, 60px 60px',
    backgroundColor: '#08080c',
  },
  heroInner: { maxWidth: '780px', margin: '0 auto', textAlign: 'center' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '10px',
    background: 'rgba(99,102,241,0.10)',
    color: '#a5b4fc',
    border: '1px solid rgba(99,102,241,0.25)',
    fontSize: '13px', padding: '7px 18px',
    borderRadius: '100px', marginBottom: '40px', fontWeight: '600',
    letterSpacing: '0.2px',
  },
  heroBadgeDot: {
    display: 'inline-block', width: '6px', height: '6px',
    borderRadius: '50%', background: '#a5b4fc', flexShrink: 0,
  },
  heroTitulo: {
    fontSize: 'clamp(44px, 6vw, 72px)', fontWeight: '800',
    lineHeight: 1.06, margin: '0 0 28px',
    letterSpacing: '-2.5px', color: color.textPrimary,
  },
  // Gradient text — padrão Linear/Vercel para destaque em headlines
  heroDestaque: {
    background: 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 40%, #e9d5ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSub: {
    fontSize: '18px', lineHeight: 1.8,
    color: color.textSecondary,
    maxWidth: '600px', margin: '0 auto 48px',
  },
  heroBotoes: {
    display: 'flex', gap: '16px', justifyContent: 'center',
    flexWrap: 'wrap', marginBottom: '28px', alignItems: 'center',
  },
  heroNota: { color: color.textMuted, fontSize: '13px' },

  // Números
  numerosWrap: {
    borderTop: `1px solid rgba(255,255,255,0.06)`,
    borderBottom: `1px solid rgba(255,255,255,0.06)`,
    background: color.surface,
  },
  numerosGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    maxWidth: '1140px', margin: '0 auto',
  },
  numeroCard: {
    padding: '44px 32px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  numeroCardBorder: { borderRight: `1px solid rgba(255,255,255,0.06)` },
  // Gradient nos valores — consistência com heroDestaque
  numeroValor: {
    fontSize: '42px', fontWeight: '800', letterSpacing: '-2px', lineHeight: 1,
    background: 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  numeroLabel: { fontSize: '13px', color: color.textMuted, lineHeight: 1.4 },

  // Seções
  secaoWrap:   { padding: '100px 0' },
  secaoHeader: { textAlign: 'center', marginBottom: '72px' },
  secaoBadge:  {
    display: 'inline-block', color: color.primaryLight,
    fontSize: '11px', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: '16px',
  },
  secaoTitulo: {
    fontSize: 'clamp(30px, 3.5vw, 44px)', fontWeight: '800',
    color: color.textPrimary, letterSpacing: '-1.5px', margin: '0 0 16px',
  },
  secaoSub: { color: color.textSecondary, fontSize: '16px', lineHeight: 1.6 },

  // Como funciona — cards com inner glow
  passosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' },
  passoCard: {
    background: color.card,
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: radius.xl, padding: '36px 30px',
    display: 'flex', flexDirection: 'column', gap: '16px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.5)',
    transition: transition.fast,
  },
  // Números como elemento gráfico — gradient para não parecerem texto comum
  passoNum: {
    fontSize: '56px', fontWeight: '900', lineHeight: 1, letterSpacing: '-3px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.65) 0%, rgba(139,92,246,0.35) 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  passoTitulo: { fontSize: '16px', fontWeight: '700', color: color.textPrimary, letterSpacing: '-0.2px' },
  passoDesc:   { fontSize: '14px', color: color.textSecondary, lineHeight: 1.7 },

  // Planos
  planosGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'stretch' },
  planoCard:  {
    background: color.card,
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: radius.xl, padding: '36px 32px',
    display: 'flex', flexDirection: 'column', gap: '28px',
    position: 'relative',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.5)',
  },
  planoDestaque: {
    background: 'linear-gradient(160deg, #13132a 0%, #16161f 100%)',
    border: '1px solid rgba(99,102,241,0.32)',
    boxShadow: '0 0 60px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  popularBadge: {
    position: 'absolute', top: '-14px', left: '50%',
    transform: 'translateX(-50%)',
    background: color.primaryGrad, color: color.white,
    fontSize: '11px', fontWeight: '700',
    padding: '5px 18px', borderRadius: '100px',
    whiteSpace: 'nowrap', letterSpacing: '0.5px',
    boxShadow: shadow.primary,
  },
  planoNome:      { fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' },
  planoPrecoWrap: { display: 'flex', alignItems: 'baseline', gap: '6px' },
  planoPreco:     { fontSize: '44px', fontWeight: '800', color: color.textPrimary, letterSpacing: '-2px' },
  planoPrecoSub:  { fontSize: '15px', color: color.textMuted },
  planoLista:     { flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' },
  planoItem:      { display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', lineHeight: 1.55 },
  planoBotao: {
    width: '100%', borderRadius: radius.md, padding: '14px',
    fontSize: '14px', fontWeight: '700',
    cursor: 'pointer', transition: transition.fast,
    letterSpacing: '0.3px', fontFamily: 'system-ui, -apple-system, sans-serif',
  },

  // FAQ
  faqLista: { maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  faqItem: {
    border: '1px solid', borderRadius: radius.lg,
    padding: '22px 28px', cursor: 'pointer', userSelect: 'none',
    transition: transition.normal,
  },
  faqPergunta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' },
  faqTexto:    { color: color.textPrimary, fontSize: '15px', fontWeight: '500', lineHeight: 1.5 },
  faqSeta:     { fontSize: '22px', fontWeight: '300', flexShrink: 0, transition: transition.fast },
  faqResposta: { color: color.textSecondary, fontSize: '14px', lineHeight: 1.8, marginTop: '16px', paddingTop: '16px', borderTop: `1px solid rgba(255,255,255,0.06)` },

  // CTA Final — card com glow ao invés de section com bg
  ctaWrap: { padding: '100px 0' },
  ctaCard: {
    position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(160deg, #13132a 0%, #16161f 60%)',
    border: '1px solid rgba(99,102,241,0.28)',
    borderRadius: '24px', padding: '80px 40px',
    textAlign: 'center',
    boxShadow: '0 0 80px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
  },
  ctaGlow: {
    position: 'absolute', top: '-60px', left: '50%',
    transform: 'translateX(-50%)',
    width: '500px', height: '200px',
    background: 'radial-gradient(ellipse, rgba(99,102,241,0.20) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  ctaTitulo: {
    fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: '800',
    color: color.textPrimary, letterSpacing: '-2px', lineHeight: 1.1,
    position: 'relative', zIndex: 1,
  },
  ctaSub: { color: color.textSecondary, fontSize: '17px', lineHeight: 1.6, position: 'relative', zIndex: 1 },

  // Botões
  btnPrimario: {
    background: color.primaryGrad,
    color: color.white,
    border: 'none', borderRadius: radius.lg,
    padding: '14px 32px', fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '0.2px',
    boxShadow: shadow.primary,
    transition: transition.fast,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    position: 'relative', zIndex: 1,
  },
  btnGhost: {
    color: color.textSecondary, fontSize: '15px',
    padding: '14px 8px', display: 'inline-flex',
    alignItems: 'center', gap: '6px', textDecoration: 'none',
    transition: transition.fast, fontWeight: '500',
  },
}

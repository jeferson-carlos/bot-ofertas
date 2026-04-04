import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PublicLayout from '../../components/layouts/PublicLayout'
import WaitlistModal from '../../components/WaitlistModal'

const PLANOS = [
  {
    nome: 'Free',
    preco: 'Grátis',
    precoSub: 'para sempre',
    cor: '#94a3b8',
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
    cor: '#6366f1',
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
    cor: '#f59e0b',
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
  { num: '01', icone: '🔍', titulo: 'Configure suas keywords', desc: 'Defina os produtos que quer monitorar. O sistema busca automaticamente os melhores descontos na Shopee a cada hora.' },
  { num: '02', icone: '⚡', titulo: 'Coletamos as ofertas', desc: 'A cada hora vasculhamos a Shopee em busca de descontos reais — calculados a partir do preço original, sem depender de dados imprecisos.' },
  { num: '03', icone: '✅', titulo: 'Você aprova', desc: 'No painel você revisa cada oferta e decide o que enviar ou descartar. Controle total sobre o que vai para o seu canal.' },
  { num: '04', icone: '📣', titulo: 'Dispara no Telegram', desc: 'Com um clique a oferta é enviada formatada para o seu canal, com imagem, preços, desconto e link de afiliado.' },
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
            <span style={s.heroBadge}>🚀 Automatize seus links afiliados da Shopee</span>
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
                Começar grátis →
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
            { valor: '1h',      label: 'Intervalo de coleta automática' },
            { valor: '50+',     label: 'Produtos analisados por keyword' },
            { valor: '10%',     label: 'Desconto mínimo filtrado' },
            { valor: '1 clique',label: 'Para disparar no Telegram' },
          ].map(({ valor, label }) => (
            <div key={label} style={s.numeroCard}>
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
                <span style={s.passoIcone}>{p.icone}</span>
                <h3 style={s.passoTitulo}>{p.titulo}</h3>
                <p style={s.passoDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="precos" style={{ ...s.secaoWrap, background: '#080d14' }}>
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
                {plano.destaque && <div style={s.popularBadge}>⭐ Mais popular</div>}

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
                      <span style={s.check}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                  {plano.bloqueado.map((f, i) => (
                    <li key={i} style={{ ...s.planoItem, ...s.planoItemOff }}>
                      <span>✗</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCta(plano)}
                  style={{
                    ...s.planoBotao,
                    background:  plano.destaque ? plano.cor : 'transparent',
                    borderColor: plano.cor,
                    color:       plano.destaque ? '#fff' : plano.cor,
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
                style={s.faqItem}
                onClick={() => setFaqAberto(faqAberto === i ? null : i)}
              >
                <div style={s.faqPergunta}>
                  <span style={s.faqTexto}>{item.q}</span>
                  <span style={s.faqSeta}>{faqAberto === i ? '−' : '+'}</span>
                </div>
                {faqAberto === i && <p style={s.faqResposta}>{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={s.ctaWrap}>
        <div style={s.container}>
          <div style={s.ctaInner}>
            <h2 style={s.ctaTitulo}>Pronto para automatizar seu canal?</h2>
            <p style={s.ctaSub}>Cadastre-se grátis e comece a explorar o painel agora.</p>
            <button onClick={() => navigate('/cadastro')} style={s.btnPrimario}>
              Criar conta grátis →
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

/* ── ESTILOS ── */
const s = {
  // Layout base
  container:    { width: '100%', maxWidth: '1140px', margin: '0 auto', padding: '0 24px' },

  // Hero
  hero:         { padding: '120px 0 100px', background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25) 0%, transparent 70%), #0f1117' },
  heroInner:    { maxWidth: '760px', margin: '0 auto', textAlign: 'center' },
  heroBadge:    { display: 'inline-block', background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', fontSize: '13px', padding: '6px 18px', borderRadius: '100px', marginBottom: '32px', fontWeight: '500' },
  heroTitulo:   { fontSize: 'clamp(40px, 5.5vw, 64px)', fontWeight: '800', lineHeight: 1.08, margin: '0 0 24px', letterSpacing: '-2px', color: '#f8fafc' },
  heroDestaque: { color: '#818cf8' },
  heroSub:      { fontSize: '18px', lineHeight: 1.75, color: '#94a3b8', maxWidth: '580px', margin: '0 auto 44px' },
  heroBotoes:   { display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' },
  heroNota:     { color: '#475569', fontSize: '13px' },

  // Números
  numerosWrap:  { borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b', background: '#0b0f1a' },
  numerosGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: '1140px', margin: '0 auto' },
  numeroCard:   { padding: '36px 24px', textAlign: 'center', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '8px' },
  numeroValor:  { fontSize: '36px', fontWeight: '800', color: '#818cf8', letterSpacing: '-1px' },
  numeroLabel:  { fontSize: '13px', color: '#64748b', lineHeight: 1.4 },

  // Seções
  secaoWrap:    { padding: '96px 0' },
  secaoHeader:  { textAlign: 'center', marginBottom: '64px' },
  secaoBadge:   { display: 'inline-block', color: '#818cf8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '14px' },
  secaoTitulo:  { fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: '800', color: '#f8fafc', letterSpacing: '-1px', margin: '0 0 14px' },
  secaoSub:     { color: '#64748b', fontSize: '16px', lineHeight: 1.6 },

  // Como funciona
  passosGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
  passoCard:    { background: '#111827', border: '1px solid #1e293b', borderRadius: '16px', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '12px' },
  passoNum:     { fontSize: '52px', fontWeight: '900', color: '#1e293b', lineHeight: 1, letterSpacing: '-2px' },
  passoIcone:   { fontSize: '28px' },
  passoTitulo:  { fontSize: '16px', fontWeight: '700', color: '#f1f5f9' },
  passoDesc:    { fontSize: '14px', color: '#64748b', lineHeight: 1.65 },

  // Planos
  planosGrid:     { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'stretch' },
  planoCard:      { background: '#111827', border: '1px solid #1e293b', borderRadius: '20px', padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative' },
  planoDestaque:  { border: '1px solid rgba(99,102,241,0.6)', background: '#0f1130', boxShadow: '0 0 40px rgba(99,102,241,0.12)' },
  popularBadge:   { position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#6366f1', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '5px 18px', borderRadius: '100px', whiteSpace: 'nowrap', letterSpacing: '0.5px' },
  planoNome:      { fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' },
  planoPrecoWrap: { display: 'flex', alignItems: 'baseline', gap: '6px' },
  planoPreco:     { fontSize: '42px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-1.5px' },
  planoPrecoSub:  { fontSize: '15px', color: '#64748b' },
  planoLista:     { flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' },
  planoItem:      { display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', color: '#94a3b8', lineHeight: 1.5 },
  planoItemOff:   { color: '#334155', textDecoration: 'line-through' },
  check:          { color: '#22c55e', fontWeight: '700', flexShrink: 0, marginTop: '1px' },
  planoBotao:     { width: '100%', border: '1.5px solid', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.2s', letterSpacing: '0.3px' },

  // FAQ
  faqLista:     { maxWidth: '740px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  faqItem:      { background: '#111827', border: '1px solid #1e293b', borderRadius: '12px', padding: '22px 28px', cursor: 'pointer', userSelect: 'none' },
  faqPergunta:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' },
  faqTexto:     { color: '#e2e8f0', fontSize: '15px', fontWeight: '500', lineHeight: 1.5 },
  faqSeta:      { color: '#6366f1', fontSize: '20px', fontWeight: '300', flexShrink: 0 },
  faqResposta:  { color: '#64748b', fontSize: '14px', lineHeight: 1.75, marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1e293b' },

  // CTA Final
  ctaWrap:      { padding: '120px 0', background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99,102,241,0.2) 0%, transparent 70%), #0b0f1a' },
  ctaInner:     { textAlign: 'center', maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
  ctaTitulo:    { fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: '800', color: '#f8fafc', letterSpacing: '-1.5px', lineHeight: 1.1 },
  ctaSub:       { color: '#94a3b8', fontSize: '17px', lineHeight: 1.6 },

  // Botões
  btnPrimario:  { background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px 36px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.3px' },
  btnGhost:     { color: '#94a3b8', fontSize: '15px', padding: '16px 8px', display: 'inline-flex', alignItems: 'center', gap: '6px' },
}

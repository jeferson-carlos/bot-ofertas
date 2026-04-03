import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PublicLayout from '../../components/layouts/PublicLayout'
import WaitlistModal from '../../components/WaitlistModal'

const PLANOS = [
  {
    nome: 'Free',
    preco: 'Grátis',
    cor: '#6b7280',
    features: [
      'Visualizar últimas 10 ofertas',
      'Filtros por status',
      'Acesso ao painel',
    ],
    bloqueado: ['Busca manual de ofertas', 'Keywords personalizadas', 'Envio ao Telegram'],
    cta: 'Começar grátis',
    acao: 'cadastro',
  },
  {
    nome: 'Pro',
    preco: 'R$ 29/mês',
    cor: '#6366f1',
    destaque: true,
    features: [
      'Todas as ofertas coletadas',
      'Até 3 keywords personalizadas',
      '5 buscas manuais por dia',
      'Envio direto ao Telegram',
      'Filtros de ordenação',
    ],
    bloqueado: [],
    cta: 'Entrar na lista de espera',
    acao: 'waitlist',
  },
  {
    nome: 'Premium',
    preco: 'R$ 79/mês',
    cor: '#f59e0b',
    features: [
      'Tudo do Pro',
      'Keywords ilimitadas',
      'Buscas ilimitadas por dia',
      'Suporte prioritário',
    ],
    bloqueado: [],
    cta: 'Entrar na lista de espera',
    acao: 'waitlist',
  },
]

const PASSOS = [
  { num: '01', icone: '🔍', titulo: 'Configure suas keywords', desc: 'Defina os produtos que quer monitorar. Nossa IA busca automaticamente os melhores descontos na Shopee.' },
  { num: '02', icone: '⚡', titulo: 'Coletamos as ofertas', desc: 'A cada hora vasculhamos a Shopee em busca de descontos reais nos produtos que você escolheu.' },
  { num: '03', icone: '✅', titulo: 'Você aprova', desc: 'No painel você vê as ofertas encontradas e decide quais enviar ou descartar — controle total.' },
  { num: '04', icone: '📣', titulo: 'Dispara no Telegram', desc: 'Com um clique a oferta vai formatada para o seu canal, com imagem, preços e link de afiliado.' },
]

const FAQ = [
  {
    q: 'Como funciona a coleta de ofertas?',
    a: 'Utilizamos a API oficial de afiliados da Shopee. A cada hora buscamos produtos nas suas keywords e calculamos o desconto real — sem depender de informações imprecisas dos vendedores.'
  },
  {
    q: 'Preciso ter um canal no Telegram?',
    a: 'Sim. Você configura o seu canal do Telegram no painel e todas as ofertas aprovadas são enviadas diretamente para ele, já formatadas com foto, preços e link de afiliado.'
  },
  {
    q: 'O plano Free tem acesso a quê?',
    a: 'No plano Free você pode visualizar as ofertas coletadas e explorar o painel. Para enviar ao Telegram, usar keywords personalizadas e buscar manualmente, é necessário o plano Pro.'
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Sem fidelidade e sem burocracia. Você cancela a qualquer momento diretamente pelo painel.'
  },
  {
    q: 'O que é a lista de espera?',
    a: 'Os planos pagos estão em fase de lançamento. Ao entrar na lista de espera você será o primeiro a saber quando abrirem as vagas — e pode garantir condições especiais de early adopter.'
  },
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
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <span style={styles.heroBadge}>🚀 Automatize seus links afiliados da Shopee</span>
          <h1 style={styles.heroTitulo}>
            Encontre ofertas reais.<br />
            <span style={styles.heroDestaque}>Dispare no Telegram.</span>
          </h1>
          <p style={styles.heroSub}>
            O PropagAI monitora a Shopee automaticamente, filtra os melhores descontos e entrega prontos para você aprovar e publicar no seu canal — sem esforço manual.
          </p>
          <div style={styles.heroBotoes}>
            <button onClick={() => navigate('/cadastro')} style={styles.botaoPrimario}>
              Começar grátis →
            </button>
            <a href="#como-funciona" style={styles.botaoGhost}>Ver como funciona</a>
          </div>
          <p style={styles.heroRodape}>Sem cartão de crédito · Plano free para sempre</p>
        </div>
      </section>

      {/* ── NÚMEROS ── */}
      <section style={styles.numeros}>
        {[
          { valor: '1h', label: 'Intervalo de coleta automática' },
          { valor: '50+', label: 'Produtos analisados por keyword' },
          { valor: '10%', label: 'Desconto mínimo para entrar no painel' },
          { valor: '1 clique', label: 'Para disparar no Telegram' },
        ].map(({ valor, label }) => (
          <div key={label} style={styles.numeroCard}>
            <p style={styles.numeroValor}>{valor}</p>
            <p style={styles.numeroLabel}>{label}</p>
          </div>
        ))}
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" style={styles.secao}>
        <div style={styles.secaoHeader}>
          <span style={styles.secaoBadge}>Como funciona</span>
          <h2 style={styles.secaoTitulo}>Do produto ao canal em 4 passos</h2>
          <p style={styles.secaoSub}>Configure uma vez e deixe o PropagAI trabalhar por você</p>
        </div>
        <div style={styles.passosGrid}>
          {PASSOS.map((p) => (
            <div key={p.num} style={styles.passoCard}>
              <div style={styles.passoNum}>{p.num}</div>
              <span style={styles.passoIcone}>{p.icone}</span>
              <h3 style={styles.passoTitulo}>{p.titulo}</h3>
              <p style={styles.passoDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="precos" style={{ ...styles.secao, background: '#080c12', padding: '80px 24px' }}>
        <div style={styles.secaoHeader}>
          <span style={styles.secaoBadge}>Planos e preços</span>
          <h2 style={styles.secaoTitulo}>Comece grátis, escale quando precisar</h2>
          <p style={styles.secaoSub}>Sem surpresas. Cancele quando quiser.</p>
        </div>
        <div style={styles.planosGrid}>
          {PLANOS.map((plano) => (
            <div key={plano.nome} style={{ ...styles.planoCard, ...(plano.destaque ? styles.planoDestaque : {}) }}>
              {plano.destaque && <div style={styles.popularBadge}>⭐ Mais popular</div>}
              <div style={styles.planoHeader}>
                <h3 style={{ ...styles.planoNome, color: plano.cor }}>{plano.nome}</h3>
                <p style={styles.planoPreco}>{plano.preco}</p>
              </div>
              <ul style={styles.planoLista}>
                {plano.features.map((f, i) => (
                  <li key={i} style={styles.planoItem}>
                    <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
                {plano.bloqueado.map((f, i) => (
                  <li key={i} style={{ ...styles.planoItem, color: '#4b5563', textDecoration: 'line-through' }}>
                    <span style={{ flexShrink: 0 }}>✗</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCta(plano)}
                style={{
                  ...styles.planoBotao,
                  background: plano.destaque ? plano.cor : 'transparent',
                  borderColor: plano.cor,
                  color: plano.destaque ? '#fff' : plano.cor,
                }}
              >
                {plano.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={styles.secao}>
        <div style={styles.secaoHeader}>
          <span style={styles.secaoBadge}>Dúvidas frequentes</span>
          <h2 style={styles.secaoTitulo}>Perguntas frequentes</h2>
        </div>
        <div style={styles.faqLista}>
          {FAQ.map((item, i) => (
            <div key={i} style={styles.faqItem} onClick={() => setFaqAberto(faqAberto === i ? null : i)}>
              <div style={styles.faqPergunta}>
                <span style={styles.faqTexto}>{item.q}</span>
                <span style={styles.faqSeta}>{faqAberto === i ? '▲' : '▼'}</span>
              </div>
              {faqAberto === i && <p style={styles.faqResposta}>{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={styles.ctaFinal}>
        <h2 style={styles.ctaTitulo}>Pronto para automatizar seu canal?</h2>
        <p style={styles.ctaSub}>Cadastre-se grátis e comece a explorar o painel agora.</p>
        <button onClick={() => navigate('/cadastro')} style={styles.botaoPrimario}>
          Criar conta grátis →
        </button>
      </section>

      {waitlistPlano && (
        <WaitlistModal plano={waitlistPlano} onClose={() => setWaitlistPlano(null)} />
      )}
    </PublicLayout>
  )
}

const styles = {
  // Hero
  hero:         { padding: '100px 24px 80px', background: 'radial-gradient(ellipse at top, #1a1040 0%, #0f1117 60%)' },
  heroInner:    { maxWidth: '700px', margin: '0 auto', textAlign: 'center' },
  heroBadge:    { display: 'inline-block', background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', fontSize: '13px', padding: '6px 16px', borderRadius: '20px', marginBottom: '28px' },
  heroTitulo:   { color: '#f1f5f9', fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: '800', lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-1px' },
  heroDestaque: { color: '#818cf8' },
  heroSub:      { color: '#94a3b8', fontSize: '18px', lineHeight: 1.7, margin: '0 0 40px', maxWidth: '560px', marginInline: 'auto' },
  heroBotoes:   { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' },
  heroRodape:   { color: '#4b5563', fontSize: '12px', margin: 0 },

  // Números
  numeros:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1px', background: '#1e293b', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b' },
  numeroCard:   { background: '#0f1117', padding: '32px 24px', textAlign: 'center' },
  numeroValor:  { color: '#818cf8', fontSize: '32px', fontWeight: '800', margin: '0 0 6px' },
  numeroLabel:  { color: '#6b7280', fontSize: '13px', margin: 0 },

  // Seções
  secao:        { padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' },
  secaoHeader:  { textAlign: 'center', marginBottom: '56px' },
  secaoBadge:   { display: 'inline-block', color: '#818cf8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' },
  secaoTitulo:  { color: '#f1f5f9', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.5px' },
  secaoSub:     { color: '#6b7280', fontSize: '16px', margin: 0 },

  // Como funciona
  passosGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' },
  passoCard:    { background: '#111827', border: '1px solid #1e293b', borderRadius: '16px', padding: '32px 24px' },
  passoNum:     { color: '#374151', fontSize: '48px', fontWeight: '900', lineHeight: 1, marginBottom: '12px' },
  passoIcone:   { fontSize: '28px', display: 'block', marginBottom: '14px' },
  passoTitulo:  { color: '#f1f5f9', fontSize: '15px', fontWeight: '700', marginBottom: '10px' },
  passoDesc:    { color: '#6b7280', fontSize: '13px', lineHeight: 1.6, margin: 0 },

  // Planos
  planosGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', alignItems: 'start', maxWidth: '1100px', margin: '0 auto' },
  planoCard:      { background: '#111827', borderRadius: '20px', padding: '32px', border: '1px solid #1e293b', position: 'relative' },
  planoDestaque:  { border: '1px solid #6366f1', background: '#13143a' },
  popularBadge:   { position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#6366f1', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '4px 16px', borderRadius: '12px', whiteSpace: 'nowrap' },
  planoHeader:    { marginBottom: '24px' },
  planoNome:      { fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px' },
  planoPreco:     { color: '#f1f5f9', fontSize: '30px', fontWeight: '800', margin: 0 },
  planoLista:     { listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '12px' },
  planoItem:      { color: '#94a3b8', fontSize: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start', lineHeight: 1.4 },
  planoBotao:     { width: '100%', border: '1.5px solid', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },

  // FAQ
  faqLista:     { maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  faqItem:      { background: '#111827', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px 24px', cursor: 'pointer' },
  faqPergunta:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' },
  faqTexto:     { color: '#e2e8f0', fontSize: '15px', fontWeight: '500' },
  faqSeta:      { color: '#6b7280', fontSize: '11px', flexShrink: 0 },
  faqResposta:  { color: '#6b7280', fontSize: '14px', lineHeight: 1.7, margin: '16px 0 0' },

  // CTA Final
  ctaFinal:     { background: 'radial-gradient(ellipse at center, #1a1040 0%, #0f1117 70%)', padding: '100px 24px', textAlign: 'center' },
  ctaTitulo:    { color: '#f1f5f9', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800', margin: '0 0 16px', letterSpacing: '-0.5px' },
  ctaSub:       { color: '#94a3b8', fontSize: '16px', margin: '0 0 36px' },

  // Botões globais
  botaoPrimario:  { background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px 32px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' },
  botaoGhost:     { color: '#94a3b8', textDecoration: 'none', padding: '16px 20px', fontSize: '15px', display: 'inline-flex', alignItems: 'center' },
}

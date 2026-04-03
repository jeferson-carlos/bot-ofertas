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
    bloqueado: ['Busca manual', 'Keywords personalizadas', 'Envio ao Telegram'],
    cta: 'Começar grátis',
    acao: 'cadastro',
  },
  {
    nome: 'Pro',
    preco: 'R$ 29/mês',
    cor: '#6366f1',
    destaque: true,
    features: [
      'Todas as ofertas',
      'Até 3 keywords',
      '5 buscas manuais por dia',
      'Envio ao Telegram',
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
      'Buscas ilimitadas',
      'Suporte prioritário',
    ],
    bloqueado: [],
    cta: 'Entrar na lista de espera',
    acao: 'waitlist',
  },
]

const PASSOS = [
  { icone: '🔍', titulo: 'Configure suas keywords', desc: 'Defina os produtos que quer monitorar na Shopee.' },
  { icone: '⚡', titulo: 'Coletamos as ofertas', desc: 'Buscamos automaticamente os melhores descontos a cada hora.' },
  { icone: '📣', titulo: 'Dispare no Telegram', desc: 'Aprove e envie as ofertas para seu canal com um clique.' },
]

export default function Landing() {
  const [waitlistPlano, setWaitlistPlano] = useState(null)
  const navigate = useNavigate()

  function handleCta(plano) {
    if (plano.acao === 'cadastro') navigate('/cadastro')
    else setWaitlistPlano(plano.nome)
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section style={styles.hero}>
        <span style={styles.badge}>🚀 Automatize seus links afiliados</span>
        <h1 style={styles.heroTitulo}>
          Encontre e dispare ofertas<br />
          <span style={styles.destaque}>Shopee no Telegram</span>
        </h1>
        <p style={styles.heroSub}>
          Monitore descontos automaticamente, aprove as melhores ofertas e envie para seu canal com um clique.
        </p>
        <div style={styles.heroBotoes}>
          <button onClick={() => navigate('/cadastro')} style={styles.botaoPrimario}>
            Começar grátis →
          </button>
          <a href="#como-funciona" style={styles.botaoSecundario}>Como funciona</a>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" style={styles.secao}>
        <h2 style={styles.secaoTitulo}>Como funciona</h2>
        <p style={styles.secaoSub}>Três passos para automatizar seu canal de ofertas</p>
        <div style={styles.passos}>
          {PASSOS.map((p, i) => (
            <div key={i} style={styles.passoCard}>
              <span style={styles.passoIcone}>{p.icone}</span>
              <h3 style={styles.passoTitulo}>{p.titulo}</h3>
              <p style={styles.passoDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="precos" style={styles.secao}>
        <h2 style={styles.secaoTitulo}>Planos e preços</h2>
        <p style={styles.secaoSub}>Comece grátis, faça upgrade quando precisar</p>
        <div style={styles.planosGrid}>
          {PLANOS.map((plano) => (
            <div key={plano.nome} style={{ ...styles.planoCard, ...(plano.destaque ? styles.planoDestaque : {}) }}>
              {plano.destaque && <div style={styles.popularBadge}>Mais popular</div>}
              <h3 style={{ ...styles.planoNome, color: plano.cor }}>{plano.nome}</h3>
              <p style={styles.planoPreco}>{plano.preco}</p>
              <ul style={styles.planoLista}>
                {plano.features.map((f, i) => (
                  <li key={i} style={styles.planoItem}>
                    <span style={{ color: '#10b981' }}>✓</span> {f}
                  </li>
                ))}
                {plano.bloqueado.map((f, i) => (
                  <li key={i} style={{ ...styles.planoItem, color: '#4b5563', textDecoration: 'line-through' }}>
                    <span>✗</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCta(plano)}
                style={{ ...styles.planoBotao, background: plano.destaque ? plano.cor : 'transparent', borderColor: plano.cor, color: plano.destaque ? '#fff' : plano.cor }}
              >
                {plano.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {waitlistPlano && (
        <WaitlistModal plano={waitlistPlano} onClose={() => setWaitlistPlano(null)} />
      )}
    </PublicLayout>
  )
}

const styles = {
  hero:           { textAlign: 'center', padding: '80px 24px 64px', maxWidth: '720px', margin: '0 auto' },
  badge:          { display: 'inline-block', background: '#1e293b', color: '#6366f1', fontSize: '13px', padding: '6px 14px', borderRadius: '20px', marginBottom: '24px' },
  heroTitulo:     { color: '#e2e8f0', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 'bold', lineHeight: 1.15, margin: '0 0 20px' },
  destaque:       { color: '#6366f1' },
  heroSub:        { color: '#9ca3af', fontSize: '18px', lineHeight: 1.6, margin: '0 0 36px' },
  heroBotoes:     { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' },
  botaoPrimario:  { background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px 28px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' },
  botaoSecundario:{ color: '#9ca3af', textDecoration: 'none', padding: '14px 20px', fontSize: '15px' },
  secao:          { padding: '64px 24px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' },
  secaoTitulo:    { color: '#e2e8f0', fontSize: '28px', fontWeight: 'bold', margin: '0 0 12px' },
  secaoSub:       { color: '#6b7280', fontSize: '16px', margin: '0 0 48px' },
  passos:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' },
  passoCard:      { background: '#1e293b', borderRadius: '16px', padding: '32px 24px' },
  passoIcone:     { fontSize: '36px', display: 'block', marginBottom: '16px' },
  passoTitulo:    { color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' },
  passoDesc:      { color: '#6b7280', fontSize: '14px', lineHeight: 1.5, margin: 0 },
  planosGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', alignItems: 'start' },
  planoCard:      { background: '#1e293b', borderRadius: '16px', padding: '32px 24px', border: '1px solid #374151', position: 'relative', textAlign: 'left' },
  planoDestaque:  { border: '2px solid #6366f1', transform: 'scale(1.02)' },
  popularBadge:   { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#6366f1', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '4px 14px', borderRadius: '12px' },
  planoNome:      { fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px' },
  planoPreco:     { color: '#e2e8f0', fontSize: '26px', fontWeight: 'bold', margin: '0 0 24px' },
  planoLista:     { listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' },
  planoItem:      { color: '#9ca3af', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'flex-start' },
  planoBotao:     { width: '100%', border: '1.5px solid', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
}

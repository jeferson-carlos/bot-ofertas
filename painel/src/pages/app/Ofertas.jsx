import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

const FUNCTION_URL = import.meta.env.VITE_FUNCTION_URL
const PAGE_SIZE = 20

const STATUS_CONFIG = {
  pendente:   { label: 'Pendentes',   cor: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icone: '⏳' },
  enviado:    { label: 'Enviadas',    cor: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icone: '✈️' },
  descartado: { label: 'Descartadas', cor: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icone: '🗑️' },
}

function badgeDesconto(pct) {
  const n = parseFloat(pct)
  if (n >= 40) return { bg: '#15803d', color: '#fff' }
  if (n >= 20) return { bg: '#d97706', color: '#fff' }
  return { bg: '#dc2626', color: '#fff' }
}

export default function Ofertas() {
  const location = useLocation()
  const { profile } = useAuth()
  const plano = profile?.plan || 'free'

  const [ofertas, setOfertas]         = useState([])
  const [filtro, setFiltro]           = useState(location.state?.filtro || 'pendente')
  const [loading, setLoading]         = useState(true)
  const [loadingMais, setLoadingMais] = useState(false)
  const [acao, setAcao]               = useState(null)
  const [pagina, setPagina]           = useState(0)
  const [temMais, setTemMais]         = useState(false)
  const [copiado, setCopiado]         = useState(null)

  async function carregarOfertas(novaPagina = 0, append = false) {
    if (append) setLoadingMais(true)
    else setLoading(true)

    const from = novaPagina * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    const { data } = await supabase
      .from('ofertas')
      .select('*')
      .eq('status', filtro)
      .order('criado_em', { ascending: false })
      .range(from, to)

    const resultado = data || []
    setOfertas(prev => append ? [...prev, ...resultado] : resultado)
    setTemMais(resultado.length === PAGE_SIZE)
    setPagina(novaPagina)

    if (append) setLoadingMais(false)
    else setLoading(false)
  }

  function carregarMais() { carregarOfertas(pagina + 1, true) }

  useEffect(() => { carregarOfertas(0) }, [filtro])

  async function enviar(id) {
    setAcao(id)
    await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`
      },
      body: JSON.stringify({ id, acao: 'enviar' })
    })
    await carregarOfertas(0)
    setAcao(null)
  }

  async function descartar(id) {
    setAcao(id)
    await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`
      },
      body: JSON.stringify({ id, acao: 'descartar' })
    })
    await carregarOfertas(0)
    setAcao(null)
  }

  async function copiar(oferta) {
    const original  = parseFloat(oferta.preco_original).toFixed(2)
    const desconto  = parseFloat(oferta.preco_desconto).toFixed(2)
    const pct       = oferta.percentual_desconto
    const texto =
      `🔥 OFERTA SHOPEE\n\n` +
      `📦 ${oferta.titulo}\n\n` +
      `🏪 Loja: ${oferta.loja || 'Shopee'}\n` +
      `💰 De: R$ ${original}\n` +
      `✅ Por: R$ ${desconto}\n` +
      `📉 Desconto: ${pct}% OFF\n\n` +
      `🛒 Comprar agora: ${oferta.link_afiliado}`
    await navigator.clipboard.writeText(texto)
    setCopiado(oferta.id)
    setTimeout(() => setCopiado(null), 2000)
  }

  const cfg = STATUS_CONFIG[filtro]

  return (
    <div>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Ofertas</h1>
          <p style={s.subtitulo}>{ofertas.length} {cfg.label.toLowerCase()} carregadas</p>
        </div>
        <button onClick={() => carregarOfertas(0)} style={s.recarregar}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div style={s.filtros}>
        {Object.entries(STATUS_CONFIG).map(([key, { label, cor, bg, icone }]) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            style={{
              ...s.filtroBotao,
              background: filtro === key ? bg : 'transparent',
              color: filtro === key ? cor : '#475569',
              borderColor: filtro === key ? cor + '66' : '#1e293b',
            }}
          >
            <span style={{ marginRight: '6px', fontSize: '12px' }}>{icone}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={s.vazioWrap}>
          <p style={s.vazioTexto}>Carregando...</p>
        </div>
      ) : ofertas.length === 0 ? (
        <div style={s.vazioWrap}>
          <span style={s.vazioIcone}>{cfg.icone}</span>
          <p style={s.vazioTexto}>Nenhuma oferta {cfg.label.toLowerCase()}.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {ofertas.map(oferta => {
            const descPct   = parseFloat(oferta.percentual_desconto) || 0
            const badgeEstilo = badgeDesconto(descPct)
            const emAcao    = acao === oferta.id
            return (
              <div key={oferta.id} style={s.card}>

                {/* Imagem */}
                <div style={s.imgWrap}>
                  {oferta.imagem_url
                    ? <img src={oferta.imagem_url} alt={oferta.titulo} style={s.imagem} />
                    : <div style={s.imgPlaceholder}><span style={{ fontSize: '32px', opacity: 0.3 }}>📦</span></div>
                  }
                  {/* Badge desconto */}
                  <div style={{ ...s.badgeDesconto, background: badgeEstilo.bg, color: badgeEstilo.color }}>
                    -{descPct}%
                  </div>
                  {/* Loja pill */}
                  <div style={s.lojaPill}>{oferta.loja || 'Shopee'}</div>
                </div>

                {/* Conteúdo */}
                <div style={s.corpo}>
                  <p style={s.cardTitulo}>{oferta.titulo?.slice(0, 72)}{oferta.titulo?.length > 72 ? '…' : ''}</p>

                  <div style={s.precoWrap}>
                    <span style={s.precoDesconto}>R$ {parseFloat(oferta.preco_desconto).toFixed(2)}</span>
                    <span style={s.precoOriginal}>R$ {parseFloat(oferta.preco_original).toFixed(2)}</span>
                  </div>

                  {oferta.comissao != null && (
                    <div style={s.comissaoWrap}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                      </svg>
                      <span style={s.comissaoTexto}>{parseFloat(oferta.comissao).toFixed(2)}% comissão</span>
                    </div>
                  )}
                </div>

                {/* Rodapé */}
                <div style={s.rodape}>
                  {filtro === 'pendente' ? (
                    <div style={s.acoes}>
                      {plano === 'free' ? (
                        <button onClick={() => copiar(oferta)} style={s.botaoCopiar}>
                          {copiado === oferta.id ? (
                            <>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Copiado!
                            </>
                          ) : (
                            <>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                              </svg>
                              Copiar mensagem
                            </>
                          )}
                        </button>
                      ) : (
                        <>
                          <button onClick={() => enviar(oferta.id)} disabled={emAcao} style={s.botaoEnviar}>
                            {emAcao ? '...' : (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                                Enviar
                              </>
                            )}
                          </button>
                          <button onClick={() => descartar(oferta.id)} disabled={emAcao} style={s.botaoDescartar}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ flex: 1 }} />
                  )}
                  <a href={oferta.link_afiliado} target="_blank" rel="noreferrer" style={s.linkVer}>
                    Ver →
                  </a>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* Carregar mais */}
      {temMais && !loading && (
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <button onClick={carregarMais} disabled={loadingMais} style={s.botaoMais}>
            {loadingMais ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  )
}

const s = {
  // Header
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' },
  titulo:         { color: '#f1f5f9', fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  subtitulo:      { color: '#64748b', fontSize: '13px' },
  recarregar:     { display: 'flex', alignItems: 'center', background: 'transparent', border: '1px solid #1e293b', color: '#64748b', borderRadius: '8px', padding: '9px 14px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' },

  // Filtros
  filtros:        { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  filtroBotao:    { display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.15s' },

  // Vazio
  vazioWrap:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '12px' },
  vazioIcone:     { fontSize: '36px' },
  vazioTexto:     { color: '#475569', fontSize: '14px' },

  // Grid
  grid:           { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' },

  // Card
  card:           { background: '#111827', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },

  // Imagem
  imgWrap:        { position: 'relative', flexShrink: 0 },
  imagem:         { width: '100%', height: '170px', objectFit: 'cover', display: 'block' },
  imgPlaceholder: { width: '100%', height: '170px', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badgeDesconto:  { position: 'absolute', top: '10px', left: '10px', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.3px' },
  lojaPill:       { position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: '#94a3b8', fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', backdropFilter: 'blur(4px)' },

  // Corpo
  corpo:          { padding: '14px 14px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  cardTitulo:     { color: '#cbd5e1', fontSize: '12px', lineHeight: '1.5', fontWeight: '500' },
  precoWrap:      { display: 'flex', alignItems: 'baseline', gap: '8px' },
  precoDesconto:  { color: '#22c55e', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' },
  precoOriginal:  { color: '#475569', fontSize: '11px', textDecoration: 'line-through' },
  comissaoWrap:   { display: 'flex', alignItems: 'center', gap: '5px' },
  comissaoTexto:  { color: '#f59e0b', fontSize: '11px', fontWeight: '500' },

  // Rodapé
  rodape:         { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px 12px' },
  acoes:          { display: 'flex', gap: '6px', flex: 1 },
  botaoEnviar:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', fontFamily: 'inherit' },
  botaoCopiar:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: '#0f1117', color: '#22c55e', border: '1px solid #22c55e44', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', fontFamily: 'inherit' },
  botaoDescartar: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: '#0f1117', color: '#475569', border: '1px solid #1e293b', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 },
  linkVer:        { color: '#6366f1', fontSize: '12px', fontWeight: '600', flexShrink: 0, textDecoration: 'none' },

  // Carregar mais
  botaoMais:      { background: 'transparent', border: '1px solid #1e293b', color: '#64748b', borderRadius: '10px', padding: '12px 36px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' },
}

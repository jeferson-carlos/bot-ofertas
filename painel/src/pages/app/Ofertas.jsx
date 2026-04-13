import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { color, shadow, radius, borda, transition } from '../../theme'

const FUNCTION_URL = import.meta.env.VITE_FUNCTION_URL
const PAGE_SIZE = 20

const STATUS_CONFIG = {
  pendente:   { label: 'Pendentes',   cor: color.warning,      bg: color.warningMuted,  icone: '⏳' },
  enviado:    { label: 'Enviadas',    cor: color.success,      bg: color.successMuted,  icone: '✈️' },
  descartado: { label: 'Descartadas', cor: color.dangerStrong, bg: color.dangerMuted,   icone: '🗑️' },
}

function badgeDesconto(pct) {
  const n = parseFloat(pct)
  if (n >= 40) return { bg: color.success, color: '#000' }
  if (n >= 20) return { bg: color.warning, color: '#000' }
  return { bg: color.dangerStrong, color: '#fff' }
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
  const [busca, setBusca]             = useState('')
  const [selecionados, setSelecionados]       = useState(new Set())
  const [descartandoLote, setDescartandoLote] = useState(false)
  const [enviandoLote, setEnviandoLote]       = useState(false)
  const [progressoLote, setProgressoLote]     = useState(0)

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
    setSelecionados(new Set())

    if (append) setLoadingMais(false)
    else setLoading(false)
  }

  function carregarMais() { carregarOfertas(pagina + 1, true) }

  useEffect(() => { carregarOfertas(0) }, [filtro])

  async function enviar(id) {
    setAcao(id)
    await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}` },
      body: JSON.stringify({ id, acao: 'enviar' })
    })
    await carregarOfertas(0)
    setAcao(null)
  }

  async function descartar(id) {
    setAcao(id)
    await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}` },
      body: JSON.stringify({ id, acao: 'descartar' })
    })
    await carregarOfertas(0)
    setAcao(null)
  }

  async function reenviar(id) {
    setAcao(id)
    await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}` },
      body: JSON.stringify({ id, acao: 'reenviar' })
    })
    setAcao(null)
  }

  async function descartarSelecionados() {
    if (selecionados.size === 0) return
    setDescartandoLote(true)
    await supabase
      .from('ofertas')
      .update({ status: 'descartado' })
      .in('id', Array.from(selecionados))
    setDescartandoLote(false)
    await carregarOfertas(0)
  }

  async function enviarSelecionados() {
    if (selecionados.size === 0) return
    setEnviandoLote(true)
    setProgressoLote(0)
    const ids = Array.from(selecionados)
    for (let i = 0; i < ids.length; i++) {
      await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}` },
        body: JSON.stringify({ id: ids[i], acao: 'enviar' })
      })
      setProgressoLote(i + 1)
    }
    setEnviandoLote(false)
    setProgressoLote(0)
    await carregarOfertas(0)
  }

  async function copiar(oferta) {
    const original = parseFloat(oferta.preco_original).toFixed(2)
    const desconto = parseFloat(oferta.preco_desconto).toFixed(2)
    const pct      = oferta.percentual_desconto
    const texto =
      `🔥 OFERTA SHOPEE\n\n` +
      `📦 ${oferta.titulo}\n\n` +
      `🏪 Loja: ${oferta.loja || 'Shopee'}\n` +
      `💰 De: R$ ${original}\n` +
      `✅ Por: R$ ${desconto}\n` +
      `📉 Desconto: ${pct}% OFF\n\n` +
      `🛒 Comprar agora: ${oferta.link_afiliado}`
    await navigator.clipboard.writeText(texto)
    await supabase
      .from('ofertas')
      .update({ status: 'enviado', enviado_em: new Date().toISOString() })
      .eq('id', oferta.id)
    setCopiado(oferta.id)
    setTimeout(() => { setCopiado(null); carregarOfertas(0) }, 1500)
  }

  function toggleSelecionado(id) {
    setSelecionados(prev => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function selecionarTodos() {
    setSelecionados(new Set(ofertasFiltradas.map(o => o.id)))
  }

  function limparSelecao() {
    setSelecionados(new Set())
  }

  const cfg              = STATUS_CONFIG[filtro]
  const ofertasFiltradas = busca.trim()
    ? ofertas.filter(o => o.titulo?.toLowerCase().includes(busca.toLowerCase()) || o.loja?.toLowerCase().includes(busca.toLowerCase()))
    : ofertas
  const todosSelecionados = ofertasFiltradas.length > 0 && ofertasFiltradas.every(o => selecionados.has(o.id))
  const modoBulk = filtro === 'pendente'

  return (
    <div>

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

      <div style={s.filtros}>
        {Object.entries(STATUS_CONFIG).map(([key, { label, cor, bg, icone }]) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            style={{
              ...s.filtroBotao,
              background: filtro === key ? bg : 'transparent',
              color: filtro === key ? cor : color.textMuted,
              borderColor: filtro === key ? cor + '66' : color.border,
              boxShadow: filtro === key ? `0 0 0 1px ${cor}33` : 'none',
            }}
          >
            <span style={{ marginRight: '6px', fontSize: '12px' }}>{icone}</span>
            {label}
          </button>
        ))}
      </div>

      <div style={s.toolbar}>
        <div style={s.buscaWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por título ou loja..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={s.buscaInput}
          />
          {busca && <button onClick={() => setBusca('')} style={s.buscaLimpar}>✕</button>}
        </div>

        {modoBulk && ofertasFiltradas.length > 0 && (
          <div style={s.selecaoControles}>
            <button onClick={todosSelecionados ? limparSelecao : selecionarTodos} style={s.botaoSelecionar}>
              {todosSelecionados ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
          </div>
        )}
      </div>

      {selecionados.size > 0 && (
        <div style={s.loteBar}>
          <span style={s.loteInfo}>
            <strong style={{ color: color.textPrimary }}>{selecionados.size}</strong> oferta{selecionados.size > 1 ? 's' : ''} selecionada{selecionados.size > 1 ? 's' : ''}
            {enviandoLote && <span style={{ color: color.primary, marginLeft: '10px' }}> Enviando {progressoLote}/{selecionados.size}...</span>}
          </span>
          <div style={s.loteBotoes}>
            <button onClick={limparSelecao} disabled={enviandoLote || descartandoLote} style={s.loteBotaoCancelar}>Cancelar</button>
            {plano !== 'free' && (
              <button onClick={enviarSelecionados} disabled={enviandoLote || descartandoLote} style={s.loteBotaoEnviar}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                {enviandoLote ? `Enviando ${progressoLote}/${selecionados.size}...` : `Enviar ${selecionados.size}`}
              </button>
            )}
            <button onClick={descartarSelecionados} disabled={descartandoLote || enviandoLote} style={s.loteBotaoDescartar}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              </svg>
              {descartandoLote ? 'Descartando...' : `Descartar ${selecionados.size}`}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={s.vazioWrap}>
          <p style={s.vazioTexto}>Carregando...</p>
        </div>
      ) : ofertas.length === 0 ? (
        <div style={s.vazioWrap}>
          <span style={s.vazioIcone}>{cfg.icone}</span>
          {filtro === 'pendente' && !profile?.shopee_app_id ? (
            <>
              <p style={s.vazioTitulo}>Nenhuma oferta ainda</p>
              <p style={s.vazioTexto}>Configure suas credenciais Shopee para o bot começar a coletar ofertas automaticamente.</p>
              <a href="#/app/configuracoes" style={s.vazioLink}>Ir para Configurações →</a>
            </>
          ) : (
            <p style={s.vazioTexto}>Nenhuma oferta {cfg.label.toLowerCase()}.</p>
          )}
        </div>
      ) : (
        <div style={s.grid}>
          {ofertasFiltradas.map(oferta => {
            const descPct    = parseFloat(oferta.percentual_desconto) || 0
            const badge      = badgeDesconto(descPct)
            const emAcao     = acao === oferta.id
            const selecionado = selecionados.has(oferta.id)
            return (
              <div
                key={oferta.id}
                style={{
                  ...s.card,
                  borderColor: selecionado ? color.primary : color.border,
                  background:  selecionado ? color.primaryMuted : color.card,
                  boxShadow:   selecionado ? shadow.focus : shadow.card,
                }}
              >
                <div style={s.imgWrap}>
                  {oferta.imagem_url
                    ? <img src={oferta.imagem_url} alt={oferta.titulo} style={s.imagem} />
                    : <div style={s.imgPlaceholder}><span style={{ fontSize: '32px', opacity: 0.3 }}>📦</span></div>
                  }
                  <div style={{ ...s.badgeDesconto, background: badge.bg, color: badge.color }}>-{descPct}%</div>
                  <div style={s.lojaPill}>{oferta.loja || 'Shopee'}</div>

                  {modoBulk && (
                    <button
                      onClick={() => toggleSelecionado(oferta.id)}
                      style={{
                        ...s.checkbox,
                        background: selecionado ? color.primary : 'rgba(0,0,0,0.55)',
                        borderColor: selecionado ? color.primary : 'rgba(255,255,255,0.25)',
                      }}
                    >
                      {selecionado && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                <div style={s.corpo}>
                  <p style={s.cardTitulo}>{oferta.titulo?.slice(0, 72)}{oferta.titulo?.length > 72 ? '…' : ''}</p>
                  <div style={s.precoWrap}>
                    <span style={s.precoDesconto}>R$ {parseFloat(oferta.preco_desconto).toFixed(2)}</span>
                    <span style={s.precoOriginal}>R$ {parseFloat(oferta.preco_original).toFixed(2)}</span>
                  </div>
                  {oferta.comissao != null && (
                    <div style={s.comissaoWrap}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color.warning} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                      </svg>
                      <span style={s.comissaoTexto}>{parseFloat(oferta.comissao).toFixed(0)}% comissão</span>
                    </div>
                  )}
                </div>

                <div style={s.rodape}>
                  {filtro === 'pendente' ? (
                    <div style={s.acoes}>
                      {plano === 'free' ? (
                        <button onClick={() => copiar(oferta)} style={s.botaoCopiar}>
                          {copiado === oferta.id ? (
                            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}><polyline points="20 6 9 17 4 12"/></svg>Copiado!</>
                          ) : (
                            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar mensagem</>
                          )}
                        </button>
                      ) : (
                        <>
                          <button onClick={() => enviar(oferta.id)} disabled={emAcao} style={emAcao ? s.botaoEnviarDisabled : s.botaoEnviar}>
                            {emAcao ? '...' : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Enviar</>}
                          </button>
                          <button onClick={() => descartar(oferta.id)} disabled={emAcao} style={s.botaoDescartar}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  ) : filtro === 'enviado' && plano !== 'free' ? (
                    <div style={s.acoes}>
                      <button onClick={() => reenviar(oferta.id)} disabled={emAcao} style={s.botaoReenviar}>
                        {emAcao ? '...' : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>Reenviar</>}
                      </button>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }} />
                  )}
                  <a href={oferta.link_afiliado} target="_blank" rel="noreferrer" style={s.linkVer}>Ver →</a>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' },
  titulo:     { color: color.textPrimary, fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  subtitulo:  { color: color.textMuted, fontSize: '13px' },
  recarregar: {
    display: 'flex', alignItems: 'center',
    background: 'transparent', border: borda.base,
    color: color.textSecondary, borderRadius: radius.md,
    padding: '9px 14px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
    transition: transition.fast,
  },

  filtros:    { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  filtroBotao:{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: radius.md, border: '1px solid', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: 'inherit', transition: transition.fast },

  toolbar:    { display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' },
  buscaWrap:  { flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', gap: '10px', background: color.card, border: borda.base, borderRadius: radius.md, padding: '8px 14px' },
  buscaInput: { flex: 1, background: 'transparent', border: 'none', color: color.textPrimary, fontSize: '13px', fontFamily: 'inherit', outline: 'none' },
  buscaLimpar:{ background: 'none', border: 'none', color: color.textMuted, cursor: 'pointer', fontSize: '14px', padding: 0, lineHeight: 1 },
  selecaoControles:{ flexShrink: 0 },
  botaoSelecionar: {
    background: 'transparent', border: borda.base,
    color: color.textSecondary, borderRadius: radius.md,
    padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  },

  loteBar:          { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: color.primaryMuted, border: borda.primary, borderRadius: radius.md, padding: '12px 16px', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
  loteInfo:         { color: color.textSecondary, fontSize: '13px' },
  loteBotoes:       { display: 'flex', gap: '8px' },
  loteBotaoCancelar:{ background: 'transparent', border: borda.base, color: color.textMuted, borderRadius: radius.md, padding: '7px 14px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' },
  loteBotaoEnviar:  { display: 'flex', alignItems: 'center', background: color.primaryMuted, border: borda.primary, color: '#818cf8', borderRadius: radius.md, padding: '7px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: 'inherit' },
  loteBotaoDescartar:{ display: 'flex', alignItems: 'center', background: color.dangerMuted, border: borda.danger, color: color.danger, borderRadius: radius.md, padding: '7px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: 'inherit' },

  vazioWrap:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '12px' },
  vazioIcone: { fontSize: '36px' },
  vazioTitulo:{ color: color.textSecondary, fontSize: '15px', fontWeight: '600' },
  vazioTexto: { color: color.textMuted, fontSize: '13px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.6' },
  vazioLink:  { color: color.primary, fontSize: '13px', fontWeight: '600', textDecoration: 'none', marginTop: '4px' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' },
  card: {
    borderRadius: radius.lg, border: '1px solid', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    transition: transition.fast,
  },

  imgWrap:        { position: 'relative', flexShrink: 0 },
  imagem:         { width: '100%', height: '170px', objectFit: 'cover', display: 'block' },
  imgPlaceholder: { width: '100%', height: '170px', background: color.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badgeDesconto:  { position: 'absolute', top: '10px', left: '10px', padding: '3px 9px', borderRadius: radius.sm, fontSize: '11px', fontWeight: '800', letterSpacing: '0.3px' },
  lojaPill:       { position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.65)', color: color.textSecondary, fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: radius.sm, backdropFilter: 'blur(4px)' },
  checkbox:       { position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderRadius: radius.sm, border: '1.5px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: transition.fast },

  corpo:          { padding: '14px 14px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  cardTitulo:     { color: color.textSecondary, fontSize: '12px', lineHeight: '1.5', fontWeight: '500' },
  precoWrap:      { display: 'flex', alignItems: 'baseline', gap: '8px' },
  precoDesconto:  { color: color.success, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' },
  precoOriginal:  { color: color.textMuted, fontSize: '11px', textDecoration: 'line-through' },
  comissaoWrap:   { display: 'flex', alignItems: 'center', gap: '5px' },
  comissaoTexto:  { color: color.warning, fontSize: '11px', fontWeight: '500' },

  rodape:         { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px 12px' },
  acoes:          { display: 'flex', gap: '6px', flex: 1 },
  botaoEnviar:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: color.primary, color: color.white, border: 'none', borderRadius: radius.md, cursor: 'pointer', fontWeight: '700', fontSize: '12px', fontFamily: 'inherit', boxShadow: shadow.primary, transition: transition.fast },
  botaoEnviarDisabled: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: color.hover, color: color.textDisabled, border: `1px solid #1a2432`, borderRadius: radius.md, cursor: 'not-allowed', fontWeight: '700', fontSize: '12px', fontFamily: 'inherit' },
  botaoCopiar:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: color.successMuted, color: color.success, border: borda.success, borderRadius: radius.md, cursor: 'pointer', fontWeight: '600', fontSize: '12px', fontFamily: 'inherit' },
  botaoReenviar:  { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: color.primaryMuted, color: color.primary, border: borda.primary, borderRadius: radius.md, cursor: 'pointer', fontWeight: '600', fontSize: '12px', fontFamily: 'inherit' },
  botaoDescartar: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: color.dangerMuted, color: color.danger, border: borda.danger, borderRadius: radius.md, cursor: 'pointer', flexShrink: 0, transition: transition.fast },
  linkVer:        { color: color.primary, fontSize: '12px', fontWeight: '600', flexShrink: 0, textDecoration: 'none' },
  botaoMais:      { background: 'transparent', border: borda.base, color: color.textSecondary, borderRadius: radius.lg, padding: '12px 36px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', transition: transition.fast },
}

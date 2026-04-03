import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

const FUNCTION_URL = import.meta.env.VITE_FUNCTION_URL
const PAGE_SIZE = 20

const STATUS_LABELS = {
  pendente:   { label: 'Pendentes',   cor: '#f59e0b' },
  enviado:    { label: 'Enviadas',    cor: '#10b981' },
  descartado: { label: 'Descartadas', cor: '#ef4444' },
}

export default function Ofertas() {
  const location = useLocation()
  const [ofertas, setOfertas]       = useState([])
  const [filtro, setFiltro]         = useState(location.state?.filtro || 'pendente')
  const [loading, setLoading]       = useState(true)
  const [loadingMais, setLoadingMais] = useState(false)
  const [acao, setAcao]             = useState(null)
  const [pagina, setPagina]         = useState(0)
  const [temMais, setTemMais]       = useState(false)

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

  function carregarMais() {
    carregarOfertas(pagina + 1, true)
  }

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

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.titulo}>Ofertas</h1>
        <button onClick={() => carregarOfertas(0)} style={styles.recarregar}>🔄 Atualizar</button>
      </div>

      {/* Filtros */}
      <div style={styles.filtros}>
        {Object.entries(STATUS_LABELS).map(([key, { label, cor }]) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            style={{
              ...styles.filtroBotao,
              borderColor: cor,
              background: filtro === key ? cor : 'transparent',
              color: filtro === key ? '#fff' : cor,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p style={styles.vazio}>Carregando...</p>
      ) : ofertas.length === 0 ? (
        <p style={styles.vazio}>Nenhuma oferta {STATUS_LABELS[filtro].label.toLowerCase()}.</p>
      ) : (
        <div style={styles.grid}>
          {ofertas.map(oferta => (
            <div key={oferta.id} style={styles.card}>
              {oferta.imagem_url && (
                <img src={oferta.imagem_url} alt={oferta.titulo} style={styles.imagem} />
              )}
              <div style={styles.badge}>{oferta.percentual_desconto}% OFF</div>
              <div style={styles.info}>
                <p style={styles.cardTitulo}>{oferta.titulo}</p>
                <p style={styles.loja}>🏪 {oferta.loja || 'Shopee'}</p>
                <div style={styles.precos}>
                  <span style={styles.precoOriginal}>
                    R$ {parseFloat(oferta.preco_original).toFixed(2)}
                  </span>
                  <span style={styles.precoDesconto}>
                    R$ {parseFloat(oferta.preco_desconto).toFixed(2)}
                  </span>
                </div>
                {oferta.comissao != null && (
                  <p style={styles.comissao}>
                    💰 Comissão: {parseFloat(oferta.comissao).toFixed(2)}%
                  </p>
                )}
              </div>
              {filtro === 'pendente' && (
                <div style={styles.acoes}>
                  <button
                    onClick={() => enviar(oferta.id)}
                    disabled={acao === oferta.id}
                    style={styles.botaoEnviar}
                  >
                    {acao === oferta.id ? 'Enviando...' : '✈️ Enviar'}
                  </button>
                  <button
                    onClick={() => descartar(oferta.id)}
                    disabled={acao === oferta.id}
                    style={styles.botaoDescartar}
                  >
                    🗑️ Descartar
                  </button>
                </div>
              )}
              <a href={oferta.link_afiliado} target="_blank" rel="noreferrer" style={styles.link}>
                Ver produto →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Carregar mais */}
      {temMais && !loading && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button onClick={carregarMais} disabled={loadingMais} style={styles.botaoMais}>
            {loadingMais ? 'Carregando...' : `Carregar mais`}
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titulo:         { color: '#e2e8f0', fontSize: '22px', fontWeight: 'bold', margin: 0 },
  recarregar:     { background: 'transparent', border: '1px solid #374151', color: '#9ca3af', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' },
  filtros:        { display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' },
  filtroBotao:    { padding: '8px 20px', borderRadius: '20px', border: '1.5px solid', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  vazio:          { textAlign: 'center', color: '#6b7280', marginTop: '48px' },
  grid:           { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' },
  card:           { background: '#1e293b', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' },
  imagem:         { width: '100%', height: '180px', objectFit: 'cover' },
  badge:          { position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  info:           { padding: '14px' },
  cardTitulo:     { color: '#e2e8f0', fontSize: '13px', marginBottom: '6px', lineHeight: '1.4' },
  loja:           { color: '#6b7280', fontSize: '12px', marginBottom: '8px' },
  precos:         { display: 'flex', alignItems: 'center', gap: '10px' },
  precoOriginal:  { color: '#6b7280', fontSize: '12px', textDecoration: 'line-through' },
  precoDesconto:  { color: '#10b981', fontSize: '18px', fontWeight: 'bold' },
  comissao:       { color: '#f59e0b', fontSize: '11px', margin: '6px 0 0' },
  acoes:          { display: 'flex', gap: '8px', padding: '0 14px 10px' },
  botaoEnviar:    { flex: 1, padding: '10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  botaoDescartar: { flex: 1, padding: '10px', background: '#374151', color: '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  link:           { textAlign: 'center', color: '#6366f1', fontSize: '12px', padding: '10px', textDecoration: 'none' },
  botaoMais:      { background: 'transparent', border: '1px solid #374151', color: '#9ca3af', borderRadius: '8px', padding: '12px 32px', cursor: 'pointer', fontSize: '14px' },
}

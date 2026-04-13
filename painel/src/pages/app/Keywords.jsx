import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import FeatureBloqueada from '../../components/FeatureBloqueada'
import { color, shadow, radius, borda, transition } from '../../theme'

const BUSCAR_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/buscar-ofertas'

const LIMITE_PLAN       = { free: 0, pro: 3, premium: Infinity }
const LIMITE_BUSCA_DIA  = { free: 0, pro: 5, premium: Infinity }

const SORT_OPTIONS = [
  { value: 2, label: 'Mais vendidos' },
  { value: 1, label: 'Relevância' },
  { value: 3, label: 'Menor preço' },
  { value: 4, label: 'Maior preço' },
  { value: 5, label: 'Maior comissão' },
]

export default function Keywords() {
  const { user, profile, temAcesso } = useAuth()
  const [keywords, setKeywords]     = useState([])
  const [novaKeyword, setNova]      = useState('')
  const [novoSort, setNovoSort]     = useState(2)
  const [loading, setLoading]       = useState(true)
  const [salvando, setSalvando]     = useState(false)
  const [buscando, setBuscando]     = useState(false)
  const [resultado, setResultado]   = useState(null)
  const [erro, setErro]             = useState('')
  const [usoBusca, setUsoBusca]     = useState(0)

  const plano       = profile?.plan || 'free'
  const limite      = LIMITE_PLAN[plano] ?? 0
  const limiteBusca = LIMITE_BUSCA_DIA[plano] ?? 0

  useEffect(() => {
    if (temAcesso('pro')) {
      carregarKeywords()
      carregarUso()
    }
  }, [])

  async function carregarUso() {
    const hoje = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('uso_busca')
      .select('quantidade')
      .eq('user_id', user.id)
      .eq('data', hoje)
      .single()
    setUsoBusca(data?.quantidade ?? 0)
  }

  async function carregarKeywords() {
    setLoading(true)
    const { data } = await supabase
      .from('keywords')
      .select('*')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })
    setKeywords(data || [])
    setLoading(false)
  }

  async function adicionarKeyword(e) {
    e.preventDefault()
    const keyword = novaKeyword.trim().toLowerCase()
    if (!keyword) return
    if (keywords.length >= limite) {
      setErro(`Seu plano permite até ${limite} keywords.`)
      return
    }
    if (keywords.some(k => k.keyword === keyword)) {
      setErro(`Keyword "${keyword}" já existe na sua lista.`)
      return
    }
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('keywords').insert({ keyword, user_id: user.id, sort_type: novoSort })
    setSalvando(false)
    if (error) { setErro('Erro ao salvar keyword.'); return }
    setNova('')
    setNovoSort(2)
    carregarKeywords()
  }

  async function toggleAtivo(kw) {
    await supabase.from('keywords').update({ ativo: !kw.ativo }).eq('id', kw.id)
    carregarKeywords()
  }

  async function remover(id) {
    await supabase.from('keywords').delete().eq('id', id)
    carregarKeywords()
  }

  async function buscarAgora() {
    setBuscando(true)
    setResultado(null)
    setErro('')
    try {
      const res = await fetch(BUSCAR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`
        },
        body: JSON.stringify({ user_id: user.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erro || 'Erro desconhecido')
      setResultado(data)
      carregarUso()
    } catch (e) {
      setErro(e.message)
    }
    setBuscando(false)
  }

  if (!temAcesso('pro')) {
    return (
      <FeatureBloqueada plano="pro">
        <div style={{ padding: '8px' }}>
          <h1 style={s.titulo}>Keywords</h1>
          <p style={s.sub}>Gerencie palavras-chave para busca automática de ofertas.</p>
          <div style={s.listaFake}>
            {['tênis nike', 'fone bluetooth', 'smartwatch'].map(k => (
              <div key={k} style={s.itemFake}>
                <span style={{ color: color.textSecondary, fontWeight: '500' }}>{k}</span>
                <span style={{ color: color.success, fontSize: '11px', fontWeight: '600' }}>● ativo</span>
              </div>
            ))}
          </div>
        </div>
      </FeatureBloqueada>
    )
  }

  const ativasCount  = keywords.filter(k => k.ativo).length
  const limiteStr    = limite === Infinity ? '∞' : limite
  const buscaLimStr  = limiteBusca === Infinity ? '∞' : limiteBusca
  const podeBuscar   = !buscando && ativasCount > 0 && usoBusca < limiteBusca
  const barraProgresso = limiteBusca > 0 ? Math.min((usoBusca / limiteBusca) * 100, 100) : 0

  return (
    <div>

      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Keywords</h1>
          <p style={s.sub}>Busca automática a cada hora • {keywords.length}/{limiteStr} keywords</p>
        </div>

        <div style={s.buscarBloco}>
          <button
            onClick={buscarAgora}
            disabled={!podeBuscar}
            style={podeBuscar ? s.botaoBuscar : s.botaoBuscarDisabled}
          >
            {buscando ? (
              <>
                <span style={s.spinner} />
                Buscando...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Buscar agora
              </>
            )}
          </button>
          <div style={s.contadorWrap}>
            <div style={s.barraFundo}>
              <div style={{ ...s.barraPreench, width: `${barraProgresso}%` }} />
            </div>
            <p style={s.contadorTexto}>{usoBusca}/{buscaLimStr} buscas hoje</p>
          </div>
        </div>
      </div>

      {resultado && (
        <div style={s.resultadoBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Busca concluída — <strong>{resultado.novos}</strong> novas ofertas encontradas{resultado.duplicatas > 0 ? `, ${resultado.duplicatas} já existiam` : ''}.</span>
        </div>
      )}
      {erro && (
        <div style={s.erroBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color.danger} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{erro}</span>
        </div>
      )}

      <div style={s.formBloco}>
        <form onSubmit={adicionarKeyword} style={s.form}>
          <input
            type="text"
            placeholder="Ex: tênis nike, fone bluetooth..."
            value={novaKeyword}
            onChange={e => setNova(e.target.value)}
            disabled={keywords.length >= limite}
            style={keywords.length >= limite ? s.inputDisabled : s.input}
          />
          <select
            value={novoSort}
            onChange={e => setNovoSort(Number(e.target.value))}
            disabled={keywords.length >= limite}
            style={keywords.length >= limite ? s.selectDisabled : s.select}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={salvando || keywords.length >= limite || !novaKeyword.trim()}
            style={(salvando || keywords.length >= limite || !novaKeyword.trim()) ? s.botaoAdicionarDisabled : s.botaoAdicionar}
          >
            {salvando ? 'Salvando...' : '+ Adicionar'}
          </button>
        </form>
        {keywords.length >= limite && (
          <p style={s.limiteAviso}>Limite de {limiteStr} keywords atingido para seu plano.</p>
        )}
      </div>

      {loading ? (
        <div style={s.vazioWrap}>
          <p style={s.vazioTexto}>Carregando...</p>
        </div>
      ) : keywords.length === 0 ? (
        <div style={s.vazioWrap}>
          <div style={s.vazioIconeWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color.textDisabled} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <p style={s.vazioTitulo}>Nenhuma keyword ainda</p>
          <p style={s.vazioTexto}>Adicione palavras-chave para buscar ofertas automaticamente.</p>
        </div>
      ) : (
        <div style={s.lista}>
          {keywords.map(kw => {
            const sortLabel = SORT_OPTIONS.find(o => o.value === (kw.sort_type ?? 2))?.label
            return (
              <div key={kw.id} style={s.item}>
                <div style={{ ...s.statusDot, background: kw.ativo ? color.success : color.border }} />

                <div style={s.itemCorpo}>
                  <p style={s.itemKeyword}>{kw.keyword}</p>
                  <div style={s.itemMeta}>
                    <span style={s.metaPill}>{sortLabel}</span>
                    <span style={{ ...s.metaStatus, color: kw.ativo ? color.success : color.textMuted }}>
                      {kw.ativo ? 'ativo' : 'pausado'}
                    </span>
                  </div>
                </div>

                <div style={s.itemAcoes}>
                  <button
                    onClick={() => toggleAtivo(kw)}
                    style={{
                      ...s.botaoToggle,
                      color: kw.ativo ? color.warning : color.success,
                      borderColor: kw.ativo ? color.warning + '55' : color.success + '55',
                    }}
                  >
                    {kw.ativo ? 'Pausar' : 'Ativar'}
                  </button>
                  <button onClick={() => remover(kw.id)} style={s.botaoRemover} title="Remover">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s = {
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' },
  titulo:  { color: color.textPrimary, fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  sub:     { color: color.textMuted, fontSize: '13px' },

  buscarBloco: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' },
  botaoBuscar: {
    display: 'flex', alignItems: 'center',
    background: color.primary, color: color.white,
    border: 'none', borderRadius: radius.md,
    padding: '11px 18px', cursor: 'pointer',
    fontWeight: '700', fontSize: '13px', fontFamily: 'inherit',
    boxShadow: shadow.primary, transition: transition.fast,
  },
  botaoBuscarDisabled: {
    display: 'flex', alignItems: 'center',
    background: color.hover, color: color.textDisabled,
    border: `1px solid #1a2432`, borderRadius: radius.md,
    padding: '11px 18px', cursor: 'not-allowed',
    fontWeight: '700', fontSize: '13px', fontFamily: 'inherit',
  },
  spinner:      { width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', marginRight: '8px', animation: 'spin 0.8s linear infinite' },
  contadorWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', width: '140px' },
  barraFundo:   { width: '100%', height: '3px', background: color.hover, borderRadius: '2px', overflow: 'hidden' },
  barraPreench: { height: '100%', background: color.primary, borderRadius: '2px', transition: 'width 0.3s' },
  contadorTexto:{ color: color.textMuted, fontSize: '11px' },

  resultadoBox: { display: 'flex', alignItems: 'center', gap: '10px', background: color.successMuted, border: borda.success, color: color.success, borderRadius: radius.md, padding: '12px 16px', marginBottom: '20px', fontSize: '13px' },
  erroBox:      { display: 'flex', alignItems: 'center', gap: '10px', background: color.dangerMuted, border: borda.danger, color: color.danger, borderRadius: radius.md, padding: '12px 16px', marginBottom: '20px', fontSize: '13px' },

  formBloco: { background: color.card, border: borda.base, borderRadius: radius.lg, padding: '20px', marginBottom: '20px', boxShadow: shadow.card },
  form:      { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  input:     { flex: 1, minWidth: '160px', background: color.input, border: borda.base, borderRadius: radius.md, padding: '10px 14px', color: color.textPrimary, fontSize: '13px', fontFamily: 'inherit', outline: 'none', transition: transition.fast },
  inputDisabled: { flex: 1, minWidth: '160px', background: color.inputDisabled, border: `1px solid #1a2432`, borderRadius: radius.md, padding: '10px 14px', color: color.textDisabled, fontSize: '13px', fontFamily: 'inherit', cursor: 'not-allowed' },
  select:    { background: color.input, border: borda.base, borderRadius: radius.md, padding: '10px 12px', color: color.textPrimary, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' },
  selectDisabled: { background: color.inputDisabled, border: `1px solid #1a2432`, borderRadius: radius.md, padding: '10px 12px', color: color.textDisabled, fontSize: '13px', cursor: 'not-allowed', fontFamily: 'inherit' },
  botaoAdicionar: { background: color.primary, border: 'none', color: color.white, borderRadius: radius.md, padding: '10px 18px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit', boxShadow: shadow.primary, transition: transition.fast },
  botaoAdicionarDisabled: { background: color.hover, border: `1px solid #1a2432`, color: color.textDisabled, borderRadius: radius.md, padding: '10px 18px', cursor: 'not-allowed', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit' },
  limiteAviso: { color: color.warning, fontSize: '12px', marginTop: '12px' },

  vazioWrap:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px', gap: '12px' },
  vazioIconeWrap:{ width: '64px', height: '64px', background: color.card, border: borda.base, borderRadius: radius.xl, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' },
  vazioTitulo:   { color: color.textSecondary, fontSize: '15px', fontWeight: '600' },
  vazioTexto:    { color: color.textMuted, fontSize: '13px', textAlign: 'center', maxWidth: '280px', lineHeight: '1.5' },

  lista:      { display: 'flex', flexDirection: 'column', gap: '8px' },
  item:       { background: color.card, border: borda.base, borderRadius: radius.lg, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: shadow.card },
  statusDot:  { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  itemCorpo:  { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' },
  itemKeyword:{ color: color.textPrimary, fontSize: '14px', fontWeight: '600' },
  itemMeta:   { display: 'flex', alignItems: 'center', gap: '8px' },
  metaPill:   { background: color.surface, color: color.textMuted, fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: radius.sm, border: borda.base },
  metaStatus: { fontSize: '11px', fontWeight: '600' },
  itemAcoes:  { display: 'flex', gap: '8px', flexShrink: 0 },
  botaoToggle:{ background: 'transparent', border: '1px solid', borderRadius: radius.sm, padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', transition: transition.fast },
  botaoRemover:{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: color.dangerMuted, border: borda.danger, borderRadius: radius.sm, cursor: 'pointer', color: color.danger, transition: transition.fast },

  listaFake:  { display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px', marginTop: '16px' },
  itemFake:   { background: color.card, border: borda.base, borderRadius: radius.md, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
}

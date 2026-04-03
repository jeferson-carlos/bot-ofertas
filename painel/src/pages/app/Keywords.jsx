import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import FeatureBloqueada from '../../components/FeatureBloqueada'

const BUSCAR_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/buscar-ofertas'

const LIMITE_PLAN = { free: 0, pro: 3, premium: Infinity }

export default function Keywords() {
  const { user, profile, temAcesso } = useAuth()
  const [keywords, setKeywords]     = useState([])
  const [novaKeyword, setNova]      = useState('')
  const [loading, setLoading]       = useState(true)
  const [salvando, setSalvando]     = useState(false)
  const [buscando, setBuscando]     = useState(false)
  const [resultado, setResultado]   = useState(null)
  const [erro, setErro]             = useState('')

  const plano  = profile?.plan || 'free'
  const limite = LIMITE_PLAN[plano] ?? 0

  useEffect(() => { if (temAcesso('pro')) carregarKeywords() }, [])

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
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('keywords').insert({ keyword, user_id: user.id })
    setSalvando(false)
    if (error) { setErro('Erro ao salvar keyword.'); return }
    setNova('')
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
    } catch (e) {
      setErro(e.message)
    }
    setBuscando(false)
  }

  if (!temAcesso('pro')) {
    return (
      <FeatureBloqueada plano="pro">
        <div style={{ padding: '8px' }}>
          <h1 style={styles.titulo}>Keywords</h1>
          <p style={styles.sub}>Gerencie palavras-chave para busca automática de ofertas.</p>
          <div style={styles.listaFake}>
            {['tênis nike', 'fone bluetooth', 'smartwatch'].map(k => (
              <div key={k} style={styles.itemFake}>
                <span>{k}</span>
                <span style={{ color: '#10b981', fontSize: '11px' }}>● ativo</span>
              </div>
            ))}
          </div>
        </div>
      </FeatureBloqueada>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Keywords</h1>
          <p style={styles.sub}>
            {keywords.length}/{limite === Infinity ? '∞' : limite} keywords — busca automática a cada hora
          </p>
        </div>
        <button
          onClick={buscarAgora}
          disabled={buscando || keywords.filter(k => k.ativo).length === 0}
          style={{
            ...styles.botaoBuscar,
            opacity: (buscando || keywords.filter(k => k.ativo).length === 0) ? 0.5 : 1
          }}
        >
          {buscando ? '⏳ Buscando...' : '⚡ Buscar agora'}
        </button>
      </div>

      {/* Resultado da busca */}
      {resultado && (
        <div style={styles.resultado}>
          ✅ Busca concluída — <strong>{resultado.novos}</strong> novas ofertas encontradas
          {resultado.duplicatas > 0 && `, ${resultado.duplicatas} já existiam`}.
        </div>
      )}

      {erro && <div style={styles.erroBox}>{erro}</div>}

      {/* Form adicionar */}
      <form onSubmit={adicionarKeyword} style={styles.form}>
        <input
          type="text"
          placeholder="Ex: tênis nike, fone bluetooth..."
          value={novaKeyword}
          onChange={e => setNova(e.target.value)}
          disabled={keywords.length >= limite}
          style={{
            ...styles.input,
            opacity: keywords.length >= limite ? 0.5 : 1
          }}
        />
        <button
          type="submit"
          disabled={salvando || keywords.length >= limite || !novaKeyword.trim()}
          style={styles.botaoAdicionar}
        >
          {salvando ? 'Salvando...' : '+ Adicionar'}
        </button>
      </form>

      {/* Lista */}
      {loading ? (
        <p style={styles.vazio}>Carregando...</p>
      ) : keywords.length === 0 ? (
        <p style={styles.vazio}>Nenhuma keyword cadastrada. Adicione uma acima.</p>
      ) : (
        <div style={styles.lista}>
          {keywords.map(kw => (
            <div key={kw.id} style={styles.item}>
              <div style={styles.itemEsq}>
                <span style={styles.itemKeyword}>{kw.keyword}</span>
                <span style={{ ...styles.itemStatus, color: kw.ativo ? '#10b981' : '#6b7280' }}>
                  ● {kw.ativo ? 'ativo' : 'pausado'}
                </span>
              </div>
              <div style={styles.itemAcoes}>
                <button onClick={() => toggleAtivo(kw)} style={styles.botaoToggle}>
                  {kw.ativo ? 'Pausar' : 'Ativar'}
                </button>
                <button onClick={() => remover(kw.id)} style={styles.botaoRemover}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titulo:         { color: '#e2e8f0', fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px' },
  sub:            { color: '#6b7280', fontSize: '13px', margin: 0 },
  botaoBuscar:    { background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  resultado:      { background: '#052e16', border: '1px solid #10b981', color: '#10b981', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', fontSize: '14px' },
  erroBox:        { background: '#450a0a', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', fontSize: '14px' },
  form:           { display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' },
  input:          { flex: 1, minWidth: '200px', background: '#1e293b', border: '1px solid #374151', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '14px' },
  botaoAdicionar: { background: '#1e293b', border: '1px solid #6366f1', color: '#6366f1', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  vazio:          { textAlign: 'center', color: '#6b7280', marginTop: '40px' },
  lista:          { display: 'flex', flexDirection: 'column', gap: '10px' },
  item:           { background: '#1e293b', border: '1px solid #374151', borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  itemEsq:        { display: 'flex', alignItems: 'center', gap: '12px' },
  itemKeyword:    { color: '#e2e8f0', fontSize: '14px', fontWeight: '500' },
  itemStatus:     { fontSize: '11px', fontWeight: 'bold' },
  itemAcoes:      { display: 'flex', gap: '8px' },
  botaoToggle:    { background: 'transparent', border: '1px solid #374151', color: '#9ca3af', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' },
  botaoRemover:   { background: 'transparent', border: '1px solid #374151', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', fontSize: '12px' },
  listaFake:      { display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' },
  itemFake:       { background: '#1e293b', border: '1px solid #374151', borderRadius: '10px', padding: '14px 16px', color: '#9ca3af', fontSize: '14px', display: 'flex', justifyContent: 'space-between' },
}

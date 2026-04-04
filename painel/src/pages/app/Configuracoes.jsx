import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

const CAMPO_VAZIO = {
  telegram_bot_token: '',
  telegram_chat_id:   '',
  shopee_app_id:      '',
  shopee_secret:      '',
}

export default function Configuracoes() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]         = useState(CAMPO_VAZIO)
  const [loading, setLoading]   = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo]       = useState(false)
  const [erro, setErro]         = useState('')
  const [testando, setTestando] = useState(false)
  const [testeOk, setTesteOk]   = useState('')
  const [testeErro, setTesteErro] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await supabase
      .from('profiles')
      .select('telegram_bot_token, telegram_chat_id, shopee_app_id, shopee_secret')
      .eq('id', user.id)
      .single()

    if (data) {
      setForm({
        telegram_bot_token: data.telegram_bot_token || '',
        telegram_chat_id:   data.telegram_chat_id   || '',
        shopee_app_id:      data.shopee_app_id       || '',
        shopee_secret:      data.shopee_secret       || '',
      })
    }
    setLoading(false)
  }

  function atualizar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
    setSalvo(false)
    setErro('')
    setTesteOk('')
    setTesteErro('')
  }

  function validarFormato() {
    const token  = form.telegram_bot_token.trim()
    const chatId = form.telegram_chat_id.trim()
    const appId  = form.shopee_app_id.trim()
    if (token && !/^\d+:[\w-]{30,}$/.test(token))
      return 'Token Telegram inválido. Formato esperado: 123456789:ABCdef...'
    if (chatId && !/^-?\d+$|^@\w+$/.test(chatId))
      return 'Chat ID inválido. Use formato numérico (-100123...) ou @username.'
    if (appId && !/^\d+$/.test(appId))
      return 'App ID Shopee inválido. Deve conter apenas números.'
    return null
  }

  async function testarTelegram() {
    const token  = form.telegram_bot_token.trim()
    const chatId = form.telegram_chat_id.trim()
    if (!token || !chatId) {
      setTesteErro('Preencha o Token e o Chat ID antes de testar.')
      return
    }
    setTestando(true)
    setTesteOk('')
    setTesteErro('')
    try {
      const r1 = await fetch(`https://api.telegram.org/bot${token}/getMe`)
      const d1 = await r1.json()
      if (!d1.ok) throw new Error('Token inválido. Verifique e tente novamente.')

      const r2 = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`)
      const d2 = await r2.json()
      if (!d2.ok) throw new Error('Canal/grupo não encontrado. Verifique o Chat ID.')

      setTesteOk(`Bot @${d1.result.username} conectado ao canal "${d2.result.title || d2.result.username || chatId}"`)
    } catch (e) {
      setTesteErro(e.message)
    }
    setTestando(false)
  }

  async function salvar(e) {
    e.preventDefault()
    const erroFormato = validarFormato()
    if (erroFormato) { setErro(erroFormato); return }
    setSalvando(true)
    setErro('')
    setSalvo(false)

    const { error } = await supabase
      .from('profiles')
      .update({
        telegram_bot_token: form.telegram_bot_token.trim() || null,
        telegram_chat_id:   form.telegram_chat_id.trim()   || null,
        shopee_app_id:      form.shopee_app_id.trim()       || null,
        shopee_secret:      form.shopee_secret.trim()       || null,
      })
      .eq('id', user.id)

    if (error) setErro('Erro ao salvar. Tente novamente.')
    else setSalvo(true)

    setSalvando(false)
  }

  const telegramOk = form.telegram_bot_token && form.telegram_chat_id
  const shopeeOk   = form.shopee_app_id && form.shopee_secret

  return (
    <div>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Configurações</h1>
          <p style={s.subtitulo}>Credenciais do seu bot Telegram e conta Shopee Afiliados</p>
        </div>
        <button onClick={() => navigate('/app/tutorial')} style={s.tutorialLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Como obter os dados?
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#64748b', fontSize: '14px' }}>Carregando...</p>
      ) : (
        <form onSubmit={salvar} style={s.form}>

          {/* Bloco Telegram */}
          <div style={s.bloco}>
            <div style={s.blocoHeader}>
              <div style={{ ...s.blocoIcone, background: 'rgba(99,102,241,0.1)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <div>
                <p style={s.blocoTitulo}>Telegram</p>
                <p style={s.blocoSub}>Bot para publicar ofertas no seu canal</p>
              </div>
              <div style={{ ...s.statusPill, background: telegramOk ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', color: telegramOk ? '#22c55e' : '#64748b' }}>
                {telegramOk ? '● Configurado' : '○ Pendente'}
              </div>
            </div>

            <div style={s.campos}>
              <div style={s.campoGrupo}>
                <label style={s.label}>Token do Bot</label>
                <input
                  type="text"
                  placeholder="123456789:ABCdefGHIjklMNO..."
                  value={form.telegram_bot_token}
                  onChange={e => atualizar('telegram_bot_token', e.target.value)}
                  style={s.input}
                />
                <p style={s.dica}>Obtido no @BotFather ao criar seu bot</p>
              </div>
              <div style={s.campoGrupo}>
                <label style={s.label}>Chat ID / Canal</label>
                <input
                  type="text"
                  placeholder="-1001234567890 ou @meucanal"
                  value={form.telegram_chat_id}
                  onChange={e => atualizar('telegram_chat_id', e.target.value)}
                  style={s.input}
                />
                <p style={s.dica}>ID numérico do grupo/canal ou @username público</p>
              </div>
            </div>
          </div>

          {/* Teste de conexão Telegram */}
          <div style={s.testeWrap}>
            <button type="button" onClick={testarTelegram} disabled={testando} style={s.botaoTestar}>
              {testando ? 'Testando...' : 'Testar conexão Telegram'}
            </button>
            {testeOk  && <span style={s.testeSucesso}>{testeOk}</span>}
            {testeErro && <span style={s.testeErro}>{testeErro}</span>}
          </div>

          {/* Bloco Shopee */}
          <div style={s.bloco}>
            <div style={s.blocoHeader}>
              <div style={{ ...s.blocoIcone, background: 'rgba(245,158,11,0.1)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              </div>
              <div>
                <p style={s.blocoTitulo}>Shopee Afiliados</p>
                <p style={s.blocoSub}>Credenciais para gerar links com sua comissão</p>
              </div>
              <div style={{ ...s.statusPill, background: shopeeOk ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', color: shopeeOk ? '#22c55e' : '#64748b' }}>
                {shopeeOk ? '● Configurado' : '○ Pendente'}
              </div>
            </div>

            <div style={s.campos}>
              <div style={s.campoGrupo}>
                <label style={s.label}>App ID</label>
                <input
                  type="text"
                  placeholder="123456789"
                  value={form.shopee_app_id}
                  onChange={e => atualizar('shopee_app_id', e.target.value)}
                  style={s.input}
                />
                <p style={s.dica}>Disponível no portal Shopee Afiliados → API</p>
              </div>
              <div style={s.campoGrupo}>
                <label style={s.label}>Secret Key</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={form.shopee_secret}
                  onChange={e => atualizar('shopee_secret', e.target.value)}
                  style={s.input}
                />
                <p style={s.dica}>Chave secreta gerada junto com o App ID</p>
              </div>
            </div>
          </div>

          {/* Feedback e botão */}
          {erro && <p style={s.erroTexto}>{erro}</p>}
          {salvo && (
            <div style={s.sucessoBox}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Configurações salvas com sucesso!
            </div>
          )}

          <div style={s.rodape}>
            <p style={s.rodapeNota}>
              Suas credenciais ficam protegidas e acessíveis apenas por você.
            </p>
            <button type="submit" disabled={salvando} style={{ ...s.botaoSalvar, opacity: salvando ? 0.6 : 1 }}>
              {salvando ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>

        </form>
      )}
    </div>
  )
}

const s = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  titulo:       { color: '#f1f5f9', fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  subtitulo:    { color: '#64748b', fontSize: '13px' },
  tutorialLink: { display: 'flex', alignItems: 'center', background: 'transparent', border: '1px solid #1e293b', color: '#64748b', borderRadius: '8px', padding: '9px 14px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' },

  form:         { display: 'flex', flexDirection: 'column', gap: '20px' },

  bloco:        { background: '#111827', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' },
  blocoHeader:  { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' },
  blocoIcone:   { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  blocoTitulo:  { color: '#e2e8f0', fontSize: '15px', fontWeight: '700', marginBottom: '2px' },
  blocoSub:     { color: '#64748b', fontSize: '12px' },
  statusPill:   { marginLeft: 'auto', fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '100px' },

  campos:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  campoGrupo:   { display: 'flex', flexDirection: 'column', gap: '6px' },
  label:        { color: '#94a3b8', fontSize: '12px', fontWeight: '600' },
  input:        { background: '#0f1117', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  dica:         { color: '#475569', fontSize: '11px', lineHeight: '1.4' },

  testeWrap:    { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '-4px' },
  botaoTestar:  { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', flexShrink: 0 },
  testeSucesso: { color: '#22c55e', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
  testeErro:    { color: '#ef4444', fontSize: '12px' },

  erroTexto:    { color: '#ef4444', fontSize: '13px' },
  sucessoBox:   { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', borderRadius: '10px', padding: '12px 16px', fontSize: '13px' },

  rodape:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  rodapeNota:   { color: '#374151', fontSize: '12px' },
  botaoSalvar:  { background: '#6366f1', border: 'none', color: '#fff', borderRadius: '10px', padding: '11px 24px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit', flexShrink: 0 },
}

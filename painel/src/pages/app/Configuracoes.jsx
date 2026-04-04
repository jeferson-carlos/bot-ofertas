import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

const CAMPOS_VAZIO = {
  telegram_bot_token: '',
  telegram_chat_id:   '',
  shopee_app_id:      '',
  shopee_secret:      '',
  telegram_template:  '',
}

const TEMPLATE_PADRAO =
  '🔥 *OFERTA SHOPEE*\n\n' +
  '📦 {titulo}\n\n' +
  '🏪 Loja: {loja}\n' +
  '💰 De: ~R$ {preco_original}~\n' +
  '✅ Por: *R$ {preco}*\n' +
  '📉 Desconto: *{desconto}% OFF*\n\n' +
  '🛒 [Comprar agora]({link})'

const VARIAVEIS = ['{titulo}', '{preco}', '{preco_original}', '{desconto}', '{loja}', '{link}']

const OFERTA_EXEMPLO = {
  titulo:        'Fone de Ouvido Bluetooth Premium',
  preco:         '89.90',
  preco_original:'149.90',
  desconto:      '40',
  loja:          'TechStore Oficial',
  link:          'https://s.shopee.com.br/exemplo',
}

function previsualizarTemplate(template) {
  let t = template || TEMPLATE_PADRAO
  return t
    .replace(/{titulo}/g,        OFERTA_EXEMPLO.titulo)
    .replace(/{preco}/g,         OFERTA_EXEMPLO.preco)
    .replace(/{preco_original}/g, OFERTA_EXEMPLO.preco_original)
    .replace(/{desconto}/g,      OFERTA_EXEMPLO.desconto)
    .replace(/{loja}/g,          OFERTA_EXEMPLO.loja)
    .replace(/{link}/g,          OFERTA_EXEMPLO.link)
    // Simular markdown visualmente
    .replace(/\*([^*]+)\*/g,     '<strong>$1</strong>')
    .replace(/~([^~]+)~/g,       '<del>$1</del>')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '<a style="color:#6366f1">$1</a>')
}

export default function Configuracoes() {
  const { user, temAcesso } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]         = useState(CAMPOS_VAZIO)
  const [blacklist, setBlacklist] = useState([])
  const [novoTermo, setNovoTermo] = useState('')
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
      .select('telegram_bot_token, telegram_chat_id, shopee_app_id, shopee_secret, telegram_template, blacklist_termos')
      .eq('id', user.id)
      .single()

    if (data) {
      setForm({
        telegram_bot_token: data.telegram_bot_token || '',
        telegram_chat_id:   data.telegram_chat_id   || '',
        shopee_app_id:      data.shopee_app_id       || '',
        shopee_secret:      data.shopee_secret       || '',
        telegram_template:  data.telegram_template   || '',
      })
      setBlacklist(data.blacklist_termos || [])
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

  function adicionarTermo() {
    const termo = novoTermo.trim()
    if (!termo || blacklist.includes(termo)) { setNovoTermo(''); return }
    setBlacklist(prev => [...prev, termo])
    setNovoTermo('')
    setSalvo(false)
  }

  function removerTermo(termo) {
    setBlacklist(prev => prev.filter(t => t !== termo))
    setSalvo(false)
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
    if (!token || !chatId) { setTesteErro('Preencha o Token e o Chat ID antes de testar.'); return }
    setTestando(true); setTesteOk(''); setTesteErro('')
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
    setSalvando(true); setErro(''); setSalvo(false)

    const { error } = await supabase
      .from('profiles')
      .update({
        telegram_bot_token: form.telegram_bot_token.trim() || null,
        telegram_chat_id:   form.telegram_chat_id.trim()   || null,
        shopee_app_id:      form.shopee_app_id.trim()       || null,
        shopee_secret:      form.shopee_secret.trim()       || null,
        telegram_template:  form.telegram_template.trim()   || null,
        blacklist_termos:   blacklist,
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
            {testeOk   && <span style={s.testeSucesso}>{testeOk}</span>}
            {testeErro && <span style={s.testeErro}>{testeErro}</span>}
          </div>

          {/* Template de mensagem — Pro/Premium */}
          {temAcesso('pro') && (
            <div style={s.bloco}>
              <div style={s.blocoHeader}>
                <div style={{ ...s.blocoIcone, background: 'rgba(99,102,241,0.08)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <div>
                  <p style={s.blocoTitulo}>Template da mensagem</p>
                  <p style={s.blocoSub}>Personalize o texto enviado ao Telegram</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
                <div>
                  <label style={s.label}>Variáveis disponíveis</label>
                  <div style={s.variaveisWrap}>
                    {VARIAVEIS.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => atualizar('telegram_template',
                          (form.telegram_template || TEMPLATE_PADRAO) + v
                        )}
                        style={s.variavelPill}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={form.telegram_template}
                    onChange={e => atualizar('telegram_template', e.target.value)}
                    placeholder={TEMPLATE_PADRAO}
                    rows={10}
                    style={s.textarea}
                  />
                  <p style={s.dica}>Deixe em branco para usar o template padrão</p>
                  {form.telegram_template && (
                    <button
                      type="button"
                      onClick={() => atualizar('telegram_template', '')}
                      style={{ ...s.botaoTestar, marginTop: '8px', fontSize: '11px', padding: '6px 12px' }}
                    >
                      Restaurar padrão
                    </button>
                  )}
                </div>
                <div>
                  <label style={s.label}>Preview</label>
                  <div
                    style={s.preview}
                    dangerouslySetInnerHTML={{ __html: previsualizarTemplate(form.telegram_template).replace(/\n/g, '<br/>') }}
                  />
                  <p style={s.dica}>Simulação com oferta de exemplo</p>
                </div>
              </div>
            </div>
          )}

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

          {/* Blacklist */}
          <div style={s.bloco}>
            <div style={s.blocoHeader}>
              <div style={{ ...s.blocoIcone, background: 'rgba(239,68,68,0.1)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
              </div>
              <div>
                <p style={s.blocoTitulo}>Blacklist</p>
                <p style={s.blocoSub}>Palavras ou lojas para ignorar ao coletar ofertas</p>
              </div>
            </div>

            <div style={s.blacklistInput}>
              <input
                type="text"
                placeholder="ex: AliExpress, patrocinado, replica..."
                value={novoTermo}
                onChange={e => setNovoTermo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionarTermo())}
                style={{ ...s.input, flex: 1 }}
              />
              <button type="button" onClick={adicionarTermo} style={s.botaoAdicionarTermo}>
                Adicionar
              </button>
            </div>

            {blacklist.length > 0 ? (
              <div style={s.termosWrap}>
                {blacklist.map(termo => (
                  <div key={termo} style={s.termoPill}>
                    <span>{termo}</span>
                    <button
                      type="button"
                      onClick={() => removerTermo(termo)}
                      style={s.termoRemover}
                    >✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={s.dica}>Nenhum termo bloqueado. Ofertas com esses termos no título ou loja serão ignoradas.</p>
            )}
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
            <p style={s.rodapeNota}>Suas credenciais ficam protegidas e acessíveis apenas por você.</p>
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
  dica:         { color: '#475569', fontSize: '11px', lineHeight: '1.4', marginTop: '4px' },

  testeWrap:    { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '-4px' },
  botaoTestar:  { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', flexShrink: 0 },
  testeSucesso: { color: '#22c55e', fontSize: '12px' },
  testeErro:    { color: '#ef4444', fontSize: '12px' },

  variaveisWrap:{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' },
  variavelPill: { background: '#1e293b', border: '1px solid #334155', color: '#818cf8', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'monospace' },
  textarea:     { background: '#0f1117', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace', width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: '1.6' },
  preview:      { background: '#0f1117', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', color: '#cbd5e1', fontSize: '12px', lineHeight: '1.8', fontFamily: 'monospace', minHeight: '180px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },

  blacklistInput:  { display: 'flex', gap: '10px', marginBottom: '14px' },
  botaoAdicionarTermo: { background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' },
  termosWrap:      { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  termoPill:       { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: '500' },
  termoRemover:    { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '12px', lineHeight: 1, display: 'flex', alignItems: 'center' },

  erroTexto:    { color: '#ef4444', fontSize: '13px' },
  sucessoBox:   { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', borderRadius: '10px', padding: '12px 16px', fontSize: '13px' },

  rodape:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  rodapeNota:   { color: '#374151', fontSize: '12px' },
  botaoSalvar:  { background: '#6366f1', border: 'none', color: '#fff', borderRadius: '10px', padding: '11px 24px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit', flexShrink: 0 },
}

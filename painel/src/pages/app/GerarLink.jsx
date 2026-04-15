import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { color, shadow, radius, transition } from '../../theme'

const GERAR_LINK_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/gerar-link'

const URL_SHOPEE = /^https?:\/\/(www\.)?(shopee\.com\.br|shp\.ee|s\.shopee\.com\.br)/i

const TEMPLATE_PADRAO =
  "🔥 *OFERTA SHOPEE*\n\n" +
  "📦 {titulo}\n\n" +
  "🏪 Loja: {loja}\n" +
  "💰 De: ~R$ {preco_original}~\n" +
  "✅ Por: *R$ {preco}*\n" +
  "📉 Desconto: *{desconto}% OFF*\n\n" +
  "🛒 [Comprar agora]({link})"

export default function GerarLink() {
  const { user } = useAuth()

  const [url,           setUrl]           = useState('')
  const [titulo,        setTitulo]        = useState('')
  const [preco,         setPreco]         = useState('')
  const [precoOriginal, setPrecoOriginal] = useState('')
  const [desconto,      setDesconto]      = useState('')
  const [loja,          setLoja]          = useState('')
  const [linkGerado,    setLinkGerado]    = useState(null)
  const [carregando,    setCarregando]    = useState(false)
  const [enviando,      setEnviando]      = useState(false)
  const [erro,          setErro]          = useState(null)
  const [copiado,       setCopiado]       = useState(false)
  const [enviado,       setEnviado]       = useState(false)

  function handleUrlChange(e) {
    setUrl(e.target.value)
    setLinkGerado(null)
    setErro(null)
    setCopiado(false)
    setEnviado(false)
  }

  function gerarPrevia(link) {
    return TEMPLATE_PADRAO
      .replace(/{titulo}/g,         titulo        || '(descrição do produto)')
      .replace(/{preco}/g,          preco         || '0,00')
      .replace(/{preco_original}/g, precoOriginal || '0,00')
      .replace(/{desconto}/g,       desconto      || '0')
      .replace(/{loja}/g,           loja          || 'Shopee')
      .replace(/{link}/g,           link          || '(link rastreável)')
  }

  function fetchLink(acao) {
    return fetch(GERAR_LINK_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`
      },
      body: JSON.stringify({
        url:           url.trim(),
        titulo:        titulo.trim(),
        preco:         preco.trim(),
        precoOriginal: precoOriginal.trim(),
        desconto:      desconto.trim(),
        loja:          loja.trim(),
        acao,
        user_id: user.id,
      })
    })
  }

  async function handleGerar() {
    setErro(null)
    setLinkGerado(null)
    setCopiado(false)
    setEnviado(false)

    if (!URL_SHOPEE.test(url.trim())) {
      setErro('URL inválida. Informe um link válido da Shopee (shopee.com.br).')
      return
    }

    setCarregando(true)
    try {
      const res  = await fetchLink('gerar')
      const data = await res.json()
      if (data.ok) setLinkGerado(data.link)
      else         setErro(data.erro || 'Erro ao gerar link.')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(linkGerado)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setErro('Não foi possível copiar. Selecione e copie manualmente.')
    }
  }

  async function handleEnviar() {
    setErro(null)
    setEnviado(false)
    setEnviando(true)
    try {
      const res  = await fetchLink('enviar')
      const data = await res.json()
      if (data.ok) {
        setEnviado(true)
        setTimeout(() => setEnviado(false), 3000)
      } else {
        setErro(data.erro || 'Erro ao enviar no Telegram.')
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const podeGerar = url.trim().length > 0 && !carregando
  const previa    = gerarPrevia(linkGerado)

  return (
    <div style={s.page}>

      {/* Cabeçalho */}
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Gerar Link Rastreável</h1>
          <p style={s.subtitulo}>Cole a URL de um produto da Shopee, preencha os dados e gere seu link de afiliado personalizado.</p>
        </div>
      </div>

      {/* Layout duas colunas */}
      <div style={s.grid}>

        {/* Coluna esquerda — formulário */}
        <div style={s.colForm}>

          {/* URL */}
          <div style={s.card}>
            <p style={s.cardTitulo}>Link do produto</p>
            <div style={s.inputRow}>
              <input
                type="url"
                placeholder="https://shopee.com.br/produto-i.123456.789012"
                value={url}
                onChange={handleUrlChange}
                onKeyDown={e => e.key === 'Enter' && podeGerar && handleGerar()}
                style={s.input}
              />
              <button
                onClick={handleGerar}
                disabled={!podeGerar}
                style={{ ...s.btnGerar, ...(podeGerar ? {} : s.btnDesabilitado) }}
              >
                {carregando ? <span style={s.spinner} /> : 'Gerar Link'}
              </button>
            </div>
            {erro && <p style={s.erro}>{erro}</p>}
          </div>

          {/* Dados do produto */}
          <div style={s.card}>
            <div style={s.cardHeaderRow}>
              <p style={s.cardTitulo}>Dados do produto <span style={s.badge}>opcional</span></p>
            </div>

            {/* Disclaimer */}
            <div style={s.disclaimer}>
              <span style={s.disclaimerIcon}>ℹ️</span>
              <span style={s.disclaimerTexto}>
                Todos os dados abaixo estão disponíveis na <strong>página do produto</strong> na Shopee: título, preço atual, preço original, desconto e nome da loja.
              </span>
            </div>

            <div style={s.campoGrupo}>
              <label style={s.label}>Descrição / título</label>
              <input
                type="text"
                placeholder="Ex: Fone Bluetooth JBL Tune 510BT"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                style={s.inputFull}
              />
            </div>

            <div style={s.gridTres}>
              <div style={s.campoGrupo}>
                <label style={s.label}>Preço com desconto (R$)</label>
                <input
                  type="text"
                  placeholder="Ex: 149,90"
                  value={preco}
                  onChange={e => setPreco(e.target.value)}
                  style={s.input}
                />
              </div>
              <div style={s.campoGrupo}>
                <label style={s.label}>Preço original (R$)</label>
                <input
                  type="text"
                  placeholder="Ex: 299,90"
                  value={precoOriginal}
                  onChange={e => setPrecoOriginal(e.target.value)}
                  style={s.input}
                />
              </div>
              <div style={s.campoGrupo}>
                <label style={s.label}>Desconto (%)</label>
                <input
                  type="text"
                  placeholder="Ex: 50"
                  value={desconto}
                  onChange={e => setDesconto(e.target.value)}
                  style={s.input}
                />
              </div>
            </div>

            <div style={s.campoGrupo}>
              <label style={s.label}>Loja</label>
              <input
                type="text"
                placeholder="Ex: Loja Oficial JBL"
                value={loja}
                onChange={e => setLoja(e.target.value)}
                style={s.inputFull}
              />
            </div>
          </div>

          {/* Resultado — link gerado + ações */}
          {linkGerado && (
            <div style={s.card}>
              <p style={s.cardTitulo}>Link rastreável gerado</p>
              <div style={s.linkBox}>
                <span style={s.linkTexto}>{linkGerado}</span>
              </div>
              <div style={s.acoes}>
                <button onClick={handleCopiar} style={s.btnCopiar}>
                  {copiado ? '✓ Copiado!' : 'Copiar link'}
                </button>
                <button
                  onClick={handleEnviar}
                  disabled={enviando}
                  style={{ ...s.btnEnviar, ...(enviando ? s.btnDesabilitado : {}) }}
                >
                  {enviando ? (
                    <><span style={s.spinnerSm} /> Enviando...</>
                  ) : enviado ? '✓ Enviado!' : 'Enviar no Telegram'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita — prévia */}
        <div style={s.colPrevia}>
          <div style={{ ...s.card, position: 'sticky', top: '24px' }}>
            <div style={s.previaHeader}>
              <p style={s.cardTitulo}>Prévia da mensagem</p>
              <span style={s.previaStatus}>
                {linkGerado ? '🟢 Link inserido' : '⏳ Aguardando link'}
              </span>
            </div>
            <textarea
              readOnly
              value={previa}
              style={s.previa}
            />
            <p style={s.previaHint}>
              {linkGerado
                ? 'O link rastreável já está inserido na prévia acima.'
                : 'Preencha os dados e clique em "Gerar Link" para ver a prévia completa.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

const s = {
  page: {
    padding: '32px 28px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '28px',
  },
  titulo: {
    fontSize: '22px',
    fontWeight: '700',
    color: color.textPrimary,
    margin: '0 0 6px',
  },
  subtitulo: {
    fontSize: '14px',
    color: color.textSecondary,
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 420px',
    gap: '24px',
    alignItems: 'start',
  },
  colForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  colPrevia: {
    display: 'flex',
    flexDirection: 'column',
  },
  card: {
    background: color.card,
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    padding: '24px',
    boxShadow: shadow.card,
  },
  cardTitulo: {
    fontSize: '14px',
    fontWeight: '600',
    color: color.textPrimary,
    margin: '0 0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'rgba(148,163,184,0.7)',
    background: 'rgba(148,163,184,0.10)',
    border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: '4px',
    padding: '2px 7px',
    letterSpacing: '0.3px',
  },
  disclaimer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    background: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.20)',
    borderRadius: radius.md,
    padding: '12px 14px',
    marginBottom: '20px',
  },
  disclaimerIcon: {
    fontSize: '15px',
    flexShrink: 0,
    marginTop: '1px',
  },
  disclaimerTexto: {
    fontSize: '13px',
    color: '#a5b4fc',
    lineHeight: '1.5',
  },
  campoGrupo: {
    marginBottom: '14px',
  },
  gridTres: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: color.textSecondary,
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  labelOpcional: {
    fontSize: '12px',
    fontWeight: '400',
    color: 'rgba(148,163,184,0.55)',
    textTransform: 'none',
    letterSpacing: 0,
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 14px',
    background: color.input,
    border: `1px solid ${color.border}`,
    borderRadius: radius.md,
    color: color.textPrimary,
    fontSize: '14px',
    outline: 'none',
    transition: transition.fast,
    minWidth: 0,
  },
  inputFull: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 14px',
    background: color.input,
    border: `1px solid ${color.border}`,
    borderRadius: radius.md,
    color: color.textPrimary,
    fontSize: '14px',
    outline: 'none',
    transition: transition.fast,
  },
  btnGerar: {
    padding: '11px 22px',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: transition.fast,
    flexShrink: 0,
  },
  btnDesabilitado: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  spinnerSm: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  erro: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#f87171',
    margin: '12px 0 0',
  },
  previaHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0',
  },
  previaStatus: {
    fontSize: '12px',
    color: 'rgba(148,163,184,0.6)',
    marginBottom: '16px',
  },
  previa: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '220px',
    padding: '14px 16px',
    background: 'rgba(0,0,0,0.30)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: radius.md,
    color: '#cbd5e1',
    fontSize: '14px',
    fontFamily: 'monospace',
    lineHeight: '1.7',
    resize: 'vertical',
    outline: 'none',
    cursor: 'default',
  },
  previaHint: {
    fontSize: '12px',
    color: 'rgba(148,163,184,0.45)',
    margin: '10px 0 0',
    lineHeight: '1.4',
  },
  linkBox: {
    background: color.input,
    border: `1px solid ${color.primaryBorder}`,
    borderRadius: radius.md,
    padding: '12px 14px',
    wordBreak: 'break-all',
    marginBottom: '16px',
  },
  linkTexto: {
    fontSize: '13px',
    color: '#a5b4fc',
    fontFamily: 'monospace',
  },
  acoes: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  btnCopiar: {
    padding: '10px 20px',
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(99,102,241,0.30)',
    borderRadius: radius.md,
    color: '#a5b4fc',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: transition.fast,
  },
  btnEnviar: {
    padding: '10px 20px',
    background: '#6366f1',
    border: 'none',
    borderRadius: radius.md,
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: transition.fast,
  },
}

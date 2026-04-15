import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { color, shadow, radius, transition } from '../../theme'

const GERAR_LINK_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/gerar-link'

const URL_SHOPEE = /^https?:\/\/(www\.)?(shopee\.com\.br|shp\.ee|s\.shopee\.com\.br)/i

export default function GerarLink() {
  const { user } = useAuth()

  const [url,        setUrl]        = useState('')
  const [titulo,     setTitulo]     = useState('')
  const [linkGerado, setLinkGerado] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [enviando,   setEnviando]   = useState(false)
  const [erro,       setErro]       = useState(null)
  const [copiado,    setCopiado]    = useState(false)
  const [enviado,    setEnviado]    = useState(false)

  function handleUrlChange(e) {
    setUrl(e.target.value)
    setLinkGerado(null)
    setErro(null)
    setCopiado(false)
    setEnviado(false)
  }

  function fetchLink(acao) {
    return fetch(GERAR_LINK_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`
      },
      body: JSON.stringify({ url: url.trim(), titulo: titulo.trim(), acao, user_id: user.id })
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
      if (data.ok) {
        setLinkGerado(data.link)
      } else {
        setErro(data.erro || 'Erro ao gerar link.')
      }
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

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.titulo}>Gerar Link Rastreável</h1>
        <p style={s.subtitulo}>Cole a URL de um produto da Shopee e gere seu link de afiliado personalizado.</p>
      </div>

      <div style={s.card}>
        <label style={s.label}>URL do produto Shopee</label>
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
            {carregando ? (
              <span style={s.spinner} />
            ) : 'Gerar Link'}
          </button>
        </div>

        <label style={{ ...s.label, marginTop: '16px' }}>Descrição do produto <span style={s.labelOpcional}>(opcional)</span></label>
        <input
          type="text"
          placeholder="Ex: Fone Bluetooth JBL Tune 510BT"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          style={s.input}
        />

        {erro && (
          <p style={s.erro}>{erro}</p>
        )}

        {linkGerado && (
          <div style={s.resultado}>
            <label style={s.labelResultado}>Seu link rastreável</label>
            <div style={s.linkBox}>
              <span style={s.linkTexto}>{linkGerado}</span>
            </div>
            <div style={s.acoes}>
              <button onClick={handleCopiar} style={s.btnCopiar}>
                {copiado ? '✓ Copiado!' : 'Copiar'}
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
    </div>
  )
}

const s = {
  page: {
    padding: '32px 24px',
    maxWidth: '640px',
  },
  header: {
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
  card: {
    background: color.card,
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    padding: '24px',
    boxShadow: shadow.card,
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: color.textSecondary,
    marginBottom: '8px',
  },
  labelOpcional: {
    fontSize: '12px',
    fontWeight: '400',
    color: 'rgba(148,163,184,0.55)',
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    background: color.input,
    border: `1px solid ${color.border}`,
    borderRadius: radius.md,
    color: color.textPrimary,
    fontSize: '14px',
    outline: 'none',
    transition: transition.fast,
    minWidth: 0,
  },
  btnGerar: {
    padding: '10px 20px',
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
    marginTop: '10px',
    fontSize: '13px',
    color: '#f87171',
    margin: '10px 0 0',
  },
  resultado: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
  },
  labelResultado: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: color.textSecondary,
    marginBottom: '8px',
  },
  linkBox: {
    background: color.input,
    border: `1px solid ${color.primaryBorder}`,
    borderRadius: radius.md,
    padding: '10px 14px',
    wordBreak: 'break-all',
  },
  linkTexto: {
    fontSize: '13px',
    color: '#a5b4fc',
    fontFamily: 'monospace',
  },
  acoes: {
    display: 'flex',
    gap: '10px',
    marginTop: '14px',
    flexWrap: 'wrap',
  },
  btnCopiar: {
    padding: '9px 18px',
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
    padding: '9px 18px',
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

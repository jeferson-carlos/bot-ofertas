import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { color, shadow, radius, borda, transition } from '../../theme'

export default function Perfil() {
  const { user } = useAuth()

  const [email, setEmail]         = useState(user?.email || '')
  const [senha, setSenha]         = useState('')
  const [confirmSenha, setConfirm] = useState('')
  const [salvando, setSalvando]   = useState(false)
  const [msg, setMsg]             = useState(null)

  async function salvarEmail(e) {
    e.preventDefault()
    if (email === user?.email) return
    setSalvando(true)
    setMsg(null)
    const { error } = await supabase.auth.updateUser({ email })
    if (error) setMsg({ tipo: 'erro', texto: error.message })
    else setMsg({ tipo: 'ok', texto: 'Confirmação enviada para o novo e-mail. Verifique sua caixa de entrada.' })
    setSalvando(false)
  }

  async function salvarSenha(e) {
    e.preventDefault()
    if (!senha) return
    if (senha !== confirmSenha) { setMsg({ tipo: 'erro', texto: 'As senhas não coincidem.' }); return }
    if (senha.length < 6) { setMsg({ tipo: 'erro', texto: 'A senha deve ter pelo menos 6 caracteres.' }); return }
    setSalvando(true)
    setMsg(null)
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) setMsg({ tipo: 'erro', texto: error.message })
    else {
      setMsg({ tipo: 'ok', texto: 'Senha atualizada com sucesso!' })
      setSenha('')
      setConfirm('')
    }
    setSalvando(false)
  }

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.titulo}>Perfil</h1>
        <p style={s.subtitulo}>Gerencie suas informações de acesso</p>
      </div>

      {msg && (
        <div style={{
          ...s.msgBox,
          borderColor:  msg.tipo === 'ok' ? color.successBorder  : color.dangerBorder,
          background:   msg.tipo === 'ok' ? color.successMuted   : color.dangerMuted,
          color:        msg.tipo === 'ok' ? color.success         : color.danger,
        }}>
          {msg.tipo === 'ok' ? '✓ ' : '⚠ '}{msg.texto}
        </div>
      )}

      <div style={s.bloco}>
        <div style={s.blocoHeader}>
          <div style={{ ...s.blocoIcone, background: color.primaryMuted }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div>
            <p style={s.blocoTitulo}>E-mail</p>
            <p style={s.blocoSub}>Alterar endereço de e-mail de acesso</p>
          </div>
        </div>
        <form onSubmit={salvarEmail} style={s.form}>
          <div style={s.campoGrupo}>
            <label style={s.label}>Novo e-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={s.input}
            />
          </div>
          <button
            type="submit"
            disabled={salvando || email === user?.email}
            style={(salvando || email === user?.email) ? s.botaoDisabled : s.botao}
          >
            Atualizar e-mail
          </button>
        </form>
      </div>

      <div style={s.bloco}>
        <div style={s.blocoHeader}>
          <div style={{ ...s.blocoIcone, background: color.warningMuted }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <div>
            <p style={s.blocoTitulo}>Senha</p>
            <p style={s.blocoSub}>Mínimo de 6 caracteres</p>
          </div>
        </div>
        <form onSubmit={salvarSenha} style={s.form}>
          <div style={s.campos}>
            <div style={s.campoGrupo}>
              <label style={s.label}>Nova senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} style={s.input} placeholder="••••••••" />
            </div>
            <div style={s.campoGrupo}>
              <label style={s.label}>Confirmar senha</label>
              <input type="password" value={confirmSenha} onChange={e => setConfirm(e.target.value)} style={s.input} placeholder="••••••••" />
            </div>
          </div>
          <button
            type="submit"
            disabled={salvando || !senha}
            style={(salvando || !senha) ? s.botaoDisabled : s.botao}
          >
            Atualizar senha
          </button>
        </form>
      </div>
    </div>
  )
}

const s = {
  header:    { marginBottom: '28px' },
  titulo:    { color: color.textPrimary, fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  subtitulo: { color: color.textMuted, fontSize: '13px' },

  msgBox: { border: '1px solid', borderRadius: radius.md, padding: '12px 16px', fontSize: '13px', marginBottom: '20px', fontWeight: '500' },

  bloco:      { background: color.card, border: borda.base, borderRadius: radius.lg, padding: '24px', marginBottom: '20px', boxShadow: shadow.card },
  blocoHeader:{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' },
  blocoIcone: { width: '38px', height: '38px', borderRadius: radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  blocoTitulo:{ color: color.textPrimary, fontSize: '14px', fontWeight: '700', marginBottom: '2px' },
  blocoSub:   { color: color.textMuted, fontSize: '12px' },

  form:      { display: 'flex', flexDirection: 'column', gap: '16px' },
  campos:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  campoGrupo:{ display: 'flex', flexDirection: 'column', gap: '6px' },
  label:     { color: color.textSecondary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: {
    background: color.input, border: borda.base,
    borderRadius: radius.md, padding: '10px 14px',
    color: color.textPrimary, fontSize: '13px',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
    outline: 'none', transition: transition.fast,
  },

  botao: {
    alignSelf: 'flex-start',
    background: color.primary, border: 'none',
    color: color.white, borderRadius: radius.md,
    padding: '10px 20px', cursor: 'pointer',
    fontWeight: '700', fontSize: '13px', fontFamily: 'inherit',
    boxShadow: shadow.primary, transition: transition.fast,
  },
  botaoDisabled: {
    alignSelf: 'flex-start',
    background: color.hover, border: `1px solid #1a2432`,
    color: color.textDisabled, borderRadius: radius.md,
    padding: '10px 20px', cursor: 'not-allowed',
    fontWeight: '700', fontSize: '13px', fontFamily: 'inherit', opacity: 1,
  },
}

import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

export default function Perfil() {
  const { user } = useAuth()

  const [email, setEmail]         = useState(user?.email || '')
  const [senha, setSenha]         = useState('')
  const [confirmSenha, setConfirm] = useState('')
  const [salvando, setSalvando]   = useState(false)
  const [msg, setMsg]             = useState(null) // { tipo: 'ok'|'erro', texto }

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
        <div style={{ ...s.msgBox, borderColor: msg.tipo === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)', background: msg.tipo === 'ok' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', color: msg.tipo === 'ok' ? '#22c55e' : '#ef4444' }}>
          {msg.texto}
        </div>
      )}

      {/* E-mail */}
      <div style={s.bloco}>
        <div style={s.blocoHeader}>
          <div style={{ ...s.blocoIcone, background: 'rgba(99,102,241,0.1)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <button type="submit" disabled={salvando || email === user?.email} style={{ ...s.botao, opacity: (salvando || email === user?.email) ? 0.5 : 1 }}>
            Atualizar e-mail
          </button>
        </form>
      </div>

      {/* Senha */}
      <div style={s.bloco}>
        <div style={s.blocoHeader}>
          <div style={{ ...s.blocoIcone, background: 'rgba(245,158,11,0.1)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <button type="submit" disabled={salvando || !senha} style={{ ...s.botao, opacity: (salvando || !senha) ? 0.5 : 1 }}>
            Atualizar senha
          </button>
        </form>
      </div>
    </div>
  )
}

const s = {
  header:       { marginBottom: '28px' },
  titulo:       { color: '#f1f5f9', fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  subtitulo:    { color: '#64748b', fontSize: '13px' },

  msgBox:       { border: '1px solid', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '20px' },

  bloco:        { background: '#111827', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px', marginBottom: '20px' },
  blocoHeader:  { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' },
  blocoIcone:   { width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  blocoTitulo:  { color: '#e2e8f0', fontSize: '14px', fontWeight: '700', marginBottom: '2px' },
  blocoSub:     { color: '#64748b', fontSize: '12px' },

  form:         { display: 'flex', flexDirection: 'column', gap: '16px' },
  campos:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  campoGrupo:   { display: 'flex', flexDirection: 'column', gap: '6px' },
  label:        { color: '#94a3b8', fontSize: '12px', fontWeight: '600' },
  input:        { background: '#0f1117', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },

  botao:        { alignSelf: 'flex-start', background: '#6366f1', border: 'none', color: '#fff', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit' },
}

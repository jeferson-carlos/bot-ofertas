import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { color, shadow, radius, borda, transition } from '../../theme'

export default function Login() {
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')
  const [focusEmail, setFocusEmail] = useState(false)
  const [focusSenha, setFocusSenha] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()
  const sessaoExpirada = location.state?.sessaoExpirada

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    setLoading(false)
    if (error) {
      setErro('E-mail ou senha inválidos.')
    } else {
      navigate('/app/dashboard')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Link to="/" style={styles.logo}>PropagAI</Link>
        <h1 style={styles.titulo}>Entrar na sua conta</h1>

        {sessaoExpirada && (
          <div style={styles.avisoSessao}>
            ⚠️ Sua sessão expirou. Por favor, entre novamente.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.campoGrupo}>
            <label style={styles.label}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusEmail(true)}
              onBlur={() => setFocusEmail(false)}
              placeholder="seu@email.com"
              required
              style={focusEmail ? styles.inputFocus : styles.input}
            />
          </div>

          <div style={styles.campoGrupo}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onFocus={() => setFocusSenha(true)}
              onBlur={() => setFocusSenha(false)}
              placeholder="••••••••"
              required
              style={focusSenha ? styles.inputFocus : styles.input}
            />
          </div>

          {erro && (
            <div style={styles.erroBox}>
              <span>⚠</span> {erro}
            </div>
          )}

          <button type="submit" disabled={loading} style={loading ? styles.botaoDisabled : styles.botao}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={styles.rodape}>
          Não tem conta?{' '}
          <Link to="/cadastro" style={styles.link}>Criar conta grátis</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: color.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    background: color.card,
    borderRadius: radius.xl,
    padding: '40px',
    width: '100%', maxWidth: '400px',
    border: borda.base,
    boxShadow: shadow.elevated,
  },
  logo: {
    display: 'block', color: color.primary,
    fontSize: '20px', fontWeight: '800',
    textDecoration: 'none', marginBottom: '28px',
    letterSpacing: '-0.5px',
  },
  titulo: {
    color: color.textPrimary,
    fontSize: '22px', fontWeight: '700',
    margin: '0 0 28px', letterSpacing: '-0.3px',
  },
  campoGrupo: { marginBottom: '16px' },
  label: {
    display: 'block', color: color.textSecondary,
    fontSize: '12px', fontWeight: '600', marginBottom: '7px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  input: {
    width: '100%', background: color.input,
    border: borda.base,
    borderRadius: radius.md,
    padding: '11px 14px', color: color.textPrimary,
    fontSize: '14px', boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit',
    transition: transition.fast,
  },
  inputFocus: {
    width: '100%', background: color.input,
    border: borda.primary,
    boxShadow: shadow.focus,
    borderRadius: radius.md,
    padding: '11px 14px', color: color.textPrimary,
    fontSize: '14px', boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit',
    transition: transition.fast,
  },
  erroBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: color.dangerMuted,
    border: borda.danger,
    color: color.danger,
    borderRadius: radius.md,
    padding: '10px 14px',
    fontSize: '13px', marginBottom: '14px',
  },
  botao: {
    width: '100%', background: color.primary,
    color: color.white, border: 'none',
    borderRadius: radius.md, padding: '13px',
    cursor: 'pointer', fontWeight: '700', fontSize: '15px',
    marginTop: '8px', fontFamily: 'inherit',
    boxShadow: shadow.primary,
    transition: transition.fast,
  },
  botaoDisabled: {
    width: '100%', background: color.hover,
    color: color.textDisabled, border: `1px solid #1a2432`,
    borderRadius: radius.md, padding: '13px',
    cursor: 'not-allowed', fontWeight: '700', fontSize: '15px',
    marginTop: '8px', fontFamily: 'inherit', opacity: 1,
  },
  rodape: {
    color: color.textMuted, fontSize: '13px',
    textAlign: 'center', marginTop: '24px',
  },
  link: { color: color.primary, textDecoration: 'none', fontWeight: '600' },
  avisoSessao: {
    background: color.warningMuted,
    border: borda.warning,
    color: color.warning,
    borderRadius: radius.md,
    padding: '10px 14px', fontSize: '13px', marginBottom: '20px',
  },
}

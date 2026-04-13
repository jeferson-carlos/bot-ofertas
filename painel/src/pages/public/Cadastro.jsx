import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { color, shadow, radius, borda, transition } from '../../theme'

export default function Cadastro() {
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [focusEmail, setFocusEmail] = useState(false)
  const [focusSenha, setFocusSenha] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signUp({ email, password: senha })

    setLoading(false)
    if (error) {
      setErro(error.message === 'User already registered' ? 'Este e-mail já está cadastrado.' : 'Erro ao criar conta. Tente novamente.')
    } else {
      setSucesso(true)
      setTimeout(() => navigate('/app/dashboard'), 1500)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Link to="/" style={styles.logo}>PropagAI</Link>
        <h1 style={styles.titulo}>Criar conta grátis</h1>

        {sucesso ? (
          <div style={styles.sucessoBox}>
            <p style={{ fontSize: '36px', margin: '0 0 12px' }}>✅</p>
            <p style={{ color: color.success, fontWeight: '700', fontSize: '15px', margin: '0 0 4px' }}>Conta criada!</p>
            <p style={{ color: color.textMuted, fontSize: '13px' }}>Redirecionando...</p>
          </div>
        ) : (
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
                placeholder="Mínimo 6 caracteres"
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
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>

            <p style={styles.termos}>
              Ao criar sua conta, você concorda com nossos termos de uso.
            </p>
          </form>
        )}

        <p style={styles.rodape}>
          Já tem conta?{' '}
          <Link to="/login" style={styles.link}>Entrar</Link>
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
    marginTop: '4px', fontFamily: 'inherit',
    boxShadow: shadow.primary,
    transition: transition.fast,
  },
  botaoDisabled: {
    width: '100%', background: color.hover,
    color: color.textDisabled, border: `1px solid #1a2432`,
    borderRadius: radius.md, padding: '13px',
    cursor: 'not-allowed', fontWeight: '700', fontSize: '15px',
    marginTop: '4px', fontFamily: 'inherit', opacity: 1,
  },
  termos: { color: color.textDisabled, fontSize: '11px', textAlign: 'center', marginTop: '12px' },
  sucessoBox: { textAlign: 'center', padding: '20px 0' },
  rodape: {
    color: color.textMuted, fontSize: '13px',
    textAlign: 'center', marginTop: '24px',
  },
  link: { color: color.primary, textDecoration: 'none', fontWeight: '600' },
}

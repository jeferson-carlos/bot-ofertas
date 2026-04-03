import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function Login() {
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')
  const navigate = useNavigate()

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

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            style={styles.input}
          />
          <label style={styles.label}>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            placeholder="••••••••"
            required
            style={styles.input}
          />

          {erro && <p style={styles.erro}>{erro}</p>}

          <button type="submit" disabled={loading} style={styles.botao}>
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
  container: { minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'sans-serif' },
  card:      { background: '#1e293b', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px', border: '1px solid #374151' },
  logo:      { display: 'block', color: '#6366f1', fontSize: '20px', fontWeight: 'bold', textDecoration: 'none', marginBottom: '24px' },
  titulo:    { color: '#e2e8f0', fontSize: '22px', fontWeight: 'bold', margin: '0 0 28px' },
  label:     { display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' },
  input:     { width: '100%', background: '#0f1117', border: '1px solid #374151', borderRadius: '8px', padding: '10px 12px', color: '#e2e8f0', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' },
  botao:     { width: '100%', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '8px' },
  erro:      { color: '#ef4444', fontSize: '13px', marginBottom: '8px' },
  rodape:    { color: '#6b7280', fontSize: '13px', textAlign: 'center', marginTop: '24px' },
  link:      { color: '#6366f1', textDecoration: 'none' },
}

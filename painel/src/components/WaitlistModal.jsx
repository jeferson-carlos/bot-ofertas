import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function WaitlistModal({ plano, onClose }) {
  const [nome, setNome]       = useState('')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase
      .from('lista_espera')
      .insert({ nome, email, plano_interesse: plano })

    setLoading(false)

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setSucesso(true)
    }
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {sucesso ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🎉</p>
            <p style={styles.titulo}>Você está na lista!</p>
            <p style={styles.subtitulo}>Avisaremos quando o plano <strong>{plano}</strong> estiver disponível.</p>
            <button onClick={onClose} style={styles.botao}>Fechar</button>
          </div>
        ) : (
          <>
            <p style={styles.titulo}>Entrar na lista de espera</p>
            <p style={styles.subtitulo}>
              O plano <strong style={{ color: '#6366f1' }}>{plano}</strong> está em breve.
              Deixe seus dados e avisamos quando abrir.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
                style={styles.input}
              />
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={styles.input}
              />
              {erro && <p style={styles.erro}>{erro}</p>}
              <button type="submit" disabled={loading} style={styles.botao}>
                {loading ? 'Salvando...' : 'Quero ser avisado'}
              </button>
            </form>
            <button onClick={onClose} style={styles.cancelar}>Cancelar</button>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  backdrop:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:     { background: '#1e293b', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', margin: '16px' },
  titulo:    { color: '#e2e8f0', fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px' },
  subtitulo: { color: '#6b7280', fontSize: '14px', margin: '0 0 20px' },
  input:     { width: '100%', background: '#0f1117', border: '1px solid #374151', borderRadius: '8px', padding: '10px 12px', color: '#e2e8f0', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' },
  botao:     { width: '100%', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '4px' },
  cancelar:  { width: '100%', background: 'transparent', color: '#6b7280', border: 'none', padding: '10px', cursor: 'pointer', fontSize: '13px', marginTop: '8px' },
  erro:      { color: '#ef4444', fontSize: '13px', marginBottom: '8px' },
}

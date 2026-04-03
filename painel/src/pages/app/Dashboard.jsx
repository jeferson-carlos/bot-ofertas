import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

const PLANO_LABEL = { free: 'Free', pro: 'Pro', premium: 'Premium' }
const PLANO_COR   = { free: '#6b7280', pro: '#6366f1', premium: '#f59e0b' }

export default function Dashboard() {
  const { user, profile, temAcesso } = useAuth()
  const [stats, setStats] = useState({ pendente: 0, enviado: 0, descartado: 0 })
  const navigate = useNavigate()

  async function carregarStats() {
    const { data } = await supabase.from('ofertas').select('status')
    if (data) {
      const s = { pendente: 0, enviado: 0, descartado: 0 }
      data.forEach(o => { if (s[o.status] !== undefined) s[o.status]++ })
      setStats(s)
    }
  }

  useEffect(() => {
    carregarStats()

    // Real-time: atualiza stats quando oferta é inserida ou atualizada
    const channel = supabase
      .channel('ofertas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ofertas' }, () => {
        carregarStats()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const plano = profile?.plan || 'free'
  const primeiroNome = user?.email?.split('@')[0] || 'usuário'

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Olá, {primeiroNome} 👋</h1>
          <p style={styles.subtitulo}>Bem-vindo ao seu painel de ofertas</p>
        </div>
        <span style={{ ...styles.planoBadge, background: PLANO_COR[plano] }}>
          Plano {PLANO_LABEL[plano]}
        </span>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        {[
          { status: 'pendente',  label: 'Pendentes',      valor: stats.pendente,  cor: '#f59e0b' },
          { status: 'enviado',   label: 'Enviadas',       valor: stats.enviado,   cor: '#10b981' },
          { status: 'descartado',label: 'Descartadas',    valor: stats.descartado,cor: '#ef4444' },
          { status: null,        label: 'Total coletadas', valor: stats.pendente + stats.enviado + stats.descartado, cor: '#6366f1' },
        ].map(({ status, label, valor, cor }) => (
          <div
            key={label}
            onClick={() => status && navigate('/app/ofertas', { state: { filtro: status } })}
            style={{ ...styles.statCard, ...(status ? styles.statCardClicavel : {}) }}
          >
            <p style={styles.statValor}>{valor}</p>
            <p style={styles.statLabel}>{label}</p>
            {status && <p style={{ ...styles.statDica, color: cor }}>Ver lista →</p>}
            <div style={{ ...styles.statBarra, background: cor }} />
          </div>
        ))}
      </div>

      {/* Ações rápidas */}
      <h2 style={styles.secaoTitulo}>Ações rápidas</h2>
      <div style={styles.acoesGrid}>
        <button onClick={() => navigate('/app/ofertas')} style={styles.acaoCard}>
          <span style={styles.acaoIcone}>🏷️</span>
          <span style={styles.acaoLabel}>Ver ofertas pendentes</span>
          <span style={styles.acaoBadge}>{stats.pendente}</span>
        </button>

        {temAcesso('pro') ? (
          <button onClick={() => navigate('/app/keywords')} style={styles.acaoCard}>
            <span style={styles.acaoIcone}>🔍</span>
            <span style={styles.acaoLabel}>Gerenciar keywords</span>
          </button>
        ) : (
          <button onClick={() => navigate('/')} style={{ ...styles.acaoCard, ...styles.acaoCardBloqueado }}>
            <span style={styles.acaoIcone}>🔒</span>
            <span style={styles.acaoLabel}>Keywords — Plano Pro</span>
            <span style={styles.upgradeBadge}>Upgrade</span>
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  header:            { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' },
  titulo:            { color: '#e2e8f0', fontSize: '24px', fontWeight: 'bold', margin: 0 },
  subtitulo:         { color: '#6b7280', fontSize: '14px', marginTop: '4px' },
  planoBadge:        { color: '#fff', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '12px' },
  statsGrid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '40px' },
  statCard:          { background: '#1e293b', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' },
  statCardClicavel:  { cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s', border: '1px solid #374151' },
  statDica:          { fontSize: '11px', margin: '4px 0 0', fontWeight: 'bold' },
  statValor:         { color: '#e2e8f0', fontSize: '32px', fontWeight: 'bold', margin: '0 0 4px' },
  statLabel:         { color: '#6b7280', fontSize: '13px', margin: 0 },
  statBarra:         { position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px' },
  secaoTitulo:       { color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' },
  acoesGrid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
  acaoCard:          { background: '#1e293b', border: '1px solid #374151', borderRadius: '12px', padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' },
  acaoCardBloqueado: { opacity: 0.6 },
  acaoIcone:         { fontSize: '20px' },
  acaoLabel:         { color: '#e2e8f0', fontSize: '14px', flex: 1 },
  acaoBadge:         { background: '#f59e0b', color: '#000', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' },
  upgradeBadge:      { background: '#6366f1', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' },
}

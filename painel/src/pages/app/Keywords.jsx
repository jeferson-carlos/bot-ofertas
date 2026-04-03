import { useAuth } from '../../contexts/AuthContext'
import FeatureBloqueada from '../../components/FeatureBloqueada'

export default function Keywords() {
  const { temAcesso } = useAuth()

  if (!temAcesso('pro')) {
    return (
      <FeatureBloqueada plano="pro">
        <div style={styles.placeholder}>
          <h1 style={styles.titulo}>Keywords</h1>
          <p style={styles.sub}>Gerencie as palavras-chave para busca de ofertas.</p>
          <div style={styles.listaFake}>
            {['tênis nike', 'fone bluetooth', 'smartwatch'].map(k => (
              <div key={k} style={styles.itemFake}>{k}</div>
            ))}
          </div>
        </div>
      </FeatureBloqueada>
    )
  }

  return (
    <div>
      <h1 style={styles.titulo}>Keywords</h1>
      <p style={styles.sub}>Em breve: gerencie suas palavras-chave de busca aqui.</p>
    </div>
  )
}

const styles = {
  placeholder: { padding: '8px' },
  titulo:      { color: '#e2e8f0', fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px' },
  sub:         { color: '#6b7280', fontSize: '14px', margin: '0 0 24px' },
  listaFake:   { display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' },
  itemFake:    { background: '#1e293b', border: '1px solid #374151', borderRadius: '8px', padding: '12px 16px', color: '#9ca3af', fontSize: '14px' },
}

import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import FeatureBloqueada from '../../components/FeatureBloqueada'
import { color, shadow, radius, borda } from '../../theme'

function BarraGrafico({ dados, labelKey, valorKey, cor }) {
  const max = Math.max(...dados.map(d => d[valorKey]), 1)
  return (
    <div style={s.graficoWrap}>
      <div style={s.barrasContainer}>
        {dados.map((d, i) => (
          <div key={i} style={s.barraColuna}>
            <div style={s.barraTooltip}>{d[valorKey]}</div>
            <div style={{ ...s.barra, height: `${(d[valorKey] / max) * 100}%`, background: cor }} />
            <span style={s.barraLabel}>{d[labelKey]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Relatorios() {
  const { temAcesso } = useAuth()

  const [loading, setLoading]     = useState(true)
  const [stats, setStats]         = useState({ enviadas: 0, coletadas: 0, descontoMedio: 0, lojas: 0 })
  const [diasDados, setDiasDados] = useState([])
  const [topLojas, setTopLojas]   = useState([])

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)

    const { data: todasOfertas } = await supabase
      .from('ofertas')
      .select('status, percentual_desconto, loja, enviado_em')

    if (todasOfertas) {
      const enviadas    = todasOfertas.filter(o => o.status === 'enviado')
      const coletadas   = todasOfertas.length
      const descontos   = enviadas.map(o => parseFloat(o.percentual_desconto) || 0)
      const descontoMedio = descontos.length > 0
        ? Math.round(descontos.reduce((a, b) => a + b, 0) / descontos.length)
        : 0

      const lojasUnicas = new Set(todasOfertas.map(o => o.loja).filter(Boolean)).size

      setStats({ enviadas: enviadas.length, coletadas, descontoMedio, lojas: lojasUnicas })

      const hoje  = new Date()
      const dias  = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(hoje)
        d.setDate(hoje.getDate() - (13 - i))
        return d.toISOString().split('T')[0]
      })

      const contagemPorDia = {}
      enviadas.forEach(o => {
        if (o.enviado_em) {
          const dia = o.enviado_em.split('T')[0]
          contagemPorDia[dia] = (contagemPorDia[dia] || 0) + 1
        }
      })

      setDiasDados(dias.map(dia => ({
        label: dia.slice(5),
        valor: contagemPorDia[dia] || 0,
      })))

      const lojasMap = {}
      todasOfertas.forEach(o => {
        if (o.loja) lojasMap[o.loja] = (lojasMap[o.loja] || 0) + 1
      })
      const topLojasArr = Object.entries(lojasMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([loja, total]) => ({ loja, total }))
      setTopLojas(topLojasArr)
    }

    setLoading(false)
  }

  const conteudo = loading ? (
    <p style={{ color: color.textMuted, fontSize: '14px' }}>Carregando relatórios...</p>
  ) : (
    <>
      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <p style={s.statLabel}>Enviadas</p>
          <p style={s.statValor}>{stats.enviadas}</p>
          <p style={s.statSub}>total no painel</p>
        </div>
        <div style={s.statCard}>
          <p style={s.statLabel}>Coletadas</p>
          <p style={s.statValor}>{stats.coletadas}</p>
          <p style={s.statSub}>total acumulado</p>
        </div>
        <div style={{ ...s.statCard, borderColor: color.primaryBorder }}>
          <p style={s.statLabel}>Desconto médio</p>
          <p style={{ ...s.statValor, color: color.success }}>{stats.descontoMedio}%</p>
          <p style={s.statSub}>das ofertas enviadas</p>
        </div>
        <div style={s.statCard}>
          <p style={s.statLabel}>Lojas únicas</p>
          <p style={s.statValor}>{stats.lojas}</p>
          <p style={s.statSub}>coletadas</p>
        </div>
      </div>

      <div style={s.bloco}>
        <div style={s.blocoTopo}>
          <p style={s.blocoTitulo}>Enviadas por dia</p>
          <p style={s.blocoSub}>Últimos 14 dias</p>
        </div>
        {diasDados.every(d => d.valor === 0) ? (
          <p style={{ color: color.textMuted, fontSize: '13px' }}>Nenhuma oferta enviada nos últimos 14 dias.</p>
        ) : (
          <BarraGrafico dados={diasDados} labelKey="label" valorKey="valor" cor={color.primary} />
        )}
      </div>

      <div style={s.bloco}>
        <div style={s.blocoTopo}>
          <p style={s.blocoTitulo}>Top lojas</p>
          <p style={s.blocoSub}>Por volume de ofertas coletadas</p>
        </div>
        {topLojas.length === 0 ? (
          <p style={{ color: color.textMuted, fontSize: '13px' }}>Nenhuma oferta coletada ainda.</p>
        ) : (
          <div style={s.tabelaLojas}>
            {topLojas.map((item, i) => {
              const maxTotal = topLojas[0].total
              return (
                <div key={item.loja} style={s.lojaLinha}>
                  <span style={s.lojaPosicao}>{i + 1}</span>
                  <span style={s.lojaNome}>{item.loja}</span>
                  <div style={s.lojaBarraWrap}>
                    <div style={{ ...s.lojaBarra, width: `${(item.total / maxTotal) * 100}%` }} />
                  </div>
                  <span style={s.lojaTotal}>{item.total}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Relatórios</h1>
          <p style={s.subtitulo}>Visão geral das suas ofertas e desempenho</p>
        </div>
      </div>

      <FeatureBloqueada plano="premium">
        {conteudo}
      </FeatureBloqueada>
    </div>
  )
}

const s = {
  header:    { marginBottom: '32px' },
  titulo:    { color: color.textPrimary, fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  subtitulo: { color: color.textMuted, fontSize: '13px' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard:  { background: color.card, border: borda.base, borderRadius: radius.lg, padding: '20px', boxShadow: shadow.card },
  statLabel: { color: color.textMuted, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' },
  statValor: { color: color.textPrimary, fontSize: '28px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '4px' },
  statSub:   { color: color.textDisabled, fontSize: '11px' },

  bloco:      { background: color.card, border: borda.base, borderRadius: radius.lg, padding: '24px', marginBottom: '20px', boxShadow: shadow.card },
  blocoTopo:  { display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' },
  blocoTitulo:{ color: color.textPrimary, fontSize: '15px', fontWeight: '700' },
  blocoSub:   { color: color.textMuted, fontSize: '12px' },

  graficoWrap:     { width: '100%', overflowX: 'auto' },
  barrasContainer: { display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px', minWidth: '560px' },
  barraColuna:     { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end', position: 'relative' },
  barra:           { width: '100%', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.3s' },
  barraLabel:      { color: color.textDisabled, fontSize: '9px', textAlign: 'center', whiteSpace: 'nowrap', marginTop: '6px' },
  barraTooltip:    { color: color.textSecondary, fontSize: '10px', fontWeight: '700', marginBottom: '2px' },

  tabelaLojas:  { display: 'flex', flexDirection: 'column', gap: '12px' },
  lojaLinha:    { display: 'flex', alignItems: 'center', gap: '12px' },
  lojaPosicao:  { color: color.textDisabled, fontSize: '11px', fontWeight: '700', width: '16px', flexShrink: 0 },
  lojaNome:     { color: color.textSecondary, fontSize: '13px', width: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 },
  lojaBarraWrap:{ flex: 1, height: '6px', background: color.hover, borderRadius: '3px', overflow: 'hidden' },
  lojaBarra:    { height: '100%', background: color.primary, borderRadius: '3px', transition: 'width 0.3s' },
  lojaTotal:    { color: color.textMuted, fontSize: '12px', fontWeight: '700', width: '32px', textAlign: 'right', flexShrink: 0 },
}

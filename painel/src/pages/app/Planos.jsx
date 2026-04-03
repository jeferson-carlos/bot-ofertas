import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'

const PLANOS = [
  {
    id: 'free',
    nome: 'Free',
    preco: 'R$ 0',
    cor: '#64748b',
    descricao: 'Para explorar o sistema',
    features: [
      { ok: true,  texto: 'Painel de ofertas' },
      { ok: true,  texto: 'Envio manual para Telegram' },
      { ok: false, texto: 'Keywords personalizadas' },
      { ok: false, texto: 'Busca automática' },
      { ok: false, texto: 'Credenciais próprias Shopee' },
      { ok: false, texto: 'Canal Telegram próprio' },
    ],
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'R$ 49',
    cor: '#6366f1',
    destaque: true,
    descricao: 'Para quem quer automatizar',
    features: [
      { ok: true, texto: 'Tudo do Free' },
      { ok: true, texto: 'Até 3 keywords' },
      { ok: true, texto: '5 buscas manuais/dia' },
      { ok: true, texto: 'Credenciais próprias Shopee' },
      { ok: true, texto: 'Canal Telegram próprio' },
      { ok: false, texto: 'Keywords ilimitadas' },
    ],
  },
  {
    id: 'premium',
    nome: 'Premium',
    preco: 'R$ 99',
    cor: '#f59e0b',
    descricao: 'Para escalar ao máximo',
    features: [
      { ok: true, texto: 'Tudo do Pro' },
      { ok: true, texto: 'Keywords ilimitadas' },
      { ok: true, texto: 'Buscas ilimitadas' },
      { ok: true, texto: 'Suporte prioritário' },
      { ok: true, texto: 'Acesso antecipado a novidades' },
      { ok: true, texto: 'Relatórios avançados' },
    ],
  },
]

export default function Planos() {
  const { user, profile } = useAuth()
  const planoAtual = profile?.plan || 'free'

  const [planoSelecionado, setPlanoSelecionado] = useState(null)
  const [salvando, setSalvando]                 = useState(false)
  const [sucesso, setSucesso]                   = useState(false)
  const [erro, setErro]                         = useState('')

  async function assinar(planoId) {
    if (planoId === planoAtual) return
    setPlanoSelecionado(planoId)
    setSucesso(false)
    setErro('')
  }

  async function confirmarAssinatura() {
    if (!planoSelecionado) return
    setSalvando(true)
    setErro('')

    const { error: erroPerfil } = await supabase
      .from('profiles')
      .update({ plan: planoSelecionado })
      .eq('id', user.id)

    if (erroPerfil) {
      setErro('Erro ao atualizar plano. Tente novamente.')
      setSalvando(false)
      return
    }

    await supabase.from('lista_espera').upsert(
      { email: user.email, plano: planoSelecionado, user_id: user.id },
      { onConflict: 'email' }
    )

    // Atualiza a sessão para refletir o novo plano
    await supabase.auth.refreshSession()
    window.location.reload()
  }

  if (sucesso) {
    return (
      <div style={s.sucessoWrap}>
        <div style={s.sucessoIcone}>✅</div>
        <h2 style={s.sucessoTitulo}>Plano atualizado!</h2>
        <p style={s.sucessoTexto}>Seu plano foi alterado para <strong>{planoSelecionado}</strong>. Você já tem acesso aos novos recursos.</p>
      </div>
    )
  }

  return (
    <div>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Planos</h1>
          <p style={s.subtitulo}>
            Plano atual:&nbsp;
            <span style={{ color: '#6366f1', fontWeight: '700', textTransform: 'capitalize' }}>{planoAtual}</span>
          </p>
        </div>
      </div>

      {/* Cards de planos */}
      <div style={s.grid}>
        {PLANOS.map(plano => {
          const ativo    = plano.id === planoAtual
          const selecionado = plano.id === planoSelecionado
          return (
            <div
              key={plano.id}
              style={{
                ...s.card,
                borderColor: selecionado ? plano.cor : ativo ? plano.cor + '66' : '#1e293b',
                background:  selecionado ? plano.cor + '14' : '#111827',
              }}
            >
              {plano.destaque && !ativo && (
                <div style={{ ...s.destaqueTag, background: plano.cor }}>Mais popular</div>
              )}
              {ativo && (
                <div style={{ ...s.destaqueTag, background: '#334155', color: '#94a3b8' }}>Plano atual</div>
              )}

              <p style={{ ...s.planNome, color: plano.cor }}>{plano.nome}</p>
              <p style={s.planPreco}>{plano.preco}<span style={s.planPer}>/mês</span></p>
              <p style={s.planDesc}>{plano.descricao}</p>

              <div style={s.featuresList}>
                {plano.features.map((f, i) => (
                  <div key={i} style={s.featureItem}>
                    <span style={{ ...s.featureIcone, color: f.ok ? '#22c55e' : '#374151' }}>
                      {f.ok ? '✓' : '×'}
                    </span>
                    <span style={{ ...s.featureTexto, color: f.ok ? '#cbd5e1' : '#475569' }}>{f.texto}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => assinar(plano.id)}
                disabled={ativo}
                style={{
                  ...s.botaoAssinar,
                  background:   ativo ? '#1e293b' : plano.cor,
                  color:        ativo ? '#475569' : '#fff',
                  cursor:       ativo ? 'default' : 'pointer',
                  border:       selecionado ? `2px solid ${plano.cor}` : '2px solid transparent',
                }}
              >
                {ativo ? 'Plano atual' : selecionado ? '✓ Selecionado' : `Assinar ${plano.nome}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Confirmação */}
      {planoSelecionado && planoSelecionado !== planoAtual && (
        <div style={s.confirmacaoWrap}>
          <div style={s.confirmacaoBox}>
            <p style={s.confirmacaoTitulo}>Confirmar assinatura do plano <strong style={{ color: '#6366f1' }}>{planoSelecionado}</strong>?</p>
            <p style={s.confirmacaoSub}>
              Seu plano será atualizado imediatamente. O pagamento será processado em breve — nossa equipe entrará em contato.
            </p>
            {erro && <p style={s.erroTexto}>{erro}</p>}
            <div style={s.confirmacaoBotoes}>
              <button onClick={() => setPlanoSelecionado(null)} style={s.botaoCancelar}>Cancelar</button>
              <button onClick={confirmarAssinatura} disabled={salvando} style={s.botaoConfirmar}>
                {salvando ? 'Processando...' : 'Confirmar assinatura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nota */}
      <p style={s.nota}>
        * Sistema em fase beta. O acesso é liberado manualmente pela equipe após contato.
      </p>
    </div>
  )
}

const s = {
  header:           { marginBottom: '32px' },
  titulo:           { color: '#f1f5f9', fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  subtitulo:        { color: '#64748b', fontSize: '14px' },

  grid:             { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' },

  card:             { position: 'relative', borderRadius: '16px', border: '1px solid', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '0', transition: 'border-color 0.2s, background 0.2s' },
  destaqueTag:      { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 14px', borderRadius: '100px', whiteSpace: 'nowrap' },

  planNome:         { fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' },
  planPreco:        { color: '#f1f5f9', fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '4px' },
  planPer:          { fontSize: '14px', fontWeight: '400', color: '#64748b' },
  planDesc:         { color: '#64748b', fontSize: '13px', marginBottom: '20px', marginTop: '2px' },

  featuresList:     { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', flex: 1 },
  featureItem:      { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  featureIcone:     { fontSize: '13px', fontWeight: '700', flexShrink: 0, marginTop: '1px' },
  featureTexto:     { fontSize: '13px' },

  botaoAssinar:     { width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit', transition: 'opacity 0.15s', marginTop: 'auto' },

  confirmacaoWrap:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
  confirmacaoBox:   { background: '#111827', border: '1px solid #1e293b', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '100%' },
  confirmacaoTitulo:{ color: '#f1f5f9', fontSize: '16px', marginBottom: '10px' },
  confirmacaoSub:   { color: '#64748b', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' },
  erroTexto:        { color: '#ef4444', fontSize: '13px', marginBottom: '16px' },
  confirmacaoBotoes:{ display: 'flex', gap: '10px' },
  botaoCancelar:    { flex: 1, padding: '11px', background: 'transparent', border: '1px solid #1e293b', color: '#64748b', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' },
  botaoConfirmar:   { flex: 1, padding: '11px', background: '#6366f1', border: 'none', color: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' },

  sucessoWrap:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px', textAlign: 'center' },
  sucessoIcone:     { fontSize: '48px' },
  sucessoTitulo:    { color: '#f1f5f9', fontSize: '22px', fontWeight: '700' },
  sucessoTexto:     { color: '#64748b', fontSize: '14px', maxWidth: '360px', lineHeight: '1.6' },

  nota:             { color: '#374151', fontSize: '12px', textAlign: 'center', marginTop: '8px' },
}

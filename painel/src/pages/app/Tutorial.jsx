import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SECOES = [
  {
    id: 'telegram',
    titulo: 'Configurar Telegram',
    cor: '#6366f1',
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
    passos: [
      {
        titulo: 'Criar seu bot no @BotFather',
        descricao: 'Abra o Telegram e busque por @BotFather. Envie o comando /newbot e siga as instruções: escolha um nome e um username para o bot (deve terminar em "bot"). O BotFather vai te enviar o Token — copie e guarde.',
        destaque: 'Token: 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ',
      },
      {
        titulo: 'Criar o canal ou grupo de transmissão',
        descricao: 'No Telegram, crie um novo Canal (ou Grupo). Dê um nome como "Ofertas [SeuNome]". Defina como Público se quiser compartilhar o link com outras pessoas, ou Privado para uso pessoal.',
      },
      {
        titulo: 'Adicionar o bot como administrador',
        descricao: 'Acesse as configurações do seu Canal/Grupo → Administradores → Adicionar Administrador. Busque pelo username do seu bot e adicione. Dê permissão de "Publicar mensagens".',
      },
      {
        titulo: 'Obter o Chat ID',
        descricao: 'Para canais públicos: use o @username do canal (ex: @minhasofertas). Para grupos ou canais privados: encaminhe qualquer mensagem do grupo para o bot @userinfobot — ele vai retornar o ID numérico (começa com -100).',
        destaque: 'Exemplos: @meucanal  ou  -1001234567890',
      },
    ],
  },
  {
    id: 'shopee',
    titulo: 'Configurar Shopee Afiliados',
    cor: '#f59e0b',
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
    passos: [
      {
        titulo: 'Criar conta no portal de Afiliados Shopee',
        descricao: 'Acesse affiliate.shopee.com.br e crie sua conta de afiliado. Você precisará de uma conta Shopee normal primeiro. Após o cadastro, aguarde a aprovação (geralmente em 1-2 dias úteis).',
      },
      {
        titulo: 'Acessar a seção de API',
        descricao: 'Dentro do portal de afiliados, vá em Ferramentas → API ou Desenvolvedor. Procure a opção de criar uma aplicação ou gerar credenciais de API.',
      },
      {
        titulo: 'Gerar App ID e Secret Key',
        descricao: 'Clique em "Criar aplicação" ou similar. Preencha as informações básicas (nome do app, descrição). Após criar, o sistema vai gerar seu App ID (número) e a Secret Key (string longa).',
        destaque: 'App ID: 12345678\nSecret Key: abc123def456...',
      },
      {
        titulo: 'Copiar e salvar as credenciais',
        descricao: 'Copie o App ID e a Secret Key e cole nas Configurações do PropagAI. Com isso, todos os links gerados pelo sistema terão sua tag de afiliado, e as comissões serão creditadas na sua conta.',
      },
    ],
  },
]

export default function Tutorial() {
  const navigate = useNavigate()
  const [secaoAberta, setSecaoAberta] = useState('telegram')

  return (
    <div>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Tutorial de configuração</h1>
          <p style={s.subtitulo}>Siga os passos abaixo para configurar seu bot e começar a publicar ofertas</p>
        </div>
        <button onClick={() => navigate('/app/configuracoes')} style={s.botaoConfig}>
          Ir para Configurações →
        </button>
      </div>

      {/* Abas */}
      <div style={s.abas}>
        {SECOES.map(secao => (
          <button
            key={secao.id}
            onClick={() => setSecaoAberta(secao.id)}
            style={{
              ...s.aba,
              background:  secaoAberta === secao.id ? secao.cor + '18' : 'transparent',
              color:       secaoAberta === secao.id ? secao.cor : '#64748b',
              borderColor: secaoAberta === secao.id ? secao.cor + '55' : '#1e293b',
            }}
          >
            <span style={{ color: secaoAberta === secao.id ? secao.cor : '#475569' }}>{secao.icone}</span>
            {secao.titulo}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {SECOES.filter(s => s.id === secaoAberta).map(secao => (
        <div key={secao.id} style={s.conteudo}>
          {secao.passos.map((passo, idx) => (
            <div key={idx} style={s.passoWrap}>
              {/* Linha vertical conectora */}
              <div style={s.passoLateral}>
                <div style={{ ...s.passoNumero, background: secao.cor + '20', color: secao.cor, border: `1px solid ${secao.cor}44` }}>
                  {idx + 1}
                </div>
                {idx < secao.passos.length - 1 && <div style={{ ...s.passoLinha, background: secao.cor + '22' }} />}
              </div>

              {/* Conteúdo do passo */}
              <div style={s.passoCorpo}>
                <p style={s.passoTitulo}>{passo.titulo}</p>
                <p style={s.passoDesc}>{passo.descricao}</p>
                {passo.destaque && (
                  <div style={{ ...s.passoDestaque, borderColor: secao.cor + '33', background: secao.cor + '0a' }}>
                    <pre style={{ ...s.passoDestaqueTexto, color: secao.cor }}>{passo.destaque}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* CTA final */}
      <div style={s.ctaBox}>
        <p style={s.ctaTitulo}>Pronto! Agora configure suas credenciais.</p>
        <p style={s.ctaDesc}>Com Telegram e Shopee configurados, o sistema vai publicar ofertas automaticamente no seu canal com seus links de afiliado.</p>
        <button onClick={() => navigate('/app/configuracoes')} style={s.ctaBotao}>
          Configurar agora →
        </button>
      </div>

    </div>
  )
}

const s = {
  header:            { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' },
  titulo:            { color: '#f1f5f9', fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' },
  subtitulo:         { color: '#64748b', fontSize: '13px' },
  botaoConfig:       { background: '#6366f1', border: 'none', color: '#fff', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit', flexShrink: 0 },

  abas:              { display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' },
  aba:               { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '10px', border: '1px solid', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit', transition: 'all 0.15s' },

  conteudo:          { display: 'flex', flexDirection: 'column', gap: '0', marginBottom: '32px' },

  passoWrap:         { display: 'flex', gap: '20px' },
  passoLateral:      { display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 },
  passoNumero:       { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', flexShrink: 0 },
  passoLinha:        { width: '2px', flex: 1, minHeight: '24px', margin: '6px 0' },
  passoCorpo:        { flex: 1, paddingBottom: '28px' },
  passoTitulo:       { color: '#e2e8f0', fontSize: '15px', fontWeight: '700', marginBottom: '8px', paddingTop: '6px' },
  passoDesc:         { color: '#64748b', fontSize: '13px', lineHeight: '1.7' },
  passoDestaque:     { marginTop: '12px', border: '1px solid', borderRadius: '8px', padding: '12px 16px' },
  passoDestaqueTexto:{ fontSize: '12px', fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap' },

  ctaBox:            { background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(129,140,248,0.06))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '14px', padding: '28px', textAlign: 'center' },
  ctaTitulo:         { color: '#f1f5f9', fontSize: '17px', fontWeight: '700', marginBottom: '8px' },
  ctaDesc:           { color: '#64748b', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px', maxWidth: '480px', margin: '0 auto 20px' },
  ctaBotao:          { background: '#6366f1', border: 'none', color: '#fff', borderRadius: '10px', padding: '12px 28px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' },
}

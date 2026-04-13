// Sistema de design PropagAI — tokens centralizados
// Referência: Vercel, Linear, Supabase — dark UI confiável e de alta hierarquia

export const color = {
  // Camadas de fundo (escala de luminância perceptível entre cada nível)
  bg:            '#070b12',   // raiz da aplicação — mais escuro possível
  surface:       '#0c1018',   // sidebar, topbar — camada estrutural
  card:          '#141a24',   // cards e blocos de seção — levemente mais claro
  input:         '#1a2233',   // inputs habilitados — claramente acima do card
  inputDisabled: '#0f1620',   // inputs desabilitados — mais escuro, apagado
  hover:         '#1c2539',   // hover sobre cards e nav ativo — acima do input
  border:        '#212d3f',   // borda padrão — visível sobre card
  borderStrong:  '#2a3a52',   // borda de destaque, foco, seleção

  // Accent primário — indigo (mantido, reforçado)
  primary:       '#6366f1',
  primaryHover:  '#4f52d9',
  primaryMuted:  'rgba(99,102,241,0.12)',
  primaryBorder: 'rgba(99,102,241,0.35)',

  // Status — sucesso
  success:       '#22c55e',
  successMuted:  'rgba(34,197,94,0.12)',
  successBorder: 'rgba(34,197,94,0.30)',

  // Status — aviso / premium
  warning:       '#f59e0b',
  warningMuted:  'rgba(245,158,11,0.12)',
  warningBorder: 'rgba(245,158,11,0.30)',

  // Status — erro / perigo
  danger:        '#f87171',   // texto de erro (mais contraste que #ef4444)
  dangerStrong:  '#ef4444',   // bordas e badges sólidos
  dangerMuted:   'rgba(248,113,113,0.12)',
  dangerBorder:  'rgba(248,113,113,0.30)',

  // Premium — âmbar/dourado
  premium:       '#f59e0b',
  premiumMuted:  'rgba(245,158,11,0.12)',
  premiumBorder: 'rgba(245,158,11,0.30)',

  // Hierarquia de texto — 4 níveis
  textPrimary:   '#eef2ff',   // títulos, valores — máximo contraste
  textSecondary: '#8892aa',   // labels, subtítulos, corpo — 5.0:1 sobre card
  textMuted:     '#4a5568',   // metadados, rodapé, nav inativo — 3.3:1
  textDisabled:  '#2d3a4f',   // desabilitado / bloqueado — intencional abaixo de AA

  // Planos
  planFree:    '#64748b',
  planPro:     '#6366f1',
  planPremium: '#f59e0b',

  // Utilitários
  overlayBg: 'rgba(2,4,10,0.80)',
  white:     '#ffffff',
}

export const shadow = {
  card:     '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
  elevated: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
  sidebar:  '6px 0 32px rgba(0,0,0,0.7)',
  focus:    '0 0 0 3px rgba(99,102,241,0.35)',
  primary:  '0 4px 16px rgba(99,102,241,0.40)',
  premium:  '0 4px 24px rgba(245,158,11,0.35)',
  success:  '0 4px 14px rgba(34,197,94,0.30)',
}

export const radius = {
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  pill: '100px',
}

export const borda = {
  base:    `1px solid #212d3f`,
  strong:  `1px solid #2a3a52`,
  primary: `1px solid rgba(99,102,241,0.35)`,
  success: `1px solid rgba(34,197,94,0.30)`,
  warning: `1px solid rgba(245,158,11,0.30)`,
  danger:  `1px solid rgba(248,113,113,0.30)`,
}

export const transition = {
  fast:   'all 0.12s ease',
  normal: 'all 0.20s ease',
}

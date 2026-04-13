// Sistema de design PropagAI v2 — linguagem visual premium
// Referência: Linear, Vercel, Stripe — near-black, glass borders, inner glow

export const color = {
  // Camadas de fundo — near-black com subtom violeta (mais nobre que azul-cinza)
  bg:            '#08080c',   // raiz — quase preto
  surface:       '#0e0e15',   // sidebar, topbar
  card:          '#16161f',   // cards — leve tom roxo
  input:         '#1e1e2a',   // inputs habilitados — claramente acima do card
  inputDisabled: '#0e0e16',   // inputs desabilitados — mais escuro
  hover:         '#1c1c28',   // hover state

  // Bordas glass — white tint (padrão Linear, Vercel, GitHub)
  // Mais premium e limpo do que bordas azuis/coloridas
  border:       'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // Accent primário — indigo/violeta
  primary:       '#6366f1',
  primaryHover:  '#7c3aed',
  primaryLight:  '#a5b4fc',    // indigo-300 — texto sobre fundo escuro
  primaryMuted:  'rgba(99,102,241,0.10)',
  primaryBorder: 'rgba(99,102,241,0.28)',
  primaryGrad:   'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',

  // Status — sucesso
  success:       '#22c55e',
  successMuted:  'rgba(34,197,94,0.10)',
  successBorder: 'rgba(34,197,94,0.25)',

  // Status — aviso / premium
  warning:       '#f59e0b',
  warningMuted:  'rgba(245,158,11,0.10)',
  warningBorder: 'rgba(245,158,11,0.25)',

  // Status — erro
  danger:        '#f87171',
  dangerStrong:  '#ef4444',
  dangerMuted:   'rgba(248,113,113,0.10)',
  dangerBorder:  'rgba(248,113,113,0.25)',

  // Premium — âmbar
  premium:       '#f59e0b',
  premiumMuted:  'rgba(245,158,11,0.10)',
  premiumBorder: 'rgba(245,158,11,0.25)',
  premiumGrad:   'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',

  // Hierarquia de texto — 4 níveis
  textPrimary:   '#fafafa',    // quase branco — títulos, valores
  textSecondary: '#a1a1aa',    // zinc-400 — body, labels, subtítulos
  textMuted:     '#52525b',    // zinc-600 — metadados
  textDisabled:  '#27272a',    // zinc-800 — desabilitado / bloqueado

  // Planos
  planFree:    '#71717a',
  planPro:     '#6366f1',
  planPremium: '#f59e0b',

  overlayBg: 'rgba(0,0,0,0.88)',
  white:     '#ffffff',
}

export const shadow = {
  // inset 0 1px 0 = inner top highlight — cria sensação de profundidade e vidro premium
  card:     'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.5)',
  elevated: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 48px rgba(0,0,0,0.65)',
  sidebar:  '8px 0 48px rgba(0,0,0,0.85)',
  focus:    '0 0 0 3px rgba(99,102,241,0.28)',
  primary:  '0 4px 20px rgba(99,102,241,0.50), inset 0 1px 0 rgba(255,255,255,0.18)',
  premium:  '0 4px 24px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
  success:  '0 4px 16px rgba(34,197,94,0.35)',
}

export const radius = {
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  pill: '100px',
}

export const borda = {
  base:    `1px solid rgba(255,255,255,0.08)`,
  strong:  `1px solid rgba(255,255,255,0.14)`,
  primary: `1px solid rgba(99,102,241,0.28)`,
  success: `1px solid rgba(34,197,94,0.25)`,
  warning: `1px solid rgba(245,158,11,0.25)`,
  danger:  `1px solid rgba(248,113,113,0.25)`,
}

export const transition = {
  fast:   'all 0.12s ease',
  normal: 'all 0.20s ease',
}

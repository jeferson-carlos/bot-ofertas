# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PropagAI** — SaaS multi-tenant de ofertas afiliadas da Shopee. Cada usuário configura suas próprias credenciais Shopee e Telegram; o sistema coleta ofertas automaticamente via cron e as publica no canal Telegram do usuário.

## Commands

### Painel (React/Vite)
```bash
cd painel
npm install
npm run dev       # localhost:5173
npm run build     # output: painel/dist/
npm run lint
npm run preview
```

### Deploy do painel
Automático via GitHub Actions ao fazer push em `main` com mudanças em `painel/**`. Publicado no GitHub Pages. Não há comando manual de deploy.

### Edge Functions (Deno/Supabase)
```bash
# Requer Supabase CLI instalado e projeto linkado
supabase functions deploy buscar-ofertas
supabase functions deploy enviar-oferta
supabase functions deploy auto-enviar
supabase functions deploy diagnostico-shopee
```

### Variáveis de ambiente (painel — `.env.local`)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_KEY=eyJ...           # anon key
VITE_FUNCTION_URL=https://xxx.supabase.co/functions/v1/enviar-oferta
```

### Secrets do GitHub Actions
`SUPABASE_URL`, `SUPABASE_KEY`, `FUNCTION_URL` — configurados em Settings → Secrets.

### Migrations
Rodar no SQL Editor do Supabase após criar novos arquivos em `supabase/migrations/`. Cada migration é um arquivo `.sql` nomeado por fase (fase0..fase7).

## Architecture

### Fluxo geral
```
GitHub Actions cron (a cada hora)
  → POST /functions/v1/buscar-ofertas (sem user_id)
      → limpa ofertas antigas (enviadas >48h e descartadas >24h)
      → itera profiles com shopee_app_id configurado
      → busca 2 páginas × 50 produtos por keyword (100 por keyword)
      → sort_type da keyword "oferta" rotaciona pela hora UTC (1→5)
      → filtra por blacklist_termos do usuário
      → salva ofertas na tabela `ofertas` com user_id

GitHub Actions cron (a cada 5 minutos)
  → POST /functions/v1/auto-enviar
      → itera perfis com auto_enviar=true, plano Pro/Premium e credenciais completas
      → respeita intervalo de 5 min por usuário (ultima_auto_envio_em)
      → gera link rastreável fresco via generateShortLink
      → envia até 2 ofertas pendentes por ciclo para o Telegram do usuário

Usuário no painel
  → visualiza suas ofertas (filtradas por user_id via RLS)
  → clica "Enviar" → POST /functions/v1/enviar-oferta
      → gera link rastreável fresco via generateShortLink
      → aplica telegram_template do usuário (ou template padrão)
      → envia mensagem no Telegram do usuário
```

### Estrutura de pastas
- `painel/` — frontend React (Vite, React Router v7, HashRouter para GitHub Pages)
- `supabase/functions/` — Edge Functions Deno:
  - `buscar-ofertas` — coleta de ofertas (cron + manual)
  - `enviar-oferta` — envio manual/reenvio/descarte
  - `auto-enviar` — envio automático periódico (Pro+)
  - `diagnostico-shopee` — diagnóstico de credenciais Shopee (verify_jwt desabilitado)
  - `_shared/index.ts` — utilitários compartilhados: `gerarLinkRastreavel`, `enviarTelegram`, `aplicarTemplate`, `sha256hex`, `getShopeeHeaders`, `TEMPLATE_PADRAO`
- `supabase/migrations/` — SQL migrations numeradas por fase (fase0..fase7)
- `.github/workflows/` — `painel.yml` (deploy automático), `coletor.yml` (cron horário), `auto-enviar.yml` (cron a cada 5 min)

### Painel — roteamento e autenticação
- `HashRouter` em `main.jsx` (obrigatório para GitHub Pages)
- `AuthContext` gerencia sessão Supabase, carrega `profiles`, expõe `temAcesso(planoMinimo)` e `logoutManual` (ref)
- `RotaProtegida`: logout manual → redireciona para `/` (home); sessão expirada → `/login` com `state.sessaoExpirada = true`
- Hierarquia de planos: `free(0) < pro(1) < premium(2)` — definida em `AuthContext`
- Rotas protegidas sob `/app/*`: dashboard, ofertas, keywords, planos, configuracoes, tutorial, perfil, relatorios

### Painel — feature gating
- `FeatureBloqueada` verifica `temAcesso(plano)` — se o usuário já tem acesso, renderiza `children` diretamente sem overlay
- Itens bloqueados no menu (`planoMinimo` definido) redirecionam para `/app/planos`
- Itens de menu onde o bloqueio deve acontecer na página (ex: Relatórios) têm `planoMinimo: null` no menu
- `temAcesso('pro')` verifica se `HIERARQUIA[planoAtual] >= HIERARQUIA[planoMinimo]`
- Plano é atualizado diretamente em `profiles.plan` (sem pagamento real — fase beta)

### Banco de dados (Supabase)
Tabelas principais:
- `profiles` — plano, credenciais Telegram/Shopee, `ultima_coleta_em`, `blacklist_termos` (text[]), `telegram_template` (text), `auto_enviar` (boolean), `ultima_auto_envio_em` (timestamptz)
- `ofertas` — produtos coletados com `user_id`, `status` (pendente/enviado/descartado), `enviado_em`, `criado_em`
- `keywords` — palavras-chave por usuário com `sort_type` (1-5: relevância, mais vendidos, menor/maior preço, comissão), `ativo` (boolean)
- `uso_busca` — contador diário de buscas manuais por usuário
- `lista_espera` — leads de planos pagos

RLS habilitado em `ofertas` e `keywords`: cada usuário vê apenas seus dados. Edge Functions usam `service_role_key` e bypassam RLS.

### Edge Functions

**`buscar-ofertas`**
- Cron (sem `user_id`): executa `limparOfertas()` primeiro (remove enviados >48h e descartados >24h), depois itera `profiles` com `shopee_app_id` não-nulo
- Cron usa `processarUsuarioCron`: busca keyword "oferta" com `sort_type` rotativo pela hora UTC (`(hora % 5) + 1`) + todas as keywords ativas do usuário
- Manual (com `user_id`): usa `processarUsuarioManual` — **apenas keywords ativas**, sem fallback para "oferta"; verifica limite diário (`uso_busca`)
- Limites de busca manual: `free=0`, `pro=5`, `premium=∞`
- Por keyword: busca páginas 1 e 2 em paralelo (50 produtos cada → até 100 por keyword), remove duplicatas por `itemId`
- Filtra por `DESCONTO_MIN = 10%` e por `blacklist_termos` do usuário (título e loja, case-insensitive) antes de salvar
- Desconto calculado via `(1 - priceMin/priceMax)` — não confia em `priceDiscountRate` da API
- Credenciais: usa **apenas** as do usuário (`shopee_app_id` / `shopee_secret` do profile) — sem fallback para env vars

**`enviar-oferta`**
- Recebe `{ id, acao }` onde `acao` é `"enviar"`, `"descartar"` ou `"reenviar"`
- `"enviar"` bloqueia reenvio se status já for "enviado"; `"reenviar"` ignora esse check
- Gera link rastreável fresco via `gerarLinkRastreavel` (mutation `generateShortLink`) antes de enviar
- Aplica `telegram_template` do usuário com variáveis `{titulo}`, `{preco}`, `{preco_original}`, `{desconto}`, `{loja}`, `{link}`
- Credenciais: usa **apenas** as do usuário (Telegram e Shopee) — sem fallback para env vars
- Falha se credenciais Shopee ausentes (necessárias para gerar link rastreável)

**`auto-enviar`**
- Chamado pelo GitHub Actions a cada 5 minutos
- Filtra perfis com `auto_enviar=true`, plano `pro` ou `premium` e credenciais completas (Telegram + Shopee)
- Por usuário: respeita intervalo de 5 min via `ultima_auto_envio_em`; envia até 2 ofertas pendentes por ciclo (mais antigas primeiro)
- Gera link rastreável fresco para cada oferta antes de enviar
- Atualiza `ultima_auto_envio_em` apenas se ao menos uma oferta foi enviada no ciclo

**`diagnostico-shopee`**
- Endpoint de diagnóstico de credenciais Shopee; `verify_jwt` desabilitado no gateway

**`_shared/index.ts`**
- `gerarLinkRastreavel(originUrl, appId, secret)` — mutation `generateShortLink` da API Shopee
- `enviarTelegram(oferta, botToken, chatId, template)` — envia `sendPhoto` se `imagem_url` presente, senão `sendMessage`; parse_mode Markdown
- `aplicarTemplate(template, oferta)` — substitui variáveis no template; usa `TEMPLATE_PADRAO` se null

### Estilo CSS
Todo o CSS é inline via objetos JavaScript (sem CSS modules, sem Tailwind). Padrão: objeto `const s = { ... }` no final de cada componente, paleta dark (`#0b0f1a`, `#111827`, `#0f1117`), acentos em indigo `#6366f1`. Premium usa violeta. Borders com glass effect e inner glow para hierarquia visual.

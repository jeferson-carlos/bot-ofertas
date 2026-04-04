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
Rodar no SQL Editor do Supabase após criar novos arquivos em `supabase/migrations/`. Cada migration é um arquivo `.sql` nomeado por fase (fase0..fase6).

## Architecture

### Fluxo geral
```
GitHub Actions cron (a cada hora)
  → POST /functions/v1/buscar-ofertas (sem user_id)
      → itera profiles com shopee_app_id configurado
      → filtra por blacklist_termos do usuário
      → salva ofertas na tabela `ofertas` com user_id

Usuário no painel
  → visualiza suas ofertas (filtradas por user_id via RLS)
  → clica "Enviar" → POST /functions/v1/enviar-oferta
      → aplica telegram_template do usuário (ou template padrão)
      → envia mensagem no Telegram do usuário
```

### Estrutura de pastas
- `painel/` — frontend React (Vite, React Router v7, HashRouter para GitHub Pages)
- `supabase/functions/` — Edge Functions Deno (buscar-ofertas, enviar-oferta)
- `supabase/migrations/` — SQL migrations numeradas por fase (fase0..fase6)
- `.github/workflows/` — `painel.yml` (deploy automático), `coletor.yml` (cron)

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
- `profiles` — plano, credenciais Telegram/Shopee, `ultima_coleta_em`, `blacklist_termos` (text[]), `telegram_template` (text)
- `ofertas` — produtos coletados com `user_id`, `status` (pendente/enviado/descartado), `enviado_em`
- `keywords` — palavras-chave por usuário com `sort_type` (1-5: relevância, mais vendidos, menor/maior preço, comissão)
- `uso_busca` — contador diário de buscas manuais por usuário
- `lista_espera` — leads de planos pagos

RLS habilitado em `ofertas` e `keywords`: cada usuário vê apenas seus dados. Edge Functions usam `service_role_key` e bypassam RLS.

### Edge Functions

**`buscar-ofertas`**
- Cron (sem `user_id`): itera `profiles` com `shopee_app_id` não-nulo, processa cada usuário
- Manual (com `user_id`): verifica limite diário (`uso_busca`), usa credenciais do usuário
- Filtra ofertas pelo `blacklist_termos` do usuário (título e loja, case-insensitive) antes de salvar
- Desconto calculado via `(1 - priceMin/priceMax)` — não confia em `priceDiscountRate` da API
- Fallback: se nenhum usuário configurado, usa env vars `SHOPEE_APP_ID` / `SHOPEE_SECRET`

**`enviar-oferta`**
- Recebe `{ id, acao }` onde `acao` é `"enviar"`, `"descartar"` ou `"reenviar"`
- `"enviar"` bloqueia reenvio se status já for "enviado"; `"reenviar"` ignora esse check
- Aplica `telegram_template` do usuário com variáveis `{titulo}`, `{preco}`, `{preco_original}`, `{desconto}`, `{loja}`, `{link}`
- Fallback de credenciais: env vars `TELEGRAM_TOKEN` / `TELEGRAM_CHANNEL_ID`

### Estilo CSS
Todo o CSS é inline via objetos JavaScript (sem CSS modules, sem Tailwind). Padrão: objeto `const s = { ... }` no final de cada componente, paleta dark (`#0b0f1a`, `#111827`, `#0f1117`), acentos em indigo `#6366f1`.

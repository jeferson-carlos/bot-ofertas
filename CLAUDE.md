# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PropagAI** — SaaS multi-tenant de ofertas afiliadas da Shopee. Cada usuário configura suas próprias credenciais Shopee e Telegram; o sistema coleta ofertas automaticamente via cron e as publica no canal Telegram do usuário.

## Commands

### Painel (React/Vite)
```bash
cd painel
npm install          # instalar dependências
npm run dev          # servidor de desenvolvimento (localhost:5173)
npm run build        # build de produção (output: painel/dist/)
npm run lint         # ESLint
npm run preview      # preview do build local
```

### Deploy do painel
O deploy é **automático via GitHub Actions** ao fazer push em `main` com mudanças em `painel/**`. O build é publicado no GitHub Pages. Não há comando manual de deploy.

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

### Secrets do GitHub Actions (necessários)
`SUPABASE_URL`, `SUPABASE_KEY`, `FUNCTION_URL` — configurados em Settings → Secrets.

## Architecture

### Fluxo geral
```
GitHub Actions cron (a cada hora)
  → POST /functions/v1/buscar-ofertas (sem user_id)
      → itera sobre todos os usuários com shopee_app_id configurado
      → para cada usuário: busca keywords ativas via API Shopee Afiliados
      → salva ofertas na tabela `ofertas` com user_id
Usuário no painel
  → visualiza suas ofertas (filtradas por user_id via RLS)
  → clica "Enviar" → POST /functions/v1/enviar-oferta
      → busca telegram_bot_token + telegram_chat_id do profiles do usuário
      → envia mensagem no Telegram do usuário
```

### Estrutura de pastas
- `painel/` — frontend React (Vite, React Router v7, HashRouter para GitHub Pages)
- `supabase/functions/` — Edge Functions Deno (buscar-ofertas, enviar-oferta)
- `supabase/migrations/` — SQL migrations numeradas por fase (fase1..fase4)
- `.github/workflows/` — `painel.yml` (deploy automático), `coletor.yml` (cron)

### Painel — roteamento e autenticação
- `HashRouter` em `main.jsx` (obrigatório para GitHub Pages)
- `AuthContext` gerencia sessão Supabase, carrega `profiles`, expõe `temAcesso(planoMinimo)`
- `RotaProtegida` redireciona para `/login` se não autenticado
- Hierarquia de planos: `free(0) < pro(1) < premium(2)` — definida em `AuthContext`
- Rotas protegidas sob `/app/*`: dashboard, ofertas, keywords, planos, configuracoes, tutorial

### Painel — feature gating
- Itens bloqueados no menu redirecionam para `/app/planos` (não para `/#precos`)
- `temAcesso('pro')` verifica se `HIERARQUIA[planoAtual] >= HIERARQUIA[planoMinimo]`
- Plano é atualizado diretamente em `profiles.plan` (sem pagamento real — fase beta)

### Banco de dados (Supabase)
Tabelas principais:
- `profiles` — plano do usuário + credenciais Telegram/Shopee por usuário
- `ofertas` — produtos coletados com `user_id`, `status` (pendente/enviado/descartado)
- `keywords` — palavras-chave por usuário com `sort_type` (ordenação API Shopee)
- `uso_busca` — contador diário de buscas manuais por usuário
- `lista_espera` — e-mails de interessados em planos pagos

RLS habilitado em `ofertas`: cada usuário vê apenas `user_id = auth.uid()`. Edge Functions usam `service_role_key` e bypassam RLS.

### Edge Functions
**`buscar-ofertas`**
- Chamada sem `user_id` (cron): itera `profiles` com `shopee_app_id` não-nulo, processa cada usuário
- Chamada com `user_id` (manual pelo painel): verifica limite diário (`uso_busca`), usa credenciais do usuário
- Fallback: se nenhum usuário configurado, usa env vars `SHOPEE_APP_ID` / `SHOPEE_SECRET`
- Desconto calculado via `(1 - priceMin/priceMax)` — não confia em `priceDiscountRate` da API

**`enviar-oferta`**
- Recebe `{ id, acao }` — busca oferta, resolve `user_id` da oferta
- Lê `telegram_bot_token` + `telegram_chat_id` do `profiles` do usuário
- Fallback: env vars `TELEGRAM_TOKEN` / `TELEGRAM_CHANNEL_ID`

### Estilo CSS
Todo o CSS é inline via objetos JavaScript (sem CSS modules, sem Tailwind). Padrão: objeto `const s = { ... }` no final de cada componente, paleta dark (`#0b0f1a`, `#111827`, `#0f1117`), acentos em indigo `#6366f1`.

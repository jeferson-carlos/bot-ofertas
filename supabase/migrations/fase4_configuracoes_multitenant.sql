-- ============================================================
-- FASE 4: Credenciais por usuário + multi-tenant nas ofertas
-- ============================================================

-- 1. Credenciais do usuário na tabela profiles
alter table profiles add column if not exists telegram_bot_token text;
alter table profiles add column if not exists telegram_chat_id   text;
alter table profiles add column if not exists shopee_app_id      text;
alter table profiles add column if not exists shopee_secret      text;

-- 2. user_id na tabela ofertas (para multi-tenant)
alter table ofertas add column if not exists user_id uuid references auth.users(id);

-- Índice para queries por usuário
create index if not exists ofertas_user_id_idx on ofertas(user_id);

-- 3. RLS na tabela ofertas
--    Cada usuário vê apenas suas próprias ofertas.
--    O service_role (Edge Functions) bypassa o RLS automaticamente.
alter table ofertas enable row level security;

-- Remove políticas antigas se existirem
drop policy if exists "Usuário vê suas ofertas" on ofertas;
drop policy if exists "Usuário lê suas ofertas" on ofertas;

-- Política de leitura: usuário autenticado vê suas próprias ofertas
create policy "Usuário lê suas ofertas"
  on ofertas for select
  using (auth.uid() = user_id);

-- Nota: INSERT, UPDATE e DELETE são feitos pelas Edge Functions
-- usando service_role_key, que bypassa RLS automaticamente.

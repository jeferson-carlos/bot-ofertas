-- ============================================================
-- Fase 2 - PropagAI: tabela de keywords
-- Execute no Supabase: Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists public.keywords (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  keyword    text not null,
  ativo      boolean not null default true,
  criado_em  timestamp with time zone default timezone('utc', now())
);

-- Índice para busca por usuário
create index if not exists keywords_user_id_idx on public.keywords (user_id);

-- RLS
alter table public.keywords enable row level security;

create policy "Usuário gerencia suas próprias keywords"
  on public.keywords for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

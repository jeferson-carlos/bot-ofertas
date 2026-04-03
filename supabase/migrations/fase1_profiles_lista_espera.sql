-- ============================================================
-- Fase 1 - PropagAI: profiles + lista_espera
-- Execute no Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Tabela de perfis (vinculada ao Supabase Auth)
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  plan       text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  created_at timestamp with time zone default timezone('utc', now())
);

-- 2. Cria perfil automaticamente quando um usuário se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Tabela de lista de espera
create table if not exists public.lista_espera (
  id               uuid default gen_random_uuid() primary key,
  nome             text not null,
  email            text not null,
  plano_interesse  text,
  created_at       timestamp with time zone default timezone('utc', now())
);

-- 4. RLS (Row Level Security)
alter table public.profiles   enable row level security;
alter table public.lista_espera enable row level security;

-- Usuário lê e atualiza apenas o próprio perfil
create policy "Leitura do próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Atualização do próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Qualquer pessoa pode se inscrever na lista de espera
create policy "Qualquer um pode entrar na lista de espera"
  on public.lista_espera for insert
  with check (true);

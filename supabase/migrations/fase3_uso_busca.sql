-- Tabela de controle de uso do "Buscar agora" por dia
create table if not exists public.uso_busca (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  data       date not null default current_date,
  quantidade integer not null default 0,
  unique (user_id, data)
);

alter table public.uso_busca enable row level security;

create policy "Usuário lê seu próprio uso"
  on public.uso_busca for select
  using (auth.uid() = user_id);

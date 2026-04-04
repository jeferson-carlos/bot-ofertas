-- ============================================================
-- FASE 0: Tabela principal de ofertas
-- Deve ser executada ANTES das demais migrations.
-- ============================================================

create table if not exists public.ofertas (
  id                  uuid        default gen_random_uuid() primary key,
  user_id             uuid        references auth.users(id) on delete cascade,
  product_id          text        not null,
  titulo              text,
  preco_original      numeric,
  preco_desconto      numeric,
  percentual_desconto integer,
  comissao            numeric(5,2),
  link_afiliado       text,
  imagem_url          text,
  loja                text,
  status              text        default 'pendente' check (status in ('pendente', 'enviado', 'descartado')),
  criado_em           timestamptz default timezone('utc', now()),
  enviado_em          timestamptz,

  -- evita duplicata por usuário + produto
  unique (user_id, product_id)
);

-- Índices para as queries mais frequentes
create index if not exists ofertas_status_idx    on public.ofertas (status);
create index if not exists ofertas_user_id_idx   on public.ofertas (user_id);
create index if not exists ofertas_criado_em_idx on public.ofertas (criado_em desc);

-- RLS: cada usuário vê apenas suas próprias ofertas
alter table public.ofertas enable row level security;

drop policy if exists "Usuário lê suas ofertas" on public.ofertas;
create policy "Usuário lê suas ofertas"
  on public.ofertas for select
  using (auth.uid() = user_id);

-- INSERT / UPDATE / DELETE são feitos pelas Edge Functions
-- com service_role_key, que bypassa RLS automaticamente.

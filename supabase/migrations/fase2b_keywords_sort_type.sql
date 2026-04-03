-- Adiciona sort_type na tabela keywords
-- 1=Relevância, 2=Mais vendidos (padrão), 3=Menor preço, 4=Maior preço, 5=Maior comissão
alter table public.keywords
  add column if not exists sort_type integer not null default 2
    check (sort_type in (1, 2, 3, 4, 5));

-- Adiciona coluna de comissão na tabela ofertas
alter table public.ofertas
  add column if not exists comissao numeric(5,2);

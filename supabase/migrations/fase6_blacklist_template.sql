-- fase6: blacklist de termos e template de mensagem Telegram por usuário

alter table profiles
  add column if not exists blacklist_termos text[] default '{}',
  add column if not exists telegram_template text default null;

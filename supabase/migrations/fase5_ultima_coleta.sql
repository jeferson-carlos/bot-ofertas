-- Registra a última vez que o cron coletou ofertas por usuário
alter table profiles add column if not exists ultima_coleta_em timestamptz;

-- fase7: auto-envio de ofertas para o Telegram (Pro+)
ALTER TABLE profiles
  ADD COLUMN auto_enviar          boolean     NOT NULL DEFAULT false,
  ADD COLUMN ultima_auto_envio_em timestamptz;

-- Unique para upsert idempotente desde webhooks
CREATE UNIQUE INDEX "suscripciones_provider_external_id_key"
  ON "suscripciones" ("provider", "external_id");

-- Index util para consultar la suscripcion activa de un usuario
CREATE INDEX "suscripciones_usuario_id_period_end_idx"
  ON "suscripciones" ("usuario_id", "period_end" DESC);

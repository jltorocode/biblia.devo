-- Admin de Biblias + Permisos por usuario
-- - activa: admin la apaga/prende
-- - es_global: TRUE = visible para todos; FALSE = solo a quienes tienen permiso

ALTER TABLE "versiones_biblia"
  ADD COLUMN IF NOT EXISTS "activa" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "es_global" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS "version_usuario" (
  "version_id" INTEGER NOT NULL,
  "usuario_id" UUID NOT NULL,
  "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("version_id", "usuario_id"),
  CONSTRAINT "version_usuario_version_id_fkey"
    FOREIGN KEY ("version_id") REFERENCES "versiones_biblia"("id") ON DELETE CASCADE,
  CONSTRAINT "version_usuario_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_version_usuario_usuario"
  ON "version_usuario" ("usuario_id");

-- Lista de oraciones + logros (gamificación)

CREATE TABLE IF NOT EXISTS "peticiones" (
  "id" BIGSERIAL PRIMARY KEY,
  "usuario_id" UUID NOT NULL,
  "titulo" VARCHAR(160) NOT NULL,
  "descripcion" TEXT,
  "categoria" VARCHAR(20) NOT NULL DEFAULT 'otro',
  "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  "respuesta" TEXT,
  "fecha_pedida" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "fecha_respondida" TIMESTAMPTZ(6),
  "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "peticiones_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE,
  CONSTRAINT "peticiones_categoria_check"
    CHECK ("categoria" IN ('familia','salud','trabajo','finanzas','espiritual','otro')),
  CONSTRAINT "peticiones_estado_check"
    CHECK ("estado" IN ('pendiente','respondida','archivada'))
);

CREATE INDEX IF NOT EXISTS "idx_peticiones_usuario_estado"
  ON "peticiones" ("usuario_id", "estado", "fecha_pedida" DESC);

CREATE TABLE IF NOT EXISTS "logro_usuario" (
  "id" BIGSERIAL PRIMARY KEY,
  "usuario_id" UUID NOT NULL,
  "slug" VARCHAR(60) NOT NULL,
  "ganado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "logro_usuario_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE,
  UNIQUE ("usuario_id", "slug")
);

CREATE INDEX IF NOT EXISTS "idx_logro_usuario_usuario"
  ON "logro_usuario" ("usuario_id");

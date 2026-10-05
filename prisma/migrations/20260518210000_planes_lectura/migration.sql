-- Planes de lectura bíblica
-- Cuatro tablas: planes_lectura, plan_lectura_dia, plan_usuario, plan_usuario_dia.

CREATE TABLE IF NOT EXISTS "planes_lectura" (
  "id" SERIAL PRIMARY KEY,
  "slug" VARCHAR(60) NOT NULL UNIQUE,
  "nombre" VARCHAR(120) NOT NULL,
  "descripcion" TEXT,
  "emoji" VARCHAR(10),
  "dias" SMALLINT NOT NULL,
  "categoria" VARCHAR(40) NOT NULL,
  "es_destacado" BOOLEAN NOT NULL DEFAULT FALSE,
  "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "plan_lectura_dia" (
  "id" SERIAL PRIMARY KEY,
  "plan_id" INTEGER NOT NULL,
  "dia" SMALLINT NOT NULL,
  "titulo" VARCHAR(120),
  "pasajes" JSONB NOT NULL,
  CONSTRAINT "plan_lectura_dia_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "planes_lectura"("id") ON DELETE CASCADE,
  UNIQUE ("plan_id", "dia")
);

CREATE TABLE IF NOT EXISTS "plan_usuario" (
  "id" BIGSERIAL PRIMARY KEY,
  "usuario_id" UUID NOT NULL,
  "plan_id" INTEGER NOT NULL,
  "fecha_inicio" DATE NOT NULL,
  "completado_en" TIMESTAMPTZ(6),
  "abandonado_en" TIMESTAMPTZ(6),
  "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "plan_usuario_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE,
  CONSTRAINT "plan_usuario_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "planes_lectura"("id")
);

CREATE INDEX IF NOT EXISTS "idx_plan_usuario_usuario"
  ON "plan_usuario" ("usuario_id");

CREATE TABLE IF NOT EXISTS "plan_usuario_dia" (
  "id" BIGSERIAL PRIMARY KEY,
  "plan_usuario_id" BIGINT NOT NULL,
  "dia" SMALLINT NOT NULL,
  "leido_en" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "notas" TEXT,
  CONSTRAINT "plan_usuario_dia_plan_usuario_id_fkey"
    FOREIGN KEY ("plan_usuario_id") REFERENCES "plan_usuario"("id") ON DELETE CASCADE,
  UNIQUE ("plan_usuario_id", "dia")
);

CREATE INDEX IF NOT EXISTS "idx_plan_usuario_dia"
  ON "plan_usuario_dia" ("plan_usuario_id", "dia");

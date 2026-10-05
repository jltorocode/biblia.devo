-- CreateTable
CREATE TABLE "entradas" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "modo" VARCHAR(20) NOT NULL,
    "estado_id" INTEGER,
    "area" VARCHAR(20),
    "versiculo_id" BIGINT,
    "lectura_inicio_id" BIGINT,
    "lectura_fin_id" BIGINT,
    "nota" TEXT,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entradas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_entradas_usuario_fecha" ON "entradas"("usuario_id", "fecha" DESC);

-- CreateIndex
CREATE INDEX "idx_entradas_usuario_creado" ON "entradas"("usuario_id", "creado_en" DESC);

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados_animo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_versiculo_id_fkey" FOREIGN KEY ("versiculo_id") REFERENCES "versiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_lectura_inicio_id_fkey" FOREIGN KEY ("lectura_inicio_id") REFERENCES "versiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_lectura_fin_id_fkey" FOREIGN KEY ("lectura_fin_id") REFERENCES "versiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CheckConstraint: modo valido + campos obligatorios por modo
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_modo_valido"
  CHECK ("modo" IN ('estado', 'lectura', 'conversacion'));

ALTER TABLE "entradas" ADD CONSTRAINT "entradas_modo_estado_campos"
  CHECK (
    "modo" <> 'estado' OR ("estado_id" IS NOT NULL AND "versiculo_id" IS NOT NULL)
  );

ALTER TABLE "entradas" ADD CONSTRAINT "entradas_modo_conversacion_campos"
  CHECK (
    "modo" <> 'conversacion' OR (
      "estado_id" IS NOT NULL AND "area" IS NOT NULL AND "versiculo_id" IS NOT NULL
    )
  );

ALTER TABLE "entradas" ADD CONSTRAINT "entradas_modo_lectura_campos"
  CHECK (
    "modo" <> 'lectura' OR "lectura_inicio_id" IS NOT NULL
  );

-- Backfill: cada fila del historial con versiculo se vuelve una entrada
-- modo='estado'. La fecha se deriva del creado_en truncado a dia (UTC).
-- Idempotente vee NOT EXISTS para no duplicar si la migracion se re-corre.
INSERT INTO "entradas" (
  "usuario_id", "fecha", "modo", "estado_id", "versiculo_id",
  "creado_en", "actualizado_en"
)
SELECT
  h."usuario_id",
  (h."creado_en" AT TIME ZONE 'UTC')::date AS fecha,
  'estado'::varchar AS modo,
  h."estado_id",
  h."versiculo_id",
  h."creado_en",
  h."creado_en"
FROM "historial_animo" h
WHERE h."versiculo_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "entradas" e
    WHERE e."usuario_id" = h."usuario_id"
      AND e."creado_en"  = h."creado_en"
      AND e."modo" = 'estado'
  );

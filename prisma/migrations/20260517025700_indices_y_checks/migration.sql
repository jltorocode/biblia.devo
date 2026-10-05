-- Indice GIN para busqueda full-text en versiculos.texto_busqueda
-- Prisma no expresa indices GIN sobre Unsupported(tsvector), por eso van aca.
CREATE INDEX IF NOT EXISTS "idx_versiculos_busqueda"
  ON "versiculos" USING GIN ("texto_busqueda");

-- CHECK constraints: el schema.prisma no los expresa, los hacemos cumplir en DB.
ALTER TABLE "libros"
  ADD CONSTRAINT "libros_testamento_check"
  CHECK ("testamento" IN ('AT', 'NT'));

ALTER TABLE "usuarios"
  ADD CONSTRAINT "usuarios_rol_check"
  CHECK ("rol" IN ('usuario', 'pastor', 'admin'));

ALTER TABLE "versiculo_estado"
  ADD CONSTRAINT "versiculo_estado_relevancia_check"
  CHECK ("relevancia" BETWEEN 1 AND 10);

ALTER TABLE "versiculo_estado"
  ADD CONSTRAINT "versiculo_estado_intensidad_check"
  CHECK ("intensidad" IS NULL OR "intensidad" BETWEEN 1 AND 3);

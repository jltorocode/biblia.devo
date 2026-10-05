-- pgvector + columna embedding para los versiculos.
-- Modelo: intfloat/multilingual-e5-small → 384 dimensiones.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "versiculos" ADD COLUMN "embedding" vector(384);

-- IVFFlat index sobre la columna embedding usando coseno como metrica.
-- Listas = ~sqrt(31102) ≈ 176, redondeamos a 200 para balance.
-- El index se construye DESPUES del seed (vacio rinde mal). Lo creamos aca
-- para que existan estructuras; lo "rebuildeamos" tras el seed via VACUUM.
CREATE INDEX IF NOT EXISTS "idx_versiculos_embedding"
  ON "versiculos" USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 200);

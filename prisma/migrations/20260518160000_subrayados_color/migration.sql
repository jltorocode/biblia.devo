-- Agregar columna `color` a versiculos_guardados para soportar subrayados.
-- Valores aceptados: 'amarillo' | 'rosa' | 'azul' | 'verde' (CHECK).
-- NULL = guardado clasico sin color.

ALTER TABLE "versiculos_guardados" ADD COLUMN "color" VARCHAR(20);

ALTER TABLE "versiculos_guardados" ADD CONSTRAINT "versiculos_guardados_color_valido"
  CHECK ("color" IS NULL OR "color" IN ('amarillo', 'rosa', 'azul', 'verde'));

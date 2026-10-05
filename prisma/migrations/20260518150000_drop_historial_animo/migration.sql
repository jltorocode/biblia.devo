-- Drop la tabla historial_animo: fue reemplazada por `entradas` y los
-- consumidores fueron migrados. El backfill ya se hizo.

DROP TABLE IF EXISTS "historial_animo";

// Carga las embeddings de intents precomputadas (datos/intent-embeddings.json)
// y resuelve candidatos via pgvector similarity contra la columna
// `versiculos.embedding`.
//
// El JSON se commitea al repo: en runtime no se necesita el modelo. Solo
// lectura del JSON + query SQL.

import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { intentKey } from "@/lib/embeddings/intents";

const RUTA_JSON = path.join(process.cwd(), "datos", "intent-embeddings.json");

let _cache: Record<string, number[]> | null = null;

async function cargarEmbeddings(): Promise<Record<string, number[]>> {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(RUTA_JSON, "utf-8");
    _cache = JSON.parse(raw) as Record<string, number[]>;
    return _cache;
  } catch {
    // Sin JSON aun (seed pendiente) — devolvemos {} y el caller cae a curado
    _cache = {};
    return _cache;
  }
}

function vectorALiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

/**
 * Top-K versiculos mas cercanos al intent, via pgvector cosine similarity.
 * Devuelve solo los IDs (en orden).
 */
export async function candidatosSemanticos(opts: {
  estadoSlug: string;
  areaSlug: string | null;
  k: number;
}): Promise<bigint[]> {
  const embeddings = await cargarEmbeddings();
  // Probamos primero estado×area, fallback a solo estado
  const keyComp = intentKey(opts.estadoSlug, opts.areaSlug);
  const keyEst = intentKey(opts.estadoSlug, null);
  const vec = embeddings[keyComp] ?? embeddings[keyEst];
  if (!vec) return [];

  // pgvector cosine distance: <=> en el operador. Mas chico = mas parecido.
  const lit = vectorALiteral(vec);
  const rows = await prisma.$queryRawUnsafe<Array<{ id: bigint }>>(
    `SELECT id FROM versiculos
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector ASC
     LIMIT $2`,
    lit,
    opts.k,
  );
  return rows.map((r) => r.id);
}

/** Solo tests / dev — fuerza recarga del JSON. */
export function _resetEmbeddingsCache() {
  _cache = null;
}

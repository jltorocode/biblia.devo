/**
 * Pre-computa los embeddings de cada intent (estado y estado×area) y los
 * guarda como JSON estatico en `datos/intent-embeddings.json`.
 *
 * Este JSON se commitea al repo: el runtime de la app NO necesita el modelo
 * de embeddings. Solo lo lee al iniciar y lo compara contra los embeddings
 * de la DB via pgvector.
 *
 * Uso: `npx tsx prisma/seed/seed-intent-embeddings.ts`
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { embed } from "@/lib/embeddings/model";
import { intentsTotales } from "@/lib/embeddings/intents";

async function main() {
  const intents = intentsTotales();
  console.log(`Total intents a procesar: ${intents.length}`);
  console.log("Cargando modelo…");
  await embed("test", "query");

  console.log("Embedeando intents (modo query)…");
  const vectores = await embed(
    intents.map((i) => i.consulta),
    "query",
  );

  const out: Record<string, number[]> = {};
  intents.forEach((it, idx) => {
    out[it.key] = vectores[idx]!;
  });

  const ruta = path.join(process.cwd(), "datos", "intent-embeddings.json");
  await mkdir(path.dirname(ruta), { recursive: true });
  await writeFile(ruta, JSON.stringify(out));
  const { stat } = await import("node:fs/promises");
  const info = await stat(ruta);
  console.log(`✓ Guardado en ${ruta} (${info.size} bytes)`);
  console.log(`   Claves: ${Object.keys(out).length}, dimension: ${vectores[0]!.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

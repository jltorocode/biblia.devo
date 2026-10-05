/**
 * Pre-computa embeddings de TODOS los versiculos y los guarda en la columna
 * `embedding` (pgvector 384 dim) de la tabla `versiculos`.
 *
 * Idempotente: skipea los que ya tienen embedding (a menos que pases --force).
 *
 * Uso: `npx tsx prisma/seed/seed-embeddings.ts`
 *      `npx tsx prisma/seed/seed-embeddings.ts --force`
 *      `npx tsx prisma/seed/seed-embeddings.ts --batch=64`
 */
import { prisma } from "@/lib/db/prisma";
import { embed } from "@/lib/embeddings/model";

const FORCE = process.argv.includes("--force");
const BATCH_SIZE = (() => {
  const m = process.argv.find((a) => a.startsWith("--batch="));
  return m ? Math.max(1, Math.min(128, Number(m.split("=")[1]))) : 32;
})();

function fmtMs(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m${Math.round(s % 60).toString().padStart(2, "0")}s`;
}

async function main() {
  const [{ total }] = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*)::bigint AS total FROM versiculos
  `;
  const [{ con_emb }] = await prisma.$queryRaw<Array<{ con_emb: bigint }>>`
    SELECT COUNT(*)::bigint AS con_emb FROM versiculos WHERE embedding IS NOT NULL
  `;
  const totalNum = Number(total);
  const yaTienenNum = Number(con_emb);
  const pendientes = FORCE ? totalNum : totalNum - yaTienenNum;

  console.log(
    `Total: ${totalNum} · Ya con embedding: ${yaTienenNum} · Pendientes: ${pendientes}`,
  );
  if (pendientes === 0) {
    console.log("✓ Nada que hacer.");
    return;
  }

  console.log(`Batch size: ${BATCH_SIZE} · Modelo: multilingual-e5-small (384d)`);
  console.log("Cargando modelo (primera vez baja ~110MB)…\n");
  const t0 = Date.now();
  await embed("test", "passage");
  console.log(`Modelo listo en ${fmtMs(Date.now() - t0)}.\n`);

  let procesados = 0;
  let cursorId = "0"; // bigint serializado como string

  while (true) {
    type Row = { id: bigint; texto: string };
    const versiculos = FORCE
      ? await prisma.$queryRaw<Row[]>`
          SELECT id, texto FROM versiculos
          WHERE id > ${BigInt(cursorId)}
          ORDER BY id ASC
          LIMIT ${BATCH_SIZE}
        `
      : await prisma.$queryRaw<Row[]>`
          SELECT id, texto FROM versiculos
          WHERE id > ${BigInt(cursorId)} AND embedding IS NULL
          ORDER BY id ASC
          LIMIT ${BATCH_SIZE}
        `;

    if (versiculos.length === 0) break;

    const tBatch = Date.now();
    const vectores = await embed(versiculos.map((v) => v.texto), "passage");

    // Bulk update con transaccion
    await prisma.$transaction(
      vectores.map((vec, i) => {
        const literal = `[${vec.join(",")}]`;
        return prisma.$executeRawUnsafe(
          `UPDATE versiculos SET embedding = $1::vector WHERE id = $2`,
          literal,
          versiculos[i]!.id,
        );
      }),
    );

    procesados += versiculos.length;
    cursorId = versiculos.at(-1)!.id.toString();

    const dt = Date.now() - tBatch;
    const rate = versiculos.length / (dt / 1000);
    const restante = Math.max(0, pendientes - procesados);
    const eta = restante / Math.max(1, rate);
    process.stdout.write(
      `\r  ${procesados}/${pendientes} (${(procesados * 100 / pendientes).toFixed(1)}%) · ${rate.toFixed(1)} v/s · ETA ${fmtMs(eta * 1000)}    `,
    );
  }

  console.log("\n\nRebuild del IVFFlat index…");
  await prisma.$executeRawUnsafe(`REINDEX INDEX idx_versiculos_embedding`);
  console.log("✓ Seed de embeddings terminado.");
}

main()
  .catch((err) => {
    console.error("\n[seed-embeddings] error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

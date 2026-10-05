import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { LIBROS } from "@/lib/libros";

const TOTAL_VERSICULOS_ESPERADO = 31_102;
const BATCH_SIZE = 1_000;

interface JsonBiblia {
  translation: string;
  books: Array<{
    name: string;
    chapters: Array<{
      chapter: number;
      verses: Array<{ verse: number; text: string }>;
    }>;
  }>;
}

export async function seedBiblia(): Promise<void> {
  const archivo = path.resolve(process.cwd(), "datos/biblia-rv1909.json");
  if (!fs.existsSync(archivo)) {
    throw new Error(
      `Falta ${archivo}. Corré 'tsx datos/descargar-biblia.ts' para bajarlo.`,
    );
  }
  const biblia = JSON.parse(fs.readFileSync(archivo, "utf-8")) as JsonBiblia;

  if (biblia.books.length !== LIBROS.length) {
    throw new Error(
      `Esperaba ${LIBROS.length} libros en el JSON, vinieron ${biblia.books.length}.`,
    );
  }

  // 1) Upsert version
  const version = await prisma.versionBiblia.upsert({
    where: { codigo: "rv1909" },
    create: {
      codigo: "rv1909",
      nombre: "Reina-Valera 1909",
      idioma: "es",
      esDefault: true,
      esPremium: false,
      licencia: "Dominio público",
    },
    update: {},
  });

  // 2) Idempotencia: si ya está completa, salimos.
  const yaInsertados = await prisma.versiculo.count({
    where: { versionId: version.id },
  });
  if (yaInsertados === TOTAL_VERSICULOS_ESPERADO) {
    console.log(`  Ya hay ${yaInsertados} versículos en RV1909 — nada que hacer.`);
    return;
  }
  if (yaInsertados > 0) {
    console.log(
      `  RV1909 incompleta (${yaInsertados}/${TOTAL_VERSICULOS_ESPERADO}) — borrando y re-seedeando.`,
    );
    await prisma.versiculo.deleteMany({ where: { versionId: version.id } });
  }

  // 3) Mapear libro_id por orden (el JSON viene en orden canónico)
  const libros = await prisma.libro.findMany({
    orderBy: { orden: "asc" },
    select: { id: true, orden: true, codigo: true, nombre: true },
  });
  if (libros.length !== LIBROS.length) {
    throw new Error(
      `La tabla 'libros' tiene ${libros.length} filas, esperaba ${LIBROS.length}. ` +
        `Corré seed-libros primero.`,
    );
  }
  const libroIdPorOrden = new Map(libros.map((l) => [l.orden, l.id]));

  // 4) Aplanar y validar
  type Fila = {
    versionId: number;
    libroId: number;
    capitulo: number;
    versiculo: number;
    texto: string;
  };
  const filas: Fila[] = [];

  for (let i = 0; i < biblia.books.length; i++) {
    const libroJson = biblia.books[i];
    const orden = i + 1;
    const libroEsperado = LIBROS[i];
    const libroId = libroIdPorOrden.get(orden);
    if (!libroId) throw new Error(`Falta libro en DB con orden=${orden}`);

    if (libroJson.name !== libroEsperado.nombreEn) {
      throw new Error(
        `Orden ${orden}: el JSON dice "${libroJson.name}" pero esperaba "${libroEsperado.nombreEn}".`,
      );
    }

    let totalLibro = 0;
    for (const cap of libroJson.chapters) {
      for (const v of cap.verses) {
        filas.push({
          versionId: version.id,
          libroId,
          capitulo: cap.chapter,
          versiculo: v.verse,
          texto: v.text.trim(),
        });
        totalLibro++;
      }
    }
    console.log(`  ${libroEsperado.nombre.padEnd(20)} ${totalLibro.toString().padStart(5)} versículos ✓`);
  }

  if (filas.length !== TOTAL_VERSICULOS_ESPERADO) {
    throw new Error(
      `Conteo inesperado: ${filas.length} (esperaba ${TOTAL_VERSICULOS_ESPERADO}).`,
    );
  }

  // 5) Insert por lotes
  console.log(`  Insertando ${filas.length} filas en lotes de ${BATCH_SIZE}…`);
  for (let i = 0; i < filas.length; i += BATCH_SIZE) {
    const lote = filas.slice(i, i + BATCH_SIZE);
    await prisma.versiculo.createMany({ data: lote });
  }

  // 6) Poblar tsvector via SQL raw (Prisma no maneja Unsupported(tsvector))
  console.log("  Poblando texto_busqueda (to_tsvector 'spanish')…");
  await prisma.$executeRawUnsafe(
    `UPDATE versiculos SET texto_busqueda = to_tsvector('spanish', texto) WHERE version_id = $1`,
    version.id,
  );

  const finales = await prisma.versiculo.count({ where: { versionId: version.id } });
  console.log(`  ✓ Total RV1909: ${finales} versículos`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedBiblia()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

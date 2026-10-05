// Ingestar una version de Biblia local (JSON) a la DB.
//
// Uso:
//   tsx prisma/seed/ingestar-biblia.ts \
//     --codigo nvi \
//     --nombre "Nueva Versión Internacional" \
//     --archivo datos/biblias/nvi.json \
//     [--licencia "Biblica Inc., 1999, 2015"] \
//     [--privada]           # default: privada (esGlobal=false)
//     [--global]            # fuerza esGlobal=true
//     [--premium]           # esPremium=true
//
// Formato del JSON esperado (igual al de RV1909, scrollmapper-like):
//
//   { books: [{ name: "Genesis", chapters: [{ chapter: 1, verses: [{verse:1, text:"..."}] }] }] }
//
// O variantes que el parser tolera:
//   { translation, books: [{ name|book, chapters: [{ chapter|cap, verses|versos: [...] }] }] }

import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { LIBROS } from "@/lib/libros";

interface JsonBibliaLaxa {
  translation?: string;
  books: Array<{
    name?: string;
    book?: string;
    chapters: Array<{
      chapter?: number;
      cap?: number;
      verses?: Array<{ verse?: number; v?: number; text?: string; t?: string }>;
      versos?: Array<{ verse?: number; v?: number; text?: string; t?: string }>;
    }>;
  }>;
}

interface Args {
  codigo: string;
  nombre: string;
  archivo: string;
  licencia?: string;
  privada: boolean;
  global: boolean;
  premium: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  const codigo = get("--codigo");
  const nombre = get("--nombre");
  const archivo = get("--archivo");
  if (!codigo || !nombre || !archivo) {
    console.error("Uso: tsx prisma/seed/ingestar-biblia.ts --codigo X --nombre Y --archivo Z [--licencia L] [--privada|--global] [--premium]");
    process.exit(1);
  }
  return {
    codigo: codigo.toLowerCase(),
    nombre,
    archivo,
    licencia: get("--licencia"),
    privada: args.includes("--privada") || !args.includes("--global"),
    global: args.includes("--global"),
    premium: args.includes("--premium"),
  };
}

const BATCH_SIZE = 1_000;

export async function ingestarBiblia(a: Args): Promise<void> {
  const archivo = path.resolve(process.cwd(), a.archivo);
  if (!fs.existsSync(archivo)) {
    throw new Error(`No existe ${archivo}`);
  }
  const biblia = JSON.parse(fs.readFileSync(archivo, "utf-8")) as JsonBibliaLaxa;

  if (!Array.isArray(biblia.books)) {
    throw new Error(`El JSON no tiene { books: [] } — formato no reconocido`);
  }
  if (biblia.books.length !== LIBROS.length) {
    throw new Error(
      `Esperaba ${LIBROS.length} libros, vinieron ${biblia.books.length}. ` +
        `Revisá que sea una Biblia protestante completa (66 libros).`,
    );
  }

  // Upsert version
  const version = await prisma.versionBiblia.upsert({
    where: { codigo: a.codigo },
    create: {
      codigo: a.codigo,
      nombre: a.nombre,
      idioma: "es",
      esDefault: false,
      esPremium: a.premium,
      activa: true,
      esGlobal: a.global,
      licencia: a.licencia ?? null,
    },
    update: {
      nombre: a.nombre,
      esPremium: a.premium,
      esGlobal: a.global,
      licencia: a.licencia ?? undefined,
    },
  });
  console.log(`Version: ${version.codigo} → id=${version.id}, esGlobal=${version.esGlobal}, activa=${version.activa}`);

  const ya = await prisma.versiculo.count({ where: { versionId: version.id } });
  if (ya > 0) {
    console.log(`  Limpiando ${ya} versículos previos de ${a.codigo}…`);
    await prisma.versiculo.deleteMany({ where: { versionId: version.id } });
  }

  const libros = await prisma.libro.findMany({
    orderBy: { orden: "asc" },
    select: { id: true, orden: true },
  });
  const libroIdPorOrden = new Map(libros.map((l) => [l.orden, l.id]));

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
    const libroId = libroIdPorOrden.get(orden);
    if (!libroId) throw new Error(`Falta libro en DB orden=${orden}`);

    const capitulosJson = libroJson.chapters ?? [];
    let totalLibro = 0;
    for (const cap of capitulosJson) {
      const capNum = cap.chapter ?? cap.cap;
      if (capNum == null) throw new Error(`Sin numero de capitulo en ${LIBROS[i].nombre}`);
      const versos = cap.verses ?? cap.versos ?? [];
      for (const v of versos) {
        const vNum = v.verse ?? v.v;
        const t = (v.text ?? v.t ?? "").trim();
        if (vNum == null || !t) continue;
        filas.push({
          versionId: version.id,
          libroId,
          capitulo: capNum,
          versiculo: vNum,
          texto: t,
        });
        totalLibro++;
      }
    }
    process.stdout.write(`  ${LIBROS[i].nombre.padEnd(22)} ${String(totalLibro).padStart(5)} ✓\n`);
  }

  console.log(`Insertando ${filas.length} filas en lotes de ${BATCH_SIZE}…`);
  for (let i = 0; i < filas.length; i += BATCH_SIZE) {
    await prisma.versiculo.createMany({ data: filas.slice(i, i + BATCH_SIZE) });
  }

  console.log(`  Poblando texto_busqueda…`);
  await prisma.$executeRawUnsafe(
    `UPDATE versiculos SET texto_busqueda = to_tsvector('spanish', texto) WHERE version_id = $1`,
    version.id,
  );

  const finales = await prisma.versiculo.count({ where: { versionId: version.id } });
  console.log(`✓ ${a.nombre} (${a.codigo}): ${finales} versículos ingestados.`);
  console.log(
    `  Visibilidad: ${version.esGlobal ? "GLOBAL (todos)" : "PRIVADA (solo usuarios con permiso)"}` +
      ` · activa=${version.activa}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestarBiblia(parseArgs())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

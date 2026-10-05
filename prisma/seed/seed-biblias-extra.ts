// Descarga + ingesta biblias en español de fuentes públicas a la DB.
//
// Catálogo:
//   - bes   → Biblia en Español Sencillo (CC, español simple)
//   - vbl   → Versión Biblia Libre (CC, moderno)
//   - pddpt → "Palabra de Dios para ti" (similar a PDT pero NO la de Bible League)
//   - rv1865 → Reina-Valera 1865 (dominio público)
//
// IMPORTANTE: NVI, RVR1960, PDT (Bible League) NO están en repos públicos
// con textos limpios. Para esas usá api.bible (ya integrado).
//
// Uso:
//   tsx prisma/seed/seed-biblias-extra.ts                # todas
//   tsx prisma/seed/seed-biblias-extra.ts vbl bes        # solo algunas

import { prisma } from "@/lib/db/prisma";
import { LIBROS } from "@/lib/libros";

interface Catalogo {
  codigo: string;          // codigo interno en NUESTRA DB
  nombre: string;
  licencia: string;
  esGlobal: boolean;       // true = visible para todos
  fuente:
    | { tipo: "wldeh"; bibleId: string }            // un JSON por capitulo
    | { tipo: "scrollmapper"; archivo: string }     // un JSON entero
    | { tipo: "helloao"; translationId: string };   // bible.helloao.org
}

const CATALOGO: Catalogo[] = [
  {
    codigo: "vbl",
    nombre: "Versión Biblia Libre",
    licencia: "Free Bible Version — Creative Commons",
    esGlobal: true,
    fuente: { tipo: "wldeh", bibleId: "es-vbl" },
  },
  {
    codigo: "bes",
    nombre: "Biblia en Español Sencillo",
    licencia: "Public domain / CC",
    esGlobal: true,
    fuente: { tipo: "wldeh", bibleId: "es-bes" },
  },
  {
    codigo: "pddpt",
    nombre: "Palabra de Dios para ti",
    licencia: "Sin copyright declarado",
    esGlobal: true,
    fuente: { tipo: "wldeh", bibleId: "es-pddpt" },
  },
  {
    codigo: "rv1865",
    nombre: "Reina-Valera 1865",
    licencia: "Dominio público",
    esGlobal: true,
    fuente: { tipo: "scrollmapper", archivo: "SpaRV1865.json" },
  },
  {
    codigo: "rvg",
    nombre: "Reina-Valera Gómez 2010",
    licencia: "RVG — libre uso (Iglesia Bautista Bíblica)",
    esGlobal: true,
    fuente: { tipo: "helloao", translationId: "spa_rvg" },
  },
  {
    codigo: "blm",
    nombre: "Spanish Free Bible for the World",
    licencia: "CC — eBible / helloao",
    esGlobal: true,
    fuente: { tipo: "helloao", translationId: "spa_blm" },
  },
  {
    codigo: "v2p",
    nombre: "Reina-Valera Purificada",
    licencia: "Libre uso",
    esGlobal: true,
    fuente: { tipo: "helloao", translationId: "spa_v2p" },
  },
];

// Nombres de libros en wldeh — cada slot es una lista de candidatos
// porque varias biblias usan variantes (cantares/cantardeloscantares, ageo/hageo).
// Orden canónico AT→NT. Coincide con LIBROS por índice.
const NOMBRES_WLDEH: string[][] = [
  ["génesis"],
  ["éxodo"],
  ["levítico"],
  ["números"],
  ["deuteronomio"],
  ["josué"],
  ["jueces"],
  ["rut"],
  ["1samuel"],
  ["2samuel"],
  ["1reyes"],
  ["2reyes"],
  ["1crónicas"],
  ["2crónicas"],
  ["esdras"],
  ["nehemías"],
  ["ester"],
  ["job"],
  ["salmos"],
  ["proverbios"],
  ["eclesiastés"],
  ["cantares", "cantardeloscantares"],
  ["isaías"],
  ["jeremías"],
  ["lamentaciones"],
  ["ezequiel"],
  ["daniel"],
  ["oseas"],
  ["joel"],
  ["amós"],
  ["abdías"],
  ["jonás"],
  ["miqueas"],
  ["nahúm", "nahum"],
  ["habacuc"],
  ["sofonías"],
  ["hageo", "ageo"],
  ["zacarías"],
  ["malaquías"],
  ["mateo"],
  ["marcos"],
  ["lucas"],
  ["juan"],
  ["hechos"],
  ["romanos"],
  ["1corintios"],
  ["2corintios"],
  ["gálatas"],
  ["efesios"],
  ["filipenses"],
  ["colosenses"],
  ["1tesalonicenses"],
  ["2tesalonicenses"],
  ["1timoteo"],
  ["2timoteo"],
  ["tito"],
  ["filemón"],
  ["hebreos"],
  ["santiago"],
  ["1pedro"],
  ["2pedro"],
  ["1juan"],
  ["2juan"],
  ["3juan"],
  ["judas"],
  ["apocalipsis"],
];

if (NOMBRES_WLDEH.length !== LIBROS.length) {
  throw new Error(`NOMBRES_WLDEH tiene ${NOMBRES_WLDEH.length} libros, esperaba ${LIBROS.length}`);
}

const BATCH_SIZE = 1_000;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return (await res.json()) as T;
}

type WldehVerse = { book: string; chapter: string; verse: string; text: string };
type WldehChapter = { data: WldehVerse[] };

async function resolverNombreLibro(bibleId: string, candidatos: string[]): Promise<string> {
  for (const c of candidatos) {
    const url = `https://raw.githubusercontent.com/wldeh/bible-api/main/bibles/${bibleId}/books/${encodeURIComponent(c)}/chapters/1.json`;
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.ok) return c;
  }
  throw new Error(`Ninguno de [${candidatos.join(", ")}] funciona en ${bibleId}`);
}

async function descargarWldeh(bibleId: string): Promise<Array<{ libroOrden: number; capitulo: number; versiculo: number; texto: string }>> {
  const filas: Array<{ libroOrden: number; capitulo: number; versiculo: number; texto: string }> = [];

  for (let i = 0; i < NOMBRES_WLDEH.length; i++) {
    const libro = await resolverNombreLibro(bibleId, NOMBRES_WLDEH[i]);
    const libroOrden = i + 1;
    const libroEnc = encodeURIComponent(libro);
    const numCaps = LIBROS[i].numCapitulos;

    process.stdout.write(`  ${LIBROS[i].nombre.padEnd(22)}`);
    let totalLibro = 0;
    // Bajamos en paralelo limitado para no asfixiar github
    const chunkSize = 5;
    for (let cap = 1; cap <= numCaps; cap += chunkSize) {
      const tasks: Promise<WldehChapter | null>[] = [];
      for (let c = cap; c < cap + chunkSize && c <= numCaps; c++) {
        const url = `https://raw.githubusercontent.com/wldeh/bible-api/main/bibles/${bibleId}/books/${libroEnc}/chapters/${c}.json`;
        tasks.push(fetchJson<WldehChapter>(url).catch(() => null));
      }
      const resultados = await Promise.all(tasks);
      resultados.forEach((data, idx) => {
        const numCap = cap + idx;
        if (!data || !Array.isArray(data.data)) {
          throw new Error(`Falló bajada ${bibleId} ${libro} cap ${numCap}`);
        }
        for (const v of data.data) {
          // wldeh trae a veces verse como "" o "1-2" — descartamos los no-numeros
          const verseNum = Number((v.verse ?? "").toString().split(/[-,\s]/)[0]);
          const capNum = Number((v.chapter ?? "").toString());
          const t = (v.text ?? "").trim();
          if (!t || !Number.isInteger(verseNum) || !Number.isInteger(capNum) || verseNum < 1) continue;
          filas.push({
            libroOrden,
            capitulo: capNum,
            versiculo: verseNum,
            texto: t,
          });
          totalLibro++;
        }
      });
    }
    console.log(` ${String(totalLibro).padStart(5)} ✓`);
  }
  return filas;
}

type ScrollmapperJson = {
  books: Array<{
    name: string;
    chapters: Array<{ chapter: number; verses: Array<{ verse: number; text: string }> }>;
  }>;
};

async function descargarScrollmapper(archivo: string): Promise<Array<{ libroOrden: number; capitulo: number; versiculo: number; texto: string }>> {
  const url = `https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/${archivo}`;
  const data = await fetchJson<ScrollmapperJson>(url);
  const filas: Array<{ libroOrden: number; capitulo: number; versiculo: number; texto: string }> = [];

  if (data.books.length !== LIBROS.length) {
    throw new Error(`${archivo}: esperaba ${LIBROS.length} libros, vinieron ${data.books.length}`);
  }
  for (let i = 0; i < data.books.length; i++) {
    const libroOrden = i + 1;
    let totalLibro = 0;
    for (const cap of data.books[i].chapters) {
      for (const v of cap.verses) {
        const t = (v.text ?? "").trim();
        if (!t) continue;
        filas.push({ libroOrden, capitulo: cap.chapter, versiculo: v.verse, texto: t });
        totalLibro++;
      }
    }
    console.log(`  ${LIBROS[i].nombre.padEnd(22)} ${String(totalLibro).padStart(5)} ${totalLibro === 0 ? "(vacío)" : "✓"}`);
  }
  return filas;
}

// helloao: un JSON por capitulo, formato { chapter: { content: [ { type, number, content[] } ] } }
type HelloaoVerseItem =
  | string
  | { text?: string; [k: string]: unknown };
type HelloaoChapter = {
  chapter: {
    number: number;
    content: Array<{ type?: string; number?: number; content?: HelloaoVerseItem[] }>;
  };
};

function extraerTextoHelloao(items?: HelloaoVerseItem[]): string {
  if (!Array.isArray(items)) return "";
  const partes: string[] = [];
  for (const it of items) {
    if (typeof it === "string") partes.push(it);
    else if (it && typeof it === "object" && typeof it.text === "string") partes.push(it.text);
  }
  return partes.join("").replace(/\s+/g, " ").trim();
}

async function descargarHelloao(translationId: string): Promise<Array<{ libroOrden: number; capitulo: number; versiculo: number; texto: string }>> {
  const filas: Array<{ libroOrden: number; capitulo: number; versiculo: number; texto: string }> = [];

  for (let i = 0; i < LIBROS.length; i++) {
    const libro = LIBROS[i];
    const libroOrden = i + 1;
    const numCaps = libro.numCapitulos;

    process.stdout.write(`  ${libro.nombre.padEnd(22)}`);
    let totalLibro = 0;
    const chunkSize = 5;
    for (let cap = 1; cap <= numCaps; cap += chunkSize) {
      const tasks: Promise<HelloaoChapter | null>[] = [];
      for (let c = cap; c < cap + chunkSize && c <= numCaps; c++) {
        const url = `https://bible.helloao.org/api/${translationId}/${libro.codigo}/${c}.json`;
        tasks.push(fetchJson<HelloaoChapter>(url).catch(() => null));
      }
      const resultados = await Promise.all(tasks);
      resultados.forEach((data, idx) => {
        const numCap = cap + idx;
        if (!data?.chapter?.content) {
          throw new Error(`Falló bajada ${translationId} ${libro.codigo} cap ${numCap}`);
        }
        for (const item of data.chapter.content) {
          if (item.type !== "verse" || item.number == null) continue;
          const t = extraerTextoHelloao(item.content);
          if (!t) continue;
          filas.push({
            libroOrden,
            capitulo: numCap,
            versiculo: item.number,
            texto: t,
          });
          totalLibro++;
        }
      });
    }
    console.log(` ${String(totalLibro).padStart(5)} ✓`);
  }
  return filas;
}

async function procesar(c: Catalogo): Promise<void> {
  console.log(`\n━━━ ${c.nombre} (${c.codigo}) ━━━`);
  let filasRaw: Array<{ libroOrden: number; capitulo: number; versiculo: number; texto: string }>;
  try {
    if (c.fuente.tipo === "wldeh") filasRaw = await descargarWldeh(c.fuente.bibleId);
    else if (c.fuente.tipo === "scrollmapper") filasRaw = await descargarScrollmapper(c.fuente.archivo);
    else filasRaw = await descargarHelloao(c.fuente.translationId);
  } catch (err) {
    console.error(`  ✗ Falló descarga: ${(err as Error).message}`);
    return;
  }

  if (filasRaw.length === 0) {
    console.error(`  ✗ No vino ningún versículo — saltando.`);
    return;
  }

  // Upsert version
  const version = await prisma.versionBiblia.upsert({
    where: { codigo: c.codigo },
    create: {
      codigo: c.codigo,
      nombre: c.nombre,
      idioma: "es",
      esDefault: false,
      esPremium: false,
      activa: true,
      esGlobal: c.esGlobal,
      licencia: c.licencia,
    },
    update: {
      nombre: c.nombre,
      licencia: c.licencia,
      // No tocamos activa/esGlobal — son admin-toggles
    },
  });

  const ya = await prisma.versiculo.count({ where: { versionId: version.id } });
  if (ya > 0) {
    console.log(`  Limpiando ${ya} versículos previos…`);
    await prisma.versiculo.deleteMany({ where: { versionId: version.id } });
  }

  // Mapear libroOrden → libroId
  const libros = await prisma.libro.findMany({ select: { id: true, orden: true } });
  const libroIdPorOrden = new Map(libros.map((l) => [l.orden, l.id]));

  // Deduplicar por (libro, cap, verso). wldeh tiene casos donde:
  //  (a) el mismo verso aparece duplicado IDENTICO → conservar uno.
  //  (b) un verso es prefijo/sufijo de otro → conservar el más largo.
  //  (c) son verdaderos sub-versos partidos (1a + 1b) → concatenar.
  const porClave = new Map<string, { libroId: number; capitulo: number; versiculo: number; texto: string }>();
  let fusionados = 0;
  let dupsExactos = 0;
  for (const f of filasRaw) {
    const libroId = libroIdPorOrden.get(f.libroOrden)!;
    const k = `${libroId}:${f.capitulo}:${f.versiculo}`;
    const ex = porClave.get(k);
    if (!ex) {
      porClave.set(k, { libroId, capitulo: f.capitulo, versiculo: f.versiculo, texto: f.texto });
      continue;
    }
    const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
    const a = norm(ex.texto);
    const b = norm(f.texto);
    if (a === b) {
      dupsExactos++; // (a) idéntico — ignorar
      continue;
    }
    if (a.includes(b)) {
      dupsExactos++; // ex ya contiene al nuevo
      continue;
    }
    if (b.includes(a)) {
      ex.texto = f.texto; // (b) nuevo es más completo
      dupsExactos++;
      continue;
    }
    // (c) sub-versos genuinos
    ex.texto = `${ex.texto} ${f.texto}`.replace(/\s+/g, " ").trim();
    fusionados++;
  }
  if (dupsExactos > 0) console.log(`  ⚠ ${dupsExactos} duplicados exactos descartados`);
  if (fusionados > 0) console.log(`  ⚠ ${fusionados} sub-versos fusionados (1a+1b)`);

  const filas = Array.from(porClave.values()).map((f) => ({
    versionId: version.id,
    libroId: f.libroId,
    capitulo: f.capitulo,
    versiculo: f.versiculo,
    texto: f.texto,
  }));

  console.log(`  Insertando ${filas.length} filas…`);
  for (let i = 0; i < filas.length; i += BATCH_SIZE) {
    await prisma.versiculo.createMany({ data: filas.slice(i, i + BATCH_SIZE) });
  }

  console.log(`  Poblando tsvector…`);
  await prisma.$executeRawUnsafe(
    `UPDATE versiculos SET texto_busqueda = to_tsvector('spanish', texto) WHERE version_id = $1`,
    version.id,
  );

  console.log(`  ✓ ${c.nombre}: ${filas.length} versículos · esGlobal=${c.esGlobal} · activa=true`);
}

async function main(): Promise<void> {
  const filtro = process.argv.slice(2);
  const objetivo = filtro.length > 0
    ? CATALOGO.filter((c) => filtro.includes(c.codigo))
    : CATALOGO;

  if (objetivo.length === 0) {
    console.error(`Ningún match. Disponibles: ${CATALOGO.map((c) => c.codigo).join(", ")}`);
    process.exit(1);
  }

  for (const c of objetivo) {
    await procesar(c);
  }

  console.log("\n━━━ Resumen ━━━");
  const todas = await prisma.versionBiblia.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { versiculos: true } } },
  });
  for (const v of todas) {
    console.log(
      `  [${v.id}] ${v.codigo.padEnd(8)} ${v.nombre.padEnd(40)} ${String(v._count.versiculos).padStart(5)} versos  ` +
        `${v.activa ? "✓" : "✗"} ${v.esGlobal ? "global" : "privada"}`,
    );
  }
  console.log(
    `\nNVI / RVR1960 / PDT (copyright fuerte) → usá api.bible (BIBLE_API_KEY en .env + tsx prisma/seed/seed-versiones-api.ts).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

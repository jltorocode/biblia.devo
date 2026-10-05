// Búsqueda libre: texto natural → semantic search + detección de referencias.

import { prisma } from "@/lib/db/prisma";
import { embed } from "@/lib/embeddings/model";
import { LIBROS } from "@/lib/libros";

// Mapeo nombre/abreviatura → código OSIS
const NOMBRES_LIBRO = new Map<string, string>();
for (const l of LIBROS) {
  NOMBRES_LIBRO.set(l.nombre.toLowerCase(), l.codigo);
  NOMBRES_LIBRO.set(l.nombre.toLowerCase().replace(/[áéíóúñ]/g, (c) => {
    const map: Record<string, string> = { á: "a", é: "e", í: "i", ó: "o", ú: "u", ñ: "n" };
    return map[c] ?? c;
  }), l.codigo);
  NOMBRES_LIBRO.set(l.nombreCorto.toLowerCase(), l.codigo);
}
// Alias adicionales comunes (sin tildes / variantes)
const ALIAS: Record<string, string> = {
  "salmo": "PSA",
  "salmos": "PSA",
  "sal": "PSA",
  "prov": "PRO",
  "proverbio": "PRO",
  "proverbios": "PRO",
  "ec": "ECC",
  "ecl": "ECC",
  "cant": "SNG",
  "is": "ISA",
  "isa": "ISA",
  "jer": "JER",
  "lam": "LAM",
  "ez": "EZK",
  "dn": "DAN",
  "dan": "DAN",
  "mt": "MAT",
  "mat": "MAT",
  "mc": "MRK",
  "mr": "MRK",
  "lc": "LUK",
  "lu": "LUK",
  "jn": "JHN",
  "ju": "JHN",
  "juan": "JHN",
  "hch": "ACT",
  "hechos": "ACT",
  "ro": "ROM",
  "rom": "ROM",
  "ga": "GAL",
  "gal": "GAL",
  "ef": "EPH",
  "fil": "PHP",
  "flp": "PHP",
  "col": "COL",
  "1 tes": "1TH",
  "1 ts": "1TH",
  "1tes": "1TH",
  "2 tes": "2TH",
  "2 ts": "2TH",
  "2tes": "2TH",
  "1 tim": "1TI",
  "1tim": "1TI",
  "2 tim": "2TI",
  "2tim": "2TI",
  "heb": "HEB",
  "sant": "JAS",
  "stg": "JAS",
  "1 ped": "1PE",
  "1ped": "1PE",
  "2 ped": "2PE",
  "2ped": "2PE",
  "1 jn": "1JN",
  "1jn": "1JN",
  "2 jn": "2JN",
  "2jn": "2JN",
  "3 jn": "3JN",
  "3jn": "3JN",
  "ap": "REV",
  "apoc": "REV",
  "apocalipsis": "REV",
  "ge": "GEN",
  "gn": "GEN",
  "génesis": "GEN",
  "genesis": "GEN",
  "exodo": "EXO",
  "éxodo": "EXO",
  "ex": "EXO",
  "exo": "EXO",
};
for (const [k, v] of Object.entries(ALIAS)) NOMBRES_LIBRO.set(k, v);

export interface ReferenciaParsed {
  libroCodigo: string;
  capitulo: number;
  versoInicio?: number;
  versoFin?: number;
}

/**
 * Intenta parsear una referencia bíblica desde texto.
 * "Juan 3:16" / "Génesis 1" / "1 Cor 13:1-7" / "Salmos 23"
 */
export function parsearReferencia(input: string): ReferenciaParsed | null {
  const t = input.trim().toLowerCase();
  // Regex: opcional "1 ", "2 " (libros numerados), nombre, espacio, cap, opcional :verso(-verso)
  const m = t.match(
    /^([123]\s*)?([a-záéíóúñ]+\.?)\s*(\d+)(?::(\d+)(?:[-–](\d+))?)?$/i,
  );
  if (!m) return null;
  const numero = m[1]?.trim() ?? "";
  const nombre = m[2].replace(/\.$/, "");
  const cap = Number(m[3]);
  const vIni = m[4] ? Number(m[4]) : undefined;
  const vFin = m[5] ? Number(m[5]) : undefined;

  // Probar primero con numero+nombre, luego solo nombre
  const claves = numero ? [`${numero} ${nombre}`, `${numero}${nombre}`] : [nombre];
  let codigo: string | undefined;
  for (const k of claves) {
    codigo = NOMBRES_LIBRO.get(k.toLowerCase());
    if (codigo) break;
  }
  if (!codigo) return null;

  const libro = LIBROS.find((l) => l.codigo === codigo);
  if (!libro) return null;
  if (cap < 1 || cap > libro.numCapitulos) return null;

  return {
    libroCodigo: codigo,
    capitulo: cap,
    versoInicio: vIni,
    versoFin: vFin,
  };
}

export interface ResultadoBusqueda {
  versiculoId: string;
  libroCodigo: string;
  libroNombre: string;
  capitulo: number;
  versiculo: number;
  texto: string;
  /** Distance cosine 0-2; menor = más similar */
  distancia: number;
}

function vectorALiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

/**
 * Búsqueda semántica libre. Hace embedding de `query` y trae top-K por
 * distancia cosine en pgvector, sobre la versión RV1909 (donde está la base).
 */
export async function buscarLibre(
  query: string,
  opts: { k?: number; testamento?: "AT" | "NT" } = {},
): Promise<ResultadoBusqueda[]> {
  if (!query.trim()) return [];

  const vectores = await embed([`query: ${query}`], "query");
  const lit = vectorALiteral(vectores[0]);
  const k = opts.k ?? 30;

  // Filtramos por versionId de RV1909 (los embeddings de todas las versiones existen,
  // pero queremos un solo resultado por referencia — usamos RV1909 como canon).
  const rv1909Id = (await prisma.versionBiblia.findUnique({
    where: { codigo: "rv1909" },
    select: { id: true },
  }))?.id;
  if (!rv1909Id) return [];

  const filtroTestamento = opts.testamento
    ? `AND l.testamento = '${opts.testamento === "AT" ? "AT" : "NT"}'`
    : "";

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: bigint;
      libro_codigo: string;
      libro_nombre: string;
      capitulo: number;
      versiculo: number;
      texto: string;
      distancia: number;
    }>
  >(
    `SELECT vs.id, l.codigo AS libro_codigo, l.nombre AS libro_nombre,
            vs.capitulo, vs.versiculo, vs.texto,
            (vs.embedding <=> $1::vector) AS distancia
     FROM versiculos vs
     JOIN libros l ON l.id = vs.libro_id
     WHERE vs.version_id = $2 AND vs.embedding IS NOT NULL ${filtroTestamento}
     ORDER BY vs.embedding <=> $1::vector ASC
     LIMIT $3`,
    lit,
    rv1909Id,
    k,
  );

  return rows.map((r) => ({
    versiculoId: r.id.toString(),
    libroCodigo: r.libro_codigo,
    libroNombre: r.libro_nombre,
    capitulo: r.capitulo,
    versiculo: r.versiculo,
    texto: r.texto,
    distancia: Number(r.distancia),
  }));
}

/**
 * Busca en las notas del usuario (Entrada.nota + PlanUsuarioDia.notas)
 * usando ILIKE simple. Para muchas entradas se podría agregar pg_trgm pero
 * por ahora ILIKE alcanza.
 */
export interface ResultadoNota {
  origen: "entrada" | "plan";
  id: string;
  fecha: string;
  preview: string;
  /** Ruta para ir al detalle. */
  href: string;
}

export async function buscarEnMisNotas(
  usuarioId: string,
  query: string,
): Promise<ResultadoNota[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const [entradas, planDias] = await Promise.all([
    prisma.entrada.findMany({
      where: {
        usuarioId,
        nota: { contains: q, mode: "insensitive" },
      },
      orderBy: { fecha: "desc" },
      take: 30,
      select: {
        id: true,
        fecha: true,
        nota: true,
      },
    }),
    prisma.planUsuarioDia.findMany({
      where: {
        planUsuario: { usuarioId },
        notas: { contains: q, mode: "insensitive" },
      },
      orderBy: { leidoEn: "desc" },
      take: 30,
      select: {
        id: true,
        dia: true,
        leidoEn: true,
        notas: true,
        planUsuarioId: true,
      },
    }),
  ]);

  const out: ResultadoNota[] = [];
  for (const e of entradas) {
    out.push({
      origen: "entrada",
      id: e.id.toString(),
      fecha: e.fecha.toISOString().slice(0, 10),
      preview: previewConDestaque(e.nota ?? "", q),
      href: `/diario/${e.fecha.toISOString().slice(0, 10)}`,
    });
  }
  for (const p of planDias) {
    out.push({
      origen: "plan",
      id: p.id.toString(),
      fecha: p.leidoEn.toISOString().slice(0, 10),
      preview: previewConDestaque(p.notas ?? "", q),
      href: `/planes/mio/${p.dia}`,
    });
  }
  // Orden combinado por fecha desc
  out.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  return out;
}

function previewConDestaque(texto: string, query: string): string {
  const idx = texto.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return texto.slice(0, 160);
  const start = Math.max(0, idx - 60);
  const end = Math.min(texto.length, idx + query.length + 80);
  return (start > 0 ? "…" : "") + texto.slice(start, end) + (end < texto.length ? "…" : "");
}

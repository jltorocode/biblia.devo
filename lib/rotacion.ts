import { prisma } from "@/lib/db/prisma";
import { obtenerOCrearEntradaEstado } from "@/lib/entradas";
import { hoyISO } from "@/lib/utils";
import { candidatosSemanticos } from "@/lib/embeddings/candidatos";

export interface ResultadoVersiculo {
  versiculo: {
    id: bigint;
    capitulo: number;
    versiculo: number;
    texto: string;
  };
  libro: {
    codigo: string;
    nombre: string;
    nombreCorto: string;
  };
  estado: {
    slug: string;
    nombre: string;
    emoji: string | null;
    colorHex: string | null;
  };
  fraseAliento: string;
  versionCodigo: string;
  entrada: {
    id: bigint;
    nota: string | null;
    creada: boolean;
  };
}

interface PedirVersiculoOpts {
  hoy?: string;
  sinEntrada?: boolean;
  area?: string | null;
}

const CANDIDATOS_K = 80;

/**
 * Devuelve un versiculo apropiado para `estadoSlug` (con `area` opcional).
 *
 * Pipeline:
 *  1. Idempotente: si ya hay entrada de hoy con este (estado, area) → ese verso.
 *  2. Si no:
 *     a. Construir lista de candidatos: curados PINNEADOS al inicio +
 *        semantic search top-K del intent (estado, area) desde pgvector.
 *     b. Indice = cantidad de entradas previas del usuario con este estado
 *        (asi cada visita nueva avanza al siguiente).
 *     c. Tomar candidatos[indice mod len].
 *  3. Crear/recuperar entrada del diario con ese verso.
 */
export async function pedirVersiculo(
  usuarioId: string,
  estadoSlug: string,
  opts: PedirVersiculoOpts = {},
): Promise<ResultadoVersiculo> {
  const hoy = opts.hoy ?? hoyISO();
  const hoyDate = new Date(`${hoy}T00:00:00.000Z`);
  const area = opts.area ?? null;

  const estado = await prisma.estadoAnimo.findUnique({ where: { slug: estadoSlug } });
  if (!estado) throw new Error(`Estado desconocido: ${estadoSlug}`);

  // 1) Idempotencia: ¿ya tenemos entrada para hoy con este (estado, area)?
  const entradaHoyMismaCombo = await prisma.entrada.findFirst({
    where: {
      usuarioId,
      estadoId: estado.id,
      fecha: hoyDate,
      area: area ?? null,
      modo: { in: ["estado", "conversacion"] },
    },
    select: { versiculoId: true },
  });

  let versiculoId: bigint;
  if (entradaHoyMismaCombo?.versiculoId) {
    versiculoId = entradaHoyMismaCombo.versiculoId;
  } else {
    versiculoId = await elegirVersiculo({
      usuarioId,
      estadoId: estado.id,
      estadoSlug,
      area,
    });
  }

  // Mantenemos rotacion_usuario actualizada (legacy, otros consumidores lo usan).
  await prisma.rotacionUsuario.upsert({
    where: { usuarioId_estadoId: { usuarioId, estadoId: estado.id } },
    create: { usuarioId, estadoId: estado.id, ultimoIndice: 0, versiculoId, fecha: hoyDate },
    update: { versiculoId, fecha: hoyDate },
  });

  const v = await prisma.versiculo.findUnique({
    where: { id: versiculoId },
    include: { libro: true, version: true },
  });
  if (!v) throw new Error(`Versiculo ${versiculoId} no encontrado`);

  let entradaSalida = { id: BigInt(0), nota: null as string | null, creada: false };
  if (!opts.sinEntrada) {
    const r = await obtenerOCrearEntradaEstado({
      usuarioId,
      estadoId: estado.id,
      versiculoId: v.id,
      area,
      hoy,
    });
    entradaSalida = { id: r.entrada.id, nota: r.entrada.nota ?? null, creada: r.creada };
  }

  return {
    versiculo: {
      id: v.id,
      capitulo: v.capitulo,
      versiculo: v.versiculo,
      texto: v.texto,
    },
    libro: {
      codigo: v.libro.codigo,
      nombre: v.libro.nombre,
      nombreCorto: v.libro.nombreCorto,
    },
    estado: {
      slug: estado.slug,
      nombre: estado.nombre,
      emoji: estado.emoji,
      colorHex: estado.colorHex,
    },
    fraseAliento: estado.fraseAliento,
    versionCodigo: v.version.codigo,
    entrada: entradaSalida,
  };
}

async function elegirVersiculo(opts: {
  usuarioId: string;
  estadoId: number;
  estadoSlug: string;
  area: string | null;
}): Promise<bigint> {
  // CANDIDATOS = curados pinneados + semantic top-K
  const curadosRows = await prisma.versiculoEstado.findMany({
    where: { estadoId: opts.estadoId },
    orderBy: [{ relevancia: "desc" }, { id: "asc" }],
    select: { versiculoId: true },
  });
  const curadosIds = curadosRows.map((r) => r.versiculoId);

  let semanticosIds: bigint[] = [];
  try {
    semanticosIds = await candidatosSemanticos({
      estadoSlug: opts.estadoSlug,
      areaSlug: opts.area,
      k: CANDIDATOS_K,
    });
  } catch (err) {
    console.error("[rotacion] semantic search fallo, uso solo curados", err);
  }

  const seen = new Set<string>();
  const candidatos: bigint[] = [];
  for (const id of curadosIds) {
    const k = id.toString();
    if (!seen.has(k)) {
      seen.add(k);
      candidatos.push(id);
    }
  }
  for (const id of semanticosIds) {
    const k = id.toString();
    if (!seen.has(k)) {
      seen.add(k);
      candidatos.push(id);
    }
  }

  if (candidatos.length === 0) {
    throw new Error(`Sin candidatos para estado ${opts.estadoSlug}`);
  }

  // Indice = cantidad de entradas previas con este estado.
  // Idempotencia "mismo dia mismo combo" ya se maneja antes de llamarme.
  const previas = await prisma.entrada.count({
    where: {
      usuarioId: opts.usuarioId,
      estadoId: opts.estadoId,
      modo: { in: ["estado", "conversacion"] },
    },
  });
  const indice = previas % candidatos.length;
  return candidatos[indice]!;
}

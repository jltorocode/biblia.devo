import { prisma } from "@/lib/db/prisma";
import { LIMITES } from "@/lib/plan-limits";
import { hoyISO } from "@/lib/utils";

export type ModoEntrada = "estado" | "lectura" | "conversacion";

/**
 * Trae la entrada que YA existe hoy para (usuario, modo='estado', estado_id).
 * Idempotente: pedir el mismo estado el mismo dia siempre devuelve la misma.
 */
export async function entradaEstadoHoy(opts: {
  usuarioId: string;
  estadoId: number;
  hoy?: string; // YYYY-MM-DD, para tests
}) {
  const hoy = opts.hoy ?? hoyISO();
  return prisma.entrada.findFirst({
    where: {
      usuarioId: opts.usuarioId,
      estadoId: opts.estadoId,
      modo: "estado",
      fecha: new Date(`${hoy}T00:00:00.000Z`),
    },
  });
}

/**
 * Crea (o devuelve si existe) la entrada de hoy para modo='estado' o
 * modo='conversacion' (depende de si `area` viene seteada).
 *
 * Idempotente por (usuario, fecha, modo, estado_id).
 * Si la entrada existe con un modo distinto al pedido (p.ej. era 'estado' y
 * ahora viene con area → 'conversacion'), actualiza el modo + area.
 */
export async function obtenerOCrearEntradaEstado(opts: {
  usuarioId: string;
  estadoId: number;
  versiculoId: bigint;
  area?: string | null;
  hoy?: string;
}) {
  const modo: ModoEntrada = opts.area ? "conversacion" : "estado";

  // Buscamos cualquier entrada de hoy con este estado, sin importar modo —
  // asi una segunda visita con area "promueve" la entrada existente.
  const hoy = opts.hoy ?? hoyISO();
  const fecha = new Date(`${hoy}T00:00:00.000Z`);
  const existente = await prisma.entrada.findFirst({
    where: {
      usuarioId: opts.usuarioId,
      estadoId: opts.estadoId,
      fecha,
      modo: { in: ["estado", "conversacion"] },
    },
  });
  if (existente) {
    // Si llegamos con area y la existente no la tenia, la promovemos.
    if (opts.area && (existente.modo !== modo || existente.area !== opts.area)) {
      const actualizada = await prisma.entrada.update({
        where: { id: existente.id },
        data: { modo, area: opts.area },
      });
      return { entrada: actualizada, creada: false };
    }
    return { entrada: existente, creada: false };
  }

  const entrada = await prisma.entrada.create({
    data: {
      usuarioId: opts.usuarioId,
      estadoId: opts.estadoId,
      versiculoId: opts.versiculoId,
      area: opts.area ?? null,
      modo,
      fecha,
    },
  });
  return { entrada, creada: true };
}

/** Cantidad de entradas que el usuario ya hizo hoy (todos los modos). */
export async function contarEntradasHoy(usuarioId: string, hoy?: string) {
  const fecha = new Date(`${hoy ?? hoyISO()}T00:00:00.000Z`);
  return prisma.entrada.count({ where: { usuarioId, fecha } });
}

/** Trae todas las entradas del usuario para un dia, ordenadas cronologicamente. */
export async function entradasDelDia(usuarioId: string, hoy?: string) {
  const fecha = new Date(`${hoy ?? hoyISO()}T00:00:00.000Z`);
  return prisma.entrada.findMany({
    where: { usuarioId, fecha },
    orderBy: { creadoEn: "asc" },
    include: {
      estado: {
        select: { slug: true, nombre: true, emoji: true, colorHex: true, fraseAliento: true },
      },
      versiculo: {
        select: {
          id: true,
          capitulo: true,
          versiculo: true,
          texto: true,
          libro: { select: { nombre: true, nombreCorto: true, codigo: true } },
        },
      },
      lecturaInicio: {
        select: {
          capitulo: true,
          versiculo: true,
          libro: { select: { nombre: true, nombreCorto: true, codigo: true } },
        },
      },
      lecturaFin: {
        select: { capitulo: true, versiculo: true },
      },
    },
  });
}

/**
 * Trae las entradas del usuario para un rango de fechas (inclusivo).
 * Para la vista mensual: una entrada "resumen" por dia (la primera).
 * Usado por /diario/mes/[YYYY-MM].
 */
export async function entradasDelMes(opts: {
  usuarioId: string;
  anio: number;
  mes: number; // 1-12
}) {
  const inicio = new Date(Date.UTC(opts.anio, opts.mes - 1, 1));
  const fin = new Date(Date.UTC(opts.anio, opts.mes, 1));
  return prisma.entrada.findMany({
    where: {
      usuarioId: opts.usuarioId,
      fecha: { gte: inicio, lt: fin },
    },
    orderBy: [{ fecha: "asc" }, { creadoEn: "asc" }],
    include: {
      estado: { select: { slug: true, nombre: true, emoji: true, colorHex: true } },
      versiculo: { select: { texto: true } },
      lecturaInicio: {
        select: { capitulo: true, libro: { select: { nombre: true, nombreCorto: true } } },
      },
    },
  });
}

/**
 * ¿Esta peticion debe servirse como "vista previa" (sin crear entrada)?
 *
 * Reglas:
 *  - Premium → nunca vista previa (siempre crea entradas).
 *  - Free que pide el MISMO estado que ya tiene hoy → idempotente, NO es vista
 *    previa (le devolvemos la entrada existente).
 *  - Free que ya alcanzo `entradasPorDia` y pide un estado NUEVO → vista previa
 *    (le mostramos el versiculo pero no guardamos entrada nueva).
 */
export async function debeSerVistaPrevia(opts: {
  usuarioId: string;
  estadoSlug: string;
  esPremium: boolean;
  hoy?: string;
}): Promise<boolean> {
  if (opts.esPremium) return false;

  const fecha = new Date(`${opts.hoy ?? hoyISO()}T00:00:00.000Z`);

  const yaConEseEstado = await prisma.entrada.findFirst({
    where: {
      usuarioId: opts.usuarioId,
      modo: "estado",
      fecha,
      estado: { slug: opts.estadoSlug },
    },
    select: { id: true },
  });
  if (yaConEseEstado) return false;

  const cuantasYa = await prisma.entrada.count({
    where: { usuarioId: opts.usuarioId, fecha },
  });
  return cuantasYa >= LIMITES.FREE.entradasPorDia;
}

/**
 * Crea (o devuelve si existe) la entrada de hoy para modo='lectura'.
 * Idempotente por (usuario, fecha, modo='lectura', lectura_inicio_id).
 */
export async function obtenerOCrearEntradaLectura(opts: {
  usuarioId: string;
  lecturaInicioId: bigint;
  lecturaFinId?: bigint | null;
  hoy?: string;
}) {
  const hoy = opts.hoy ?? hoyISO();
  const fecha = new Date(`${hoy}T00:00:00.000Z`);

  const existente = await prisma.entrada.findFirst({
    where: {
      usuarioId: opts.usuarioId,
      modo: "lectura",
      fecha,
      lecturaInicioId: opts.lecturaInicioId,
    },
  });
  if (existente) return { entrada: existente, creada: false };

  const entrada = await prisma.entrada.create({
    data: {
      usuarioId: opts.usuarioId,
      modo: "lectura",
      fecha,
      lecturaInicioId: opts.lecturaInicioId,
      lecturaFinId: opts.lecturaFinId ?? null,
    },
  });
  return { entrada, creada: true };
}

/** Actualiza la nota de una entrada. Verifica que pertenezca al usuario. */
export async function actualizarNota(opts: {
  entradaId: bigint;
  usuarioId: string;
  nota: string;
}): Promise<{ ok: boolean }> {
  const r = await prisma.entrada.updateMany({
    where: { id: opts.entradaId, usuarioId: opts.usuarioId },
    data: { nota: opts.nota.trim() || null },
  });
  return { ok: r.count > 0 };
}

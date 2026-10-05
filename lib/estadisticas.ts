// Agrega estadísticas del usuario para la página /estadisticas.

import { prisma } from "@/lib/db/prisma";
import { calcularRacha } from "@/lib/racha";

export interface CeldaHeatmap {
  fecha: string; // YYYY-MM-DD
  count: number;
}

export interface EstadisticasUsuario {
  totalEntradas: number;
  totalDiasActivos: number;
  rachaActual: number;
  mejorRacha: number;
  planesIniciados: number;
  planesCompletados: number;
  versosGuardados: number;
  subrayados: number;
  estadoTop: { slug: string; nombre: string; count: number } | null;
  libroTop: { codigo: string; nombre: string; count: number } | null;
  heatmap: CeldaHeatmap[]; // últimos 365 días
  peticionesRespondidas: number;
  peticionesPendientes: number;
}

function aFechaIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function calcularEstadisticas(usuarioId: string): Promise<EstadisticasUsuario> {
  const hoy = new Date();
  const haceUnAnio = new Date(hoy);
  haceUnAnio.setUTCDate(haceUnAnio.getUTCDate() - 364);
  haceUnAnio.setUTCHours(0, 0, 0, 0);

  const [
    totalEntradas,
    racha,
    diasActividad,
    planes,
    versosGuardados,
    subrayados,
    estadoTop,
    libroTop,
    peticionesResp,
    peticionesPend,
  ] = await Promise.all([
    prisma.entrada.count({ where: { usuarioId } }),
    calcularRacha(usuarioId),
    prisma.$queryRaw<Array<{ fecha: Date; count: bigint }>>`
      SELECT fecha, COUNT(*)::bigint AS count
      FROM entradas
      WHERE usuario_id = ${usuarioId}::uuid AND fecha >= ${haceUnAnio}
      GROUP BY fecha
      ORDER BY fecha ASC
    `,
    prisma.planUsuario.groupBy({
      by: ["completadoEn"],
      where: { usuarioId },
      _count: { _all: true },
    }),
    prisma.versiculoGuardado.count({ where: { usuarioId, color: null } }),
    prisma.versiculoGuardado.count({ where: { usuarioId, color: { not: null } } }),
    prisma.entrada.groupBy({
      by: ["estadoId"],
      where: { usuarioId, estadoId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { estadoId: "desc" } },
      take: 1,
    }),
    prisma.$queryRaw<Array<{ libro_id: number; count: bigint }>>`
      SELECT vs.libro_id, COUNT(*)::bigint AS count
      FROM entradas e
      JOIN versiculos vs ON vs.id = e.versiculo_id
      WHERE e.usuario_id = ${usuarioId}::uuid AND e.versiculo_id IS NOT NULL
      GROUP BY vs.libro_id
      ORDER BY count DESC
      LIMIT 1
    `,
    prisma.peticion.count({ where: { usuarioId, estado: "respondida" } }),
    prisma.peticion.count({ where: { usuarioId, estado: "pendiente" } }),
  ]);

  // Heatmap: rellenar 365 días con count=0 si no hay
  const porFecha = new Map(diasActividad.map((d) => [aFechaIso(d.fecha), Number(d.count)]));
  const heatmap: CeldaHeatmap[] = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(haceUnAnio);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = aFechaIso(d);
    heatmap.push({ fecha: iso, count: porFecha.get(iso) ?? 0 });
  }

  // Estado top
  let estadoTopOut: EstadisticasUsuario["estadoTop"] = null;
  if (estadoTop.length > 0 && estadoTop[0].estadoId != null) {
    const eRow = await prisma.estadoAnimo.findUnique({
      where: { id: estadoTop[0].estadoId },
      select: { slug: true, nombre: true },
    });
    if (eRow) estadoTopOut = { slug: eRow.slug, nombre: eRow.nombre, count: estadoTop[0]._count._all };
  }

  // Libro top
  let libroTopOut: EstadisticasUsuario["libroTop"] = null;
  if (libroTop.length > 0) {
    const lRow = await prisma.libro.findUnique({
      where: { id: libroTop[0].libro_id },
      select: { codigo: true, nombre: true },
    });
    if (lRow) libroTopOut = { codigo: lRow.codigo, nombre: lRow.nombre, count: Number(libroTop[0].count) };
  }

  const planesIniciados = planes.reduce((acc, p) => acc + p._count._all, 0);
  const planesCompletados = planes.find((p) => p.completadoEn !== null)?._count._all ?? 0;

  return {
    totalEntradas,
    totalDiasActivos: heatmap.filter((c) => c.count > 0).length,
    rachaActual: racha.actual,
    mejorRacha: racha.mejor,
    planesIniciados,
    planesCompletados,
    versosGuardados,
    subrayados,
    estadoTop: estadoTopOut,
    libroTop: libroTopOut,
    heatmap,
    peticionesRespondidas: peticionesResp,
    peticionesPendientes: peticionesPend,
  };
}

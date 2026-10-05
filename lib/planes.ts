// Helpers para gestionar Planes de Lectura.

import { prisma } from "@/lib/db/prisma";

export interface Pasaje {
  libro: string;
  capInicio: number;
  capFin: number;
  vInicio?: number;
  vFin?: number;
}

export interface DiaPlan {
  dia: number;
  titulo: string | null;
  pasajes: Pasaje[];
  leido: boolean;
  leidoEn: Date | null;
  notas: string | null;
}

export interface ProgresoPlan {
  planUsuarioId: bigint;
  planSlug: string;
  planNombre: string;
  planEmoji: string | null;
  totalDias: number;
  fechaInicio: Date;
  diaActualSegunCalendario: number; // qué día le tocaría según fechaInicio
  diaSiguienteParaLeer: number; // primer día NO leído (1..totalDias) o totalDias+1 si terminó
  diasLeidos: number;
  porcentaje: number;
  atrasadoDias: number; // si diaActualSegunCalendario > diaSiguienteParaLeer
  estaCompleto: boolean;
}

function inicioDeHoy(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function diasEntre(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/**
 * Devuelve el plan activo (no completado/abandonado) del usuario.
 * Si tiene varios activos, el más reciente.
 */
export async function obtenerPlanActivo(usuarioId: string): Promise<ProgresoPlan | null> {
  const pu = await prisma.planUsuario.findFirst({
    where: { usuarioId, completadoEn: null, abandonadoEn: null },
    orderBy: { creadoEn: "desc" },
    include: {
      plan: { select: { slug: true, nombre: true, emoji: true, dias: true } },
      dias: { select: { dia: true } },
    },
  });
  if (!pu) return null;
  return calcularProgreso(pu);
}

function calcularProgreso(pu: {
  id: bigint;
  fechaInicio: Date;
  plan: { slug: string; nombre: string; emoji: string | null; dias: number };
  dias: Array<{ dia: number }>;
}): ProgresoPlan {
  const totalDias = pu.plan.dias;
  const hoy = inicioDeHoy();
  const fechaInicio = new Date(pu.fechaInicio);
  fechaInicio.setHours(0, 0, 0, 0);
  const diasDesdeInicio = Math.max(0, diasEntre(fechaInicio, hoy));
  const diaActualSegunCalendario = Math.min(totalDias, diasDesdeInicio + 1);

  const diasLeidosSet = new Set(pu.dias.map((d) => d.dia));
  const diasLeidos = diasLeidosSet.size;

  let diaSiguienteParaLeer = totalDias + 1;
  for (let d = 1; d <= totalDias; d++) {
    if (!diasLeidosSet.has(d)) {
      diaSiguienteParaLeer = d;
      break;
    }
  }
  const estaCompleto = diasLeidos >= totalDias;
  const porcentaje = Math.round((diasLeidos / totalDias) * 100);
  const atrasadoDias = Math.max(0, diaActualSegunCalendario - diaSiguienteParaLeer);

  return {
    planUsuarioId: pu.id,
    planSlug: pu.plan.slug,
    planNombre: pu.plan.nombre,
    planEmoji: pu.plan.emoji,
    totalDias,
    fechaInicio: pu.fechaInicio,
    diaActualSegunCalendario,
    diaSiguienteParaLeer,
    diasLeidos,
    porcentaje,
    atrasadoDias,
    estaCompleto,
  };
}

/**
 * Carga TODOS los días de un plan con su estado (leído o no) para un PlanUsuario.
 * Para mostrar el calendario completo.
 */
export async function diasDelPlan(planUsuarioId: bigint): Promise<DiaPlan[]> {
  const pu = await prisma.planUsuario.findUnique({
    where: { id: planUsuarioId },
    include: {
      plan: {
        include: {
          diasContenido: {
            orderBy: { dia: "asc" },
          },
        },
      },
      dias: true,
    },
  });
  if (!pu) return [];

  const leidosPorDia = new Map(pu.dias.map((d) => [d.dia, d]));

  return pu.plan.diasContenido.map((dc) => {
    const leido = leidosPorDia.get(dc.dia);
    return {
      dia: dc.dia,
      titulo: dc.titulo,
      pasajes: dc.pasajes as unknown as Pasaje[],
      leido: !!leido,
      leidoEn: leido?.leidoEn ?? null,
      notas: leido?.notas ?? null,
    };
  });
}

/**
 * Carga UN día específico de un plan. Para la pantalla de lectura del día.
 */
export async function diaDelPlan(planUsuarioId: bigint, dia: number): Promise<DiaPlan | null> {
  const pu = await prisma.planUsuario.findUnique({
    where: { id: planUsuarioId },
    include: { plan: true },
  });
  if (!pu || dia < 1 || dia > pu.plan.dias) return null;

  const [contenido, leido] = await Promise.all([
    prisma.planLecturaDia.findUnique({
      where: { planId_dia: { planId: pu.planId, dia } },
    }),
    prisma.planUsuarioDia.findUnique({
      where: { planUsuarioId_dia: { planUsuarioId, dia } },
    }),
  ]);
  if (!contenido) return null;
  return {
    dia,
    titulo: contenido.titulo,
    pasajes: contenido.pasajes as unknown as Pasaje[],
    leido: !!leido,
    leidoEn: leido?.leidoEn ?? null,
    notas: leido?.notas ?? null,
  };
}

/**
 * Lista TODOS los planes del catálogo, ordenados por destacados primero,
 * después por duración (cortos arriba).
 */
export async function listarPlanesCatalogo() {
  return prisma.planLectura.findMany({
    orderBy: [{ esDestacado: "desc" }, { dias: "asc" }, { nombre: "asc" }],
  });
}

export async function obtenerPlanPorSlug(slug: string) {
  return prisma.planLectura.findUnique({
    where: { slug },
    include: {
      diasContenido: { orderBy: { dia: "asc" }, take: 7 }, // preview primeros 7
      _count: { select: { diasContenido: true } },
    },
  });
}

/** Formatea un pasaje a texto humano: "Génesis 1-3" o "Juan 3:14-21". */
export function pasajeATexto(p: Pasaje, libroNombre: string): string {
  let s = libroNombre;
  if (p.capInicio === p.capFin) {
    s += ` ${p.capInicio}`;
    if (p.vInicio != null && p.vFin != null && p.vInicio !== p.vFin) {
      s += `:${p.vInicio}-${p.vFin}`;
    } else if (p.vInicio != null) {
      s += `:${p.vInicio}`;
    }
  } else {
    s += ` ${p.capInicio}-${p.capFin}`;
  }
  return s;
}

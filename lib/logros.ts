// Catálogo de logros (badges) — hardcoded. El estado de qué logros tiene
// cada usuario vive en la tabla `logro_usuario`.

import { prisma } from "@/lib/db/prisma";
import { calcularRacha } from "@/lib/racha";

export interface Logro {
  slug: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  categoria: "primera-vez" | "racha" | "lectura" | "oracion" | "compartir" | "estudio";
}

export const LOGROS: Logro[] = [
  // Primera vez
  {
    slug: "primer-verso",
    nombre: "Primer paso",
    descripcion: "Tu primera entrada en el diario.",
    emoji: "🌱",
    categoria: "primera-vez",
  },
  {
    slug: "primera-peticion",
    nombre: "Te abriste",
    descripcion: "Anotaste tu primera petición de oración.",
    emoji: "🙏",
    categoria: "oracion",
  },
  {
    slug: "primera-respuesta",
    nombre: "Dios escuchó",
    descripcion: "Marcaste una petición como respondida.",
    emoji: "✨",
    categoria: "oracion",
  },
  {
    slug: "primer-plan",
    nombre: "Lector",
    descripcion: "Empezaste tu primer plan de lectura.",
    emoji: "📖",
    categoria: "lectura",
  },
  {
    slug: "primer-subrayado",
    nombre: "Marcaste el camino",
    descripcion: "Subrayaste tu primer versículo.",
    emoji: "🖍️",
    categoria: "estudio",
  },
  {
    slug: "primer-comparte",
    nombre: "Llevaste la Palabra",
    descripcion: "Compartiste tu primer versículo.",
    emoji: "📤",
    categoria: "compartir",
  },

  // Rachas
  {
    slug: "racha-7",
    nombre: "Una semana",
    descripcion: "7 días seguidos en tu devocional.",
    emoji: "🔥",
    categoria: "racha",
  },
  {
    slug: "racha-30",
    nombre: "Un mes entero",
    descripcion: "30 días seguidos. Imparable.",
    emoji: "🔥",
    categoria: "racha",
  },
  {
    slug: "racha-100",
    nombre: "Cien días",
    descripcion: "100 días consecutivos. Sos roca.",
    emoji: "🏔️",
    categoria: "racha",
  },
  {
    slug: "racha-365",
    nombre: "Un año contigo",
    descripcion: "365 días en oración y lectura.",
    emoji: "👑",
    categoria: "racha",
  },

  // Lectura
  {
    slug: "plan-completado",
    nombre: "Plan completo",
    descripcion: "Terminaste un plan de lectura.",
    emoji: "🏁",
    categoria: "lectura",
  },
  {
    slug: "biblia-entera",
    nombre: "La Biblia entera",
    descripcion: "Completaste el plan de 365 días.",
    emoji: "📚",
    categoria: "lectura",
  },

  // Estudio / guardados
  {
    slug: "10-guardados",
    nombre: "Coleccionista",
    descripcion: "Tienes 10 versículos guardados.",
    emoji: "💎",
    categoria: "estudio",
  },
  {
    slug: "acuarela",
    nombre: "Acuarela",
    descripcion: "Usaste los 4 colores de subrayado.",
    emoji: "🎨",
    categoria: "estudio",
  },

  // Oración
  {
    slug: "10-peticiones-respondidas",
    nombre: "Testimonios",
    descripcion: "10 peticiones marcadas como respondidas.",
    emoji: "🌟",
    categoria: "oracion",
  },
];

export const LOGROS_POR_SLUG = new Map(LOGROS.map((l) => [l.slug, l] as const));

/**
 * Evalúa todos los logros aplicables y otorga los que el usuario cumple.
 * Idempotente — solo crea nuevos LogroUsuario, no toca existentes.
 * Devuelve los slugs RECIÉN otorgados (los nuevos en esta llamada).
 */
export async function evaluarYOtorgarLogros(usuarioId: string): Promise<string[]> {
  // 1) Leer logros ya ganados (para no repetir queries)
  const yaTiene = new Set(
    (await prisma.logroUsuario.findMany({
      where: { usuarioId },
      select: { slug: true },
    })).map((l) => l.slug),
  );

  const candidatos: string[] = [];

  // Helpers
  const pendientes = LOGROS.filter((l) => !yaTiene.has(l.slug));
  if (pendientes.length === 0) return [];

  // Cargar stats una vez (solo las que se necesitan)
  const needRacha = pendientes.some((l) => l.slug.startsWith("racha-"));
  const needEntradas = pendientes.some((l) => l.slug === "primer-verso");
  const needPeticiones = pendientes.some(
    (l) => l.slug === "primera-peticion" || l.slug === "primera-respuesta" || l.slug === "10-peticiones-respondidas",
  );
  const needGuardados = pendientes.some(
    (l) => l.slug === "10-guardados" || l.slug === "primer-subrayado" || l.slug === "acuarela",
  );
  const needPlanes = pendientes.some(
    (l) => l.slug === "primer-plan" || l.slug === "plan-completado" || l.slug === "biblia-entera",
  );

  const [racha, entradasN, peticionesTotal, peticionesResp, subrayadosColores, guardadosN, planesIniciados, planesCompletados, planesBiblia] = await Promise.all([
    needRacha ? calcularRacha(usuarioId) : Promise.resolve({ actual: 0, mejor: 0, ultimoDia: null, pendienteHoy: true }),
    needEntradas ? prisma.entrada.count({ where: { usuarioId } }) : 0,
    needPeticiones ? prisma.peticion.count({ where: { usuarioId } }) : 0,
    needPeticiones ? prisma.peticion.count({ where: { usuarioId, estado: "respondida" } }) : 0,
    needGuardados ? prisma.versiculoGuardado.findMany({ where: { usuarioId, color: { not: null } }, select: { color: true }, distinct: ["color"] }) : [],
    needGuardados ? prisma.versiculoGuardado.count({ where: { usuarioId } }) : 0,
    needPlanes ? prisma.planUsuario.count({ where: { usuarioId } }) : 0,
    needPlanes ? prisma.planUsuario.count({ where: { usuarioId, completadoEn: { not: null } } }) : 0,
    needPlanes
      ? prisma.planUsuario.count({
          where: { usuarioId, completadoEn: { not: null }, plan: { slug: "biblia-1-anio" } },
        })
      : 0,
  ]);

  const cumple: Record<string, boolean> = {
    "primer-verso": entradasN >= 1,
    "primera-peticion": peticionesTotal >= 1,
    "primera-respuesta": peticionesResp >= 1,
    "primer-plan": planesIniciados >= 1,
    "primer-subrayado": Array.isArray(subrayadosColores) && subrayadosColores.length >= 1,
    "primer-comparte": false, // no trackeamos compartidos — los marcamos manualmente cuando se comparta
    "racha-7": (racha.mejor ?? 0) >= 7,
    "racha-30": (racha.mejor ?? 0) >= 30,
    "racha-100": (racha.mejor ?? 0) >= 100,
    "racha-365": (racha.mejor ?? 0) >= 365,
    "plan-completado": planesCompletados >= 1,
    "biblia-entera": planesBiblia >= 1,
    "10-guardados": guardadosN >= 10,
    "acuarela": Array.isArray(subrayadosColores) && subrayadosColores.length >= 4,
    "10-peticiones-respondidas": peticionesResp >= 10,
  };

  for (const l of pendientes) {
    if (cumple[l.slug]) candidatos.push(l.slug);
  }

  if (candidatos.length === 0) return [];

  await prisma.logroUsuario.createMany({
    data: candidatos.map((slug) => ({ usuarioId, slug })),
    skipDuplicates: true,
  });

  return candidatos;
}

export async function listarLogrosUsuario(usuarioId: string): Promise<Array<{ logro: Logro; ganadoEn: Date }>> {
  const filas = await prisma.logroUsuario.findMany({
    where: { usuarioId },
    orderBy: { ganadoEn: "desc" },
  });
  return filas
    .map((f) => {
      const l = LOGROS_POR_SLUG.get(f.slug);
      return l ? { logro: l, ganadoEn: f.ganadoEn } : null;
    })
    .filter((x): x is { logro: Logro; ganadoEn: Date } => x !== null);
}

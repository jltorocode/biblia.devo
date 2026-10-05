// Seed del catálogo de Planes de Lectura.
// Idempotente — borra el catálogo y lo regenera (NO toca las suscripciones de usuarios).
//
// Uso: npx tsx prisma/seed/seed-planes.ts

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { LIBROS } from "@/lib/libros";

interface Pasaje {
  libro: string;
  capInicio: number;
  capFin: number;
}

interface DiaContenido {
  dia: number;
  titulo?: string;
  pasajes: Pasaje[];
}

interface PlanDef {
  slug: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  dias: number;
  categoria: string;
  esDestacado: boolean;
  generar: () => DiaContenido[];
}

/**
 * Distribuye los capítulos de una lista de libros entre N días
 * de forma equilibrada, compactando consecutivos del mismo libro.
 */
function repartirCapitulos(librosCodigos: string[], dias: number): DiaContenido[] {
  const libros = librosCodigos
    .map((c) => LIBROS.find((l) => l.codigo === c))
    .filter((l): l is (typeof LIBROS)[number] => !!l);

  // Lista plana { libro, capitulo }
  const flat: Array<{ libro: string; capitulo: number }> = [];
  for (const l of libros) {
    for (let c = 1; c <= l.numCapitulos; c++) {
      flat.push({ libro: l.codigo, capitulo: c });
    }
  }

  const total = flat.length;
  const out: DiaContenido[] = [];
  let idx = 0;
  for (let d = 1; d <= dias; d++) {
    const fin = Math.min(total, Math.round((d * total) / dias));
    const grupo = flat.slice(idx, fin);
    const pasajes: Pasaje[] = [];
    let actual: Pasaje | null = null;
    for (const c of grupo) {
      if (actual && actual.libro === c.libro && actual.capFin + 1 === c.capitulo) {
        actual.capFin = c.capitulo;
      } else {
        if (actual) pasajes.push(actual);
        actual = { libro: c.libro, capInicio: c.capitulo, capFin: c.capitulo };
      }
    }
    if (actual) pasajes.push(actual);
    out.push({ dia: d, pasajes });
    idx = fin;
  }
  return out;
}

// Helpers para generar listas de libros
const AT = LIBROS.filter((l) => l.testamento === "AT").map((l) => l.codigo);
const NT = LIBROS.filter((l) => l.testamento === "NT").map((l) => l.codigo);
const EVANGELIOS = ["MAT", "MRK", "LUK", "JHN"];

const PLANES: PlanDef[] = [
  {
    slug: "juan-7-dias",
    nombre: "Evangelio de Juan en 7 días",
    descripcion:
      "Una semana para conocer a Jesús a través de los ojos del 'discípulo amado'. 3 capítulos por día.",
    emoji: "💗",
    dias: 7,
    categoria: "corto",
    esDestacado: true,
    generar: () => repartirCapitulos(["JHN"], 7),
  },
  {
    slug: "salmos-30-dias",
    nombre: "Salmos en 30 días",
    descripcion:
      "5 salmos por día. Oración, lamento, alabanza — el corazón humano hablando a Dios.",
    emoji: "🎵",
    dias: 30,
    categoria: "salmos",
    esDestacado: true,
    generar: () => repartirCapitulos(["PSA"], 30),
  },
  {
    slug: "proverbios-31-dias",
    nombre: "Proverbios en 31 días",
    descripcion: "Un capítulo por día. Sabiduría práctica para todos los días del mes.",
    emoji: "🦉",
    dias: 31,
    categoria: "estudio",
    esDestacado: false,
    generar: () => repartirCapitulos(["PRO"], 31),
  },
  {
    slug: "evangelios-30-dias",
    nombre: "Los 4 Evangelios en 30 días",
    descripcion: "Mateo, Marcos, Lucas y Juan en un mes. ~3 capítulos diarios.",
    emoji: "✝️",
    dias: 30,
    categoria: "evangelios",
    esDestacado: true,
    generar: () => repartirCapitulos(EVANGELIOS, 30),
  },
  {
    slug: "nuevo-testamento-90-dias",
    nombre: "Nuevo Testamento en 90 días",
    descripcion: "Mateo a Apocalipsis en 3 meses. ~3 capítulos al día.",
    emoji: "📖",
    dias: 90,
    categoria: "estudio",
    esDestacado: false,
    generar: () => repartirCapitulos(NT, 90),
  },
  {
    slug: "biblia-1-anio",
    nombre: "La Biblia completa en 1 año",
    descripcion:
      "Toda la Palabra de Dios en 365 días. AT y NT recorridos secuencialmente. ~3-4 capítulos al día.",
    emoji: "📚",
    dias: 365,
    categoria: "completo",
    esDestacado: true,
    generar: () => repartirCapitulos([...AT, ...NT], 365),
  },
];

async function main() {
  for (const def of PLANES) {
    console.log(`\n━━━ ${def.nombre} ━━━`);
    const dias = def.generar();
    if (dias.length !== def.dias) {
      console.warn(`  ⚠ Esperaba ${def.dias} días, se generaron ${dias.length}.`);
    }

    // Upsert plan
    const plan = await prisma.planLectura.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        nombre: def.nombre,
        descripcion: def.descripcion,
        emoji: def.emoji,
        dias: def.dias,
        categoria: def.categoria,
        esDestacado: def.esDestacado,
      },
      update: {
        nombre: def.nombre,
        descripcion: def.descripcion,
        emoji: def.emoji,
        dias: def.dias,
        categoria: def.categoria,
        esDestacado: def.esDestacado,
      },
    });

    // Regenerar días (borrar todos, insertar nuevos)
    await prisma.planLecturaDia.deleteMany({ where: { planId: plan.id } });
    await prisma.planLecturaDia.createMany({
      data: dias.map((d) => ({
        planId: plan.id,
        dia: d.dia,
        titulo: d.titulo ?? null,
        pasajes: d.pasajes as unknown as Prisma.InputJsonValue,
      })),
    });
    console.log(`  ✓ ${dias.length} días insertados.`);
  }

  console.log("\n━━━ Resumen ━━━");
  const todos = await prisma.planLectura.findMany({
    orderBy: { dias: "asc" },
    include: { _count: { select: { diasContenido: true } } },
  });
  for (const p of todos) {
    console.log(
      `  ${p.emoji ?? "•"} ${p.nombre.padEnd(40)} ${String(p.dias).padStart(3)} días  ${p.esDestacado ? "⭐" : "  "}`,
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { parsearReferencia } from "@/lib/parsear-referencia";

export async function seedClasificacion(): Promise<void> {
  const archivo = path.resolve(process.cwd(), "datos/clasificacion.csv");
  if (!fs.existsSync(archivo)) {
    throw new Error(`Falta ${archivo}`);
  }

  // Parse CSV (formato simple: sin quoting, comentarios con '#')
  const raw = fs.readFileSync(archivo, "utf-8");
  const lineas = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
  if (lineas.length === 0) throw new Error("CSV vacio");

  const header = lineas[0].split(",").map((s) => s.trim());
  const filas = lineas.slice(1);
  const esperado = ["referencia", "estado_slug", "relevancia", "intensidad", "notas"];
  if (header.join(",") !== esperado.join(",")) {
    throw new Error(`Header inesperado: ${header.join(",")}`);
  }

  // Caches
  const libros = await prisma.libro.findMany({
    select: { id: true, codigo: true, numCapitulos: true },
  });
  const libroPorCodigo = new Map(libros.map((l) => [l.codigo, l]));

  const estados = await prisma.estadoAnimo.findMany({ select: { id: true, slug: true } });
  const estadoPorSlug = new Map(estados.map((e) => [e.slug, e.id]));

  const version = await prisma.versionBiblia.findFirst({ where: { esDefault: true } });
  if (!version) throw new Error("Falta una version por defecto. Corre seed-biblia.");

  let insertados = 0;
  let actualizados = 0;
  const advertencias: string[] = [];

  for (const linea of filas) {
    const cols = linea.split(",").map((s) => s.trim());
    if (cols.length < 4) {
      advertencias.push(`Fila malformada: "${linea}"`);
      continue;
    }
    const [refRaw, slug, relRaw, intRaw, ...notasParts] = cols;
    const notas = notasParts.join(",") || null;

    const ref = parsearReferencia(refRaw);
    if (!ref) {
      advertencias.push(`No pude parsear: "${refRaw}"`);
      continue;
    }

    const libroInfo = libroPorCodigo.get(ref.codigo);
    if (!libroInfo) {
      advertencias.push(`Libro desconocido: ${ref.codigo} en "${refRaw}"`);
      continue;
    }

    const estadoId = estadoPorSlug.get(slug);
    if (!estadoId) {
      advertencias.push(`Estado desconocido: ${slug} en "${refRaw}"`);
      continue;
    }

    const relevancia = Number(relRaw);
    const intensidad = intRaw ? Number(intRaw) : null;
    if (Number.isNaN(relevancia) || relevancia < 1 || relevancia > 10) {
      advertencias.push(`Relevancia invalida en "${refRaw}": ${relRaw}`);
      continue;
    }

    // Rango: si no hay versInicio, capitulo entero.
    const vIni = ref.versInicio ?? 1;
    const vFin = ref.versFin ?? 999;

    const versiculos = await prisma.versiculo.findMany({
      where: {
        versionId: version.id,
        libroId: libroInfo.id,
        capitulo: ref.capitulo,
        versiculo: { gte: vIni, lte: vFin },
      },
      select: { id: true },
    });

    if (versiculos.length === 0) {
      advertencias.push(`Sin versiculos para "${refRaw}" en RV1909`);
      continue;
    }

    for (const v of versiculos) {
      const existente = await prisma.versiculoEstado.findUnique({
        where: { versiculoId_estadoId: { versiculoId: v.id, estadoId } },
        select: { id: true },
      });

      await prisma.versiculoEstado.upsert({
        where: { versiculoId_estadoId: { versiculoId: v.id, estadoId } },
        create: {
          versiculoId: v.id,
          estadoId,
          relevancia,
          intensidad,
          notas,
          verificado: true,
        },
        update: {
          relevancia,
          intensidad,
          notas,
          verificado: true,
        },
      });

      if (existente) actualizados++;
      else insertados++;
    }
  }

  console.log(`  ${insertados} insertados, ${actualizados} actualizados`);

  if (advertencias.length) {
    console.log(`  ⚠ ${advertencias.length} advertencias:`);
    for (const a of advertencias) console.log(`    - ${a}`);
  }

  // Conteo final por estado
  console.log("  Conteo por estado:");
  const estadosOrden = await prisma.estadoAnimo.findMany({
    select: { id: true, slug: true },
    orderBy: { orden: "asc" },
  });
  for (const e of estadosOrden) {
    const cnt = await prisma.versiculoEstado.count({ where: { estadoId: e.id } });
    const marca = cnt >= 25 ? "✓" : "⚠";
    console.log(`    ${marca} ${e.slug.padEnd(20)} ${cnt.toString().padStart(3)} versiculos`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedClasificacion()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

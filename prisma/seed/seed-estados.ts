import { prisma } from "@/lib/db/prisma";
import { ESTADOS } from "@/lib/estados";

export async function seedEstados(): Promise<void> {
  let insertados = 0;
  let actualizados = 0;

  for (const estado of ESTADOS) {
    const existente = await prisma.estadoAnimo.findUnique({
      where: { slug: estado.slug },
      select: { id: true },
    });

    await prisma.estadoAnimo.upsert({
      where: { slug: estado.slug },
      create: {
        slug: estado.slug,
        nombre: estado.nombre,
        descripcion: estado.descripcion,
        emoji: estado.emoji,
        colorHex: estado.colorHex,
        fraseAliento: estado.fraseAliento,
        categoria: estado.categoria,
        orden: estado.orden,
        activo: true,
      },
      update: {
        nombre: estado.nombre,
        descripcion: estado.descripcion,
        emoji: estado.emoji,
        colorHex: estado.colorHex,
        fraseAliento: estado.fraseAliento,
        categoria: estado.categoria,
        orden: estado.orden,
        activo: true,
      },
    });

    if (existente) actualizados++;
    else insertados++;
  }

  console.log(
    `  ${insertados} insertados, ${actualizados} actualizados — ${ESTADOS.length} estados`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedEstados()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

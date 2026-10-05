import { prisma } from "@/lib/db/prisma";
import { LIBROS } from "@/lib/libros";

export async function seedLibros(): Promise<void> {
  let insertados = 0;
  let actualizados = 0;

  for (const libro of LIBROS) {
    const existente = await prisma.libro.findUnique({
      where: { codigo: libro.codigo },
      select: { id: true },
    });

    await prisma.libro.upsert({
      where: { codigo: libro.codigo },
      create: {
        codigo: libro.codigo,
        nombre: libro.nombre,
        nombreCorto: libro.nombreCorto,
        testamento: libro.testamento,
        orden: libro.orden,
        numCapitulos: libro.numCapitulos,
      },
      update: {
        nombre: libro.nombre,
        nombreCorto: libro.nombreCorto,
        testamento: libro.testamento,
        orden: libro.orden,
        numCapitulos: libro.numCapitulos,
      },
    });

    if (existente) actualizados++;
    else insertados++;
  }

  console.log(
    `  ${insertados} insertados, ${actualizados} actualizados — ${LIBROS.length} libros en total`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedLibros()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

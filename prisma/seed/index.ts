import { prisma } from "@/lib/db/prisma";
import { seedLibros } from "./seed-libros";
import { seedBiblia } from "./seed-biblia";
import { seedEstados } from "./seed-estados";
import { seedClasificacion } from "./seed-clasificacion";

async function main() {
  console.log("→ Seed: libros");
  await seedLibros();

  console.log("→ Seed: Biblia (RV1909)");
  await seedBiblia();

  console.log("→ Seed: estados de animo");
  await seedEstados();

  console.log("→ Seed: clasificacion versiculo↔estado");
  await seedClasificacion();

  console.log("✓ Seed terminado");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

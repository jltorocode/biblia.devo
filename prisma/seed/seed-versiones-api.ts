/**
 * Sincroniza la tabla `versiones_biblia` con las Biblias en español
 * disponibles en la cuenta de scripture.api.bible del usuario.
 *
 * Requiere BIBLE_API_KEY configurada.
 *
 * Uso: `npx tsx prisma/seed/seed-versiones-api.ts`
 *
 * Las que ya estan en DB con `licencia=api.bible:<id>` se actualizan.
 * Las nuevas se insertan. Las locales (RV1909) NO se tocan.
 */
import { prisma } from "@/lib/db/prisma";
import { listarBibliasEspanol, tieneClaveAPI } from "@/lib/bible-api";

async function main() {
  if (!tieneClaveAPI()) {
    console.error("× BIBLE_API_KEY no esta configurada en .env");
    process.exit(1);
  }

  console.log("Listando Biblias en español disponibles para tu clave…");
  const biblias = await listarBibliasEspanol();
  console.log(`✓ ${biblias.length} Biblias en español accesibles.\n`);

  for (const b of biblias) {
    const codigo = (b.abbreviationLocal ?? b.abbreviation ?? b.id)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    const nombre = b.nameLocal ?? b.name;
    const licencia = `api.bible:${b.id}`;

    await prisma.versionBiblia.upsert({
      where: { codigo },
      create: {
        codigo,
        nombre,
        idioma: "es",
        licencia,
        esDefault: false,
        esPremium: false,
      },
      update: {
        nombre,
        licencia,
      },
    });
    console.log(`  · ${codigo.padEnd(20)} ${nombre}  [${b.id.slice(0, 10)}…]`);
  }

  console.log("\n✓ Sincronizacion completa.");
  console.log("\nVersiones en DB:");
  const all = await prisma.versionBiblia.findMany({ orderBy: { id: "asc" } });
  for (const v of all) {
    const tag = v.licencia?.startsWith("api.bible") ? "api.bible" : "local";
    console.log(`  · #${v.id} ${v.codigo.padEnd(20)} ${v.nombre.padEnd(40)} [${tag}]`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

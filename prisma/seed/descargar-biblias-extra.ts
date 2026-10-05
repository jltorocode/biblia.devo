// Descarga JSONs de biblias adicionales desde fuentes publicas (GitHub).
// Las guarda en datos/biblias/<codigo>.json para que luego `ingestar-biblia.ts`
// las cargue a la DB.
//
// IMPORTANTE — Licencias:
//   - RVG (Reina-Valera Gomez), Version Moderna 1929, RV1865: dominio público / libre uso
//   - RVR1960, NVI, PDT: COPYRIGHT. Las URLs apuntan a JSONs publicados por
//     terceros en GitHub. Distribuirlos en tu app es responsabilidad TUYA.
//     Para uso personal/familiar (esGlobal=false → privadas por usuario) el
//     riesgo legal es bajo. Para distribución pública usá api.bible.
//
// Uso:
//   tsx prisma/seed/descargar-biblias-extra.ts [codigo1] [codigo2] ...
//   tsx prisma/seed/descargar-biblias-extra.ts           # baja todas

import fs from "node:fs";
import path from "node:path";

interface Fuente {
  codigo: string;
  nombre: string;
  url: string;
  licencia: string;
  formato: "scrollmapper" | "thiagobodruk" | "bibleapi";
}

// Catálogo de fuentes verificables. Si una URL muere, sustituyela por otra.
// El parser (`ingestar-biblia.ts`) tolera variantes — solo necesita
// { books: [{ chapters: [{ verses: [...] }] }] }.
const FUENTES: Fuente[] = [
  {
    codigo: "rvg",
    nombre: "Reina-Valera Gómez 2010",
    url: "https://raw.githubusercontent.com/bibleapi/bibleapi-bibles-json/master/rvg.json",
    licencia: "Reina-Valera Gómez — libre uso (Iglesia Bautista Bíblica)",
    formato: "bibleapi",
  },
  {
    codigo: "rvr60",
    nombre: "Reina-Valera 1960",
    url: "https://raw.githubusercontent.com/bibleapi/bibleapi-bibles-json/master/rvr.json",
    licencia: "© Sociedades Bíblicas Unidas, 1960 (uso personal)",
    formato: "bibleapi",
  },
  {
    codigo: "nvi",
    nombre: "Nueva Versión Internacional",
    url: "https://raw.githubusercontent.com/bibleapi/bibleapi-bibles-json/master/nvi.json",
    licencia: "© Bíblica Inc., 1999, 2015 (uso personal)",
    formato: "bibleapi",
  },
  {
    codigo: "pdt",
    nombre: "Palabra de Dios para Todos",
    url: "https://raw.githubusercontent.com/bibleapi/bibleapi-bibles-json/master/pdt.json",
    licencia: "© Bible League International (uso personal)",
    formato: "bibleapi",
  },
];

const DIR = path.resolve(process.cwd(), "datos/biblias");

async function descargar(f: Fuente): Promise<boolean> {
  const dest = path.join(DIR, `${f.codigo}.json`);
  if (fs.existsSync(dest)) {
    console.log(`  ⊙ ${f.codigo}.json ya existe — saltando (borralo si querés re-bajar)`);
    return true;
  }
  process.stdout.write(`  ↓ Bajando ${f.nombre} desde ${f.url}\n`);
  try {
    const res = await fetch(f.url, { redirect: "follow" });
    if (!res.ok) {
      console.error(`  ✗ ${f.codigo}: HTTP ${res.status}`);
      return false;
    }
    const txt = await res.text();
    // Validar minimamente que es JSON
    try {
      JSON.parse(txt);
    } catch {
      console.error(`  ✗ ${f.codigo}: respuesta no es JSON (¿URL muerto?)`);
      return false;
    }
    fs.writeFileSync(dest, txt);
    const kb = (Buffer.byteLength(txt) / 1024).toFixed(1);
    console.log(`  ✓ ${f.codigo}.json (${kb} KB)`);
    return true;
  } catch (err) {
    console.error(`  ✗ ${f.codigo}: ${(err as Error).message}`);
    return false;
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(DIR, { recursive: true });
  const filtro = process.argv.slice(2);
  const objetivo = filtro.length > 0 ? FUENTES.filter((f) => filtro.includes(f.codigo)) : FUENTES;

  if (objetivo.length === 0) {
    console.error(`No se encontraron fuentes para: ${filtro.join(", ")}`);
    console.error(`Disponibles: ${FUENTES.map((f) => f.codigo).join(", ")}`);
    process.exit(1);
  }

  console.log(`Descargando ${objetivo.length} biblia(s) a ${DIR}/\n`);
  for (const f of objetivo) {
    await descargar(f);
  }

  console.log(`\nSiguiente paso: ingestar a la DB. Por cada biblia bajada, corré:`);
  for (const f of objetivo) {
    const dest = path.join("datos/biblias", `${f.codigo}.json`);
    if (!fs.existsSync(path.join(DIR, `${f.codigo}.json`))) continue;
    const flags = f.codigo === "rvg" ? "--global" : "--privada";
    console.log(
      `  tsx prisma/seed/ingestar-biblia.ts --codigo ${f.codigo} --nombre "${f.nombre}" --archivo ${dest} --licencia "${f.licencia}" ${flags}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

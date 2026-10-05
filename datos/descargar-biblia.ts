// Baja la Reina-Valera 1909 (dominio publico) desde scrollmapper/bible_databases
// y la guarda en datos/biblia-rv1909.json.
//
// Corre una sola vez por dev / al regenerar:
//   tsx datos/descargar-biblia.ts

import fs from "node:fs";
import path from "node:path";

const FUENTE =
  "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/SpaRV.json";
const DESTINO = path.resolve(process.cwd(), "datos/biblia-rv1909.json");

const LIBROS_ESPERADOS = 66;
const VERSICULOS_ESPERADOS = 31_102;

interface JsonBiblia {
  translation: string;
  books: Array<{
    name: string;
    chapters: Array<{ chapter: number; verses: Array<{ verse: number; text: string }> }>;
  }>;
}

async function main() {
  console.log(`→ Descargando ${FUENTE}…`);
  const res = await fetch(FUENTE);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} al bajar la Biblia`);
  }
  const json = (await res.json()) as JsonBiblia;

  if (json.books.length !== LIBROS_ESPERADOS) {
    throw new Error(`Esperaba ${LIBROS_ESPERADOS} libros, vinieron ${json.books.length}`);
  }
  const total = json.books.reduce(
    (acc, b) => acc + b.chapters.reduce((a, c) => a + c.verses.length, 0),
    0,
  );
  if (total !== VERSICULOS_ESPERADOS) {
    throw new Error(`Esperaba ${VERSICULOS_ESPERADOS} versiculos, vinieron ${total}`);
  }

  fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
  fs.writeFileSync(DESTINO, JSON.stringify(json));
  const tam = (fs.statSync(DESTINO).size / 1024 / 1024).toFixed(2);

  console.log(`✓ ${json.translation}`);
  console.log(`✓ ${LIBROS_ESPERADOS} libros, ${total} versiculos`);
  console.log(`✓ Guardado en ${DESTINO} (${tam} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

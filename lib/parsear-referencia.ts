import { LIBROS } from "@/lib/libros";

export interface ReferenciaBiblica {
  /** Codigo OSIS, ej. "JHN", "PSA", "1CO" */
  codigo: string;
  capitulo: number;
  /** Indefinido cuando la referencia no especifica versiculo (capitulo entero). */
  versInicio?: number;
  /** Igual a `versInicio` cuando no hay rango; ausente cuando no hay versiculo. */
  versFin?: number;
}

/**
 * Normaliza una cadena para lookup: quita acentos, baja a minusculas,
 * colapsa espacios. "1ª Corintios" → "1ª corintios" (la marca cae).
 */
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[º°ª]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Mapa de variantes normalizadas → codigo OSIS.
 * Se construye una sola vez.
 */
const LOOKUP: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();

  const agregar = (variante: string, codigo: string) => {
    map.set(normalizar(variante), codigo);
  };

  for (const lib of LIBROS) {
    agregar(lib.nombre, lib.codigo);
    agregar(lib.nombreCorto, lib.codigo);
    agregar(lib.codigo, lib.codigo); // permite usar OSIS directo

    // Libros con prefijo "1 ", "2 ", "3 " → variantes romanos y unidos
    const m = /^([123])\s+(.+)$/.exec(lib.nombre);
    if (m) {
      const num = m[1];
      const resto = m[2];
      const romano = num === "1" ? "I" : num === "2" ? "II" : "III";

      agregar(`${romano} ${resto}`, lib.codigo);
      agregar(`${num}${resto}`, lib.codigo); // "1Corintios"
      agregar(`${num}. ${resto}`, lib.codigo); // "1. Corintios"

      if (num === "1") {
        agregar(`primera ${resto}`, lib.codigo);
        agregar(`primer ${resto}`, lib.codigo);
      } else if (num === "2") {
        agregar(`segunda ${resto}`, lib.codigo);
        agregar(`segundo ${resto}`, lib.codigo);
      } else if (num === "3") {
        agregar(`tercera ${resto}`, lib.codigo);
      }
    }
  }

  // Sinonimos puntuales habituales en castellano.
  agregar("salmo", "PSA"); // singular
  agregar("sal", "PSA");
  agregar("cantar", "SNG");
  agregar("cantar de los cantares", "SNG");
  agregar("cantares de salomon", "SNG");
  agregar("eclesiastes", "ECC");
  agregar("apoc", "REV");
  agregar("apocalipsis de juan", "REV");

  return map;
})();

/**
 * Parsea referencias humanas en castellano.
 *
 * Formatos aceptados:
 *   "Juan 3:16"           → { codigo: "JHN", capitulo: 3, versInicio: 16, versFin: 16 }
 *   "Salmos 23:1-6"       → { codigo: "PSA", capitulo: 23, versInicio: 1, versFin: 6 }
 *   "1 Corintios 13:4"    → { codigo: "1CO", capitulo: 13, versInicio: 4, versFin: 4 }
 *   "Filipenses 4:6-7"    → { codigo: "PHP", capitulo: 4, versInicio: 6, versFin: 7 }
 *   "I Corintios 13:4"    → { codigo: "1CO", capitulo: 13, versInicio: 4, versFin: 4 }
 *   "Salmo 23:1"          → { codigo: "PSA", capitulo: 23, versInicio: 1, versFin: 1 }
 *   "Salmos 23"           → { codigo: "PSA", capitulo: 23 }  (capitulo entero)
 *
 * Devuelve `null` cuando no logra reconocer el libro o el formato.
 */
export function parsearReferencia(texto: string): ReferenciaBiblica | null {
  if (!texto) return null;

  const limpio = texto.replace(/\s+/g, " ").trim();
  // libro (lazy) + cap + (": vIni" + opcional "-vFin")?
  const m = /^(.+?)\s+(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?$/.exec(limpio);
  if (!m) return null;

  const libroRaw = m[1];
  const capitulo = Number(m[2]);
  const versInicio = m[3] !== undefined ? Number(m[3]) : undefined;
  const versFin =
    m[4] !== undefined ? Number(m[4]) : versInicio !== undefined ? versInicio : undefined;

  const codigo = LOOKUP.get(normalizar(libroRaw));
  if (!codigo) return null;
  if (capitulo <= 0) return null;
  if (versInicio !== undefined && versInicio <= 0) return null;
  if (versFin !== undefined && versInicio !== undefined && versFin < versInicio) return null;

  return { codigo, capitulo, versInicio, versFin };
}

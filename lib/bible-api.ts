// Cliente para scripture.api.bible (American Bible Society).
// Provee acceso legal a NVI, RVR1960, RVC, LBLA, NBLA, DHH, etc.
//
// Filosofia: cachear FOREVER. El texto biblico no cambia. Cada (bibleId,
// passageId) que pedimos se guarda en Redis bajo "bible:..." y nunca expira.
//
// Sin BIBLE_API_KEY definida: todas las funciones lanzan. El caller debe
// detectar y caer al texto local (RV1909).

import { getRedis } from "@/lib/redis";

const BASE = "https://api.scripture.api.bible/v1";

function apiKey(): string {
  const k = process.env.BIBLE_API_KEY;
  if (!k) throw new Error("BIBLE_API_KEY no configurada");
  return k;
}

export function tieneClaveAPI(): boolean {
  return !!process.env.BIBLE_API_KEY;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "api-key": apiKey(), accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`api.bible ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

// ─── Listado de Biblias disponibles en la cuenta ────────────────────────────

export interface BibliaApi {
  id: string;             // bibleId que usa api.bible
  abbreviation: string;   // ej: "RVR60", "NVI"
  abbreviationLocal?: string;
  name: string;
  nameLocal?: string;
  description?: string;
  language: { id: string; name: string };
  copyright?: string;
  type?: string;
}

export async function listarBibliasEspanol(): Promise<BibliaApi[]> {
  type Resp = { data: BibliaApi[] };
  const r = await getJSON<Resp>("/bibles?language=spa");
  return r.data;
}

// ─── Lectura de pasajes ─────────────────────────────────────────────────────

export interface PasajeApi {
  id: string;
  reference: string;
  content: string; // por defecto HTML; podemos pedir 'text'
  copyright?: string;
}

interface PasajeOpts {
  /** Codigo OSIS del libro (ej: GEN, JAS, REV). */
  libro: string;
  capitulo: number;
  /** Si null → trae el capitulo entero. Si number → solo ese versiculo. */
  versiculo?: number | null;
  /** Si verseEnd>versiculo, trae el rango. Solo si versiculo set. */
  versiculoFin?: number | null;
  /** 'text' (plain) o 'html'. Default 'text'. */
  contentType?: "text" | "html";
}

function passageId(opts: PasajeOpts): string {
  // api.bible usa OSIS pero algunos libros difieren (1KI vs 1KGS, EZK vs EZE)
  // Asumimos OSIS standard. Las excepciones las mapeamos abajo si surgen.
  const libro = mapearLibro(opts.libro);
  if (opts.versiculo == null) return `${libro}.${opts.capitulo}`;
  const start = `${libro}.${opts.capitulo}.${opts.versiculo}`;
  if (opts.versiculoFin && opts.versiculoFin > opts.versiculo) {
    return `${start}-${libro}.${opts.capitulo}.${opts.versiculoFin}`;
  }
  return start;
}

// Algunos libros tienen codigos distintos en api.bible vs OSIS estricto.
// Esta tabla mapea nuestros codigos (OSIS clasico) al codigo de api.bible.
const MAPEO_LIBRO: Record<string, string> = {
  // Mayoria coincide. Solo listamos las excepciones conocidas.
  // Ejemplo: api.bible usa "JAS" pero algunos prefieren "JAS"; coincide.
  // Si aparecen problemas se ajusta aqui.
};

function mapearLibro(codigo: string): string {
  return MAPEO_LIBRO[codigo] ?? codigo;
}

function cacheKey(bibleId: string, opts: PasajeOpts): string {
  const v =
    opts.versiculo == null
      ? "all"
      : opts.versiculoFin && opts.versiculoFin > opts.versiculo
        ? `${opts.versiculo}-${opts.versiculoFin}`
        : `${opts.versiculo}`;
  return `bible:${bibleId}:${opts.libro}:${opts.capitulo}:${v}`;
}

/**
 * Obtiene el pasaje. Cacheado en Redis para siempre — el texto biblico no
 * cambia. Si no hay Redis configurado, no cachea pero igual funciona.
 */
export async function obtenerPasaje(
  bibleId: string,
  opts: PasajeOpts,
): Promise<{ texto: string; copyright?: string }> {
  const key = cacheKey(bibleId, opts);
  const r = getRedis();
  if (r) {
    try {
      const hit = await r.get(key);
      if (hit) return JSON.parse(hit);
    } catch (err) {
      console.error("[bible-api] cache get fallo", err);
    }
  }

  const contentType = opts.contentType ?? "text";
  const pid = passageId(opts);
  const params = new URLSearchParams({
    "content-type": contentType,
    "include-notes": "false",
    "include-titles": "false",
    "include-chapter-numbers": "false",
    "include-verse-numbers": opts.versiculo == null ? "true" : "false",
    "include-verse-spans": "false",
  });
  type Resp = { data: PasajeApi & { content: string } };
  const r2 = await getJSON<Resp>(`/bibles/${bibleId}/passages/${pid}?${params}`);
  const texto = (r2.data.content || "").replace(/\s+/g, " ").trim();
  const out = { texto, copyright: r2.data.copyright };

  if (r) {
    r.set(key, JSON.stringify(out)).catch((err) =>
      console.error("[bible-api] cache set fallo", err),
    );
  }
  return out;
}

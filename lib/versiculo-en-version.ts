// Resuelve el texto de un versiculo en la version preferida del usuario.
// Casos:
//  1. versionPrefId null → devuelve textoLocal (default RV1909).
//  2. preferida === local (mismo codigo) → devuelve textoLocal sin tocar DB.
//  3. preferida es OTRA local (VBL, BES, PdDpt, RV1865, ...) → query DB.
//  4. preferida es api.bible → fetch via bible-api con cache.
//
// Si el remoto/DB falla, cae al textoLocal con `fallback: true`.

import { prisma } from "@/lib/db/prisma";
import { obtenerPasaje } from "@/lib/bible-api";
import { resolverVersion, type VersionResuelta } from "@/lib/versiones-biblia";

export interface VersiculoConTexto {
  texto: string;
  versionNombre: string;
  versionCodigo: string;
  copyright?: string;
  /** Si fallo el remoto y caimos al local. */
  fallback?: boolean;
}

interface Localizado {
  libroCodigo: string;
  capitulo: number;
  versiculo: number;
  textoLocal: string;
  versionLocalNombre: string;
  versionLocalCodigo: string;
}

/**
 * Resuelve el texto de UN versiculo en la version preferida del usuario.
 */
export async function textoEnVersion(
  loc: Localizado,
  versionPrefId: number | null,
): Promise<VersiculoConTexto> {
  if (!versionPrefId) {
    return {
      texto: loc.textoLocal,
      versionNombre: loc.versionLocalNombre,
      versionCodigo: loc.versionLocalCodigo,
    };
  }
  const v = await resolverVersion(versionPrefId);
  if (!v) {
    return {
      texto: loc.textoLocal,
      versionNombre: loc.versionLocalNombre,
      versionCodigo: loc.versionLocalCodigo,
    };
  }

  // Caso 2: la preferida coincide con la local — no buscamos nada
  if (v.codigo === loc.versionLocalCodigo) {
    return {
      texto: loc.textoLocal,
      versionNombre: v.nombre,
      versionCodigo: v.codigo,
    };
  }

  // Caso 3: preferida es OTRA version local en DB
  if (!v.esApi) {
    try {
      const libro = await prisma.libro.findUnique({
        where: { codigo: loc.libroCodigo },
        select: { id: true },
      });
      if (libro) {
        const row = await prisma.versiculo.findUnique({
          where: {
            versionId_libroId_capitulo_versiculo: {
              versionId: v.id,
              libroId: libro.id,
              capitulo: loc.capitulo,
              versiculo: loc.versiculo,
            },
          },
          select: { texto: true },
        });
        if (row?.texto) {
          return { texto: row.texto, versionNombre: v.nombre, versionCodigo: v.codigo };
        }
      }
    } catch (err) {
      console.error("[textoEnVersion] error DB local:", err);
    }
    return {
      texto: loc.textoLocal,
      versionNombre: loc.versionLocalNombre,
      versionCodigo: loc.versionLocalCodigo,
      fallback: true,
    };
  }

  // Caso 4: api.bible
  if (!v.apiId) {
    return {
      texto: loc.textoLocal,
      versionNombre: loc.versionLocalNombre,
      versionCodigo: loc.versionLocalCodigo,
      fallback: true,
    };
  }
  try {
    const pasaje = await obtenerPasaje(v.apiId, {
      libro: loc.libroCodigo,
      capitulo: loc.capitulo,
      versiculo: loc.versiculo,
      contentType: "text",
    });
    return {
      texto: pasaje.texto || loc.textoLocal,
      versionNombre: v.nombre,
      versionCodigo: v.codigo,
      copyright: pasaje.copyright,
    };
  } catch (err) {
    console.error("[textoEnVersion] fallback a local:", err);
    return {
      texto: loc.textoLocal,
      versionNombre: loc.versionLocalNombre,
      versionCodigo: loc.versionLocalCodigo,
      fallback: true,
    };
  }
}

/**
 * Resuelve un CAPITULO entero en la version preferida.
 */
export async function capituloEnVersion(opts: {
  versionPrefId: number | null;
  libroCodigo: string;
  capitulo: number;
  versosLocales: Array<{ versiculo: number; texto: string }>;
  versionLocalCodigo: string;
}): Promise<{
  versos: Array<{ versiculo: number; texto: string }>;
  version: VersionResuelta | null;
  fallback: boolean;
}> {
  if (!opts.versionPrefId) {
    return { versos: opts.versosLocales, version: null, fallback: false };
  }
  const v = await resolverVersion(opts.versionPrefId);
  if (!v) return { versos: opts.versosLocales, version: null, fallback: false };

  // Mismo codigo que la local — no cambiamos nada
  if (v.codigo === opts.versionLocalCodigo) {
    return { versos: opts.versosLocales, version: v, fallback: false };
  }

  // Otra version local en DB
  if (!v.esApi) {
    try {
      const libro = await prisma.libro.findUnique({
        where: { codigo: opts.libroCodigo },
        select: { id: true },
      });
      if (libro) {
        const rows = await prisma.versiculo.findMany({
          where: { versionId: v.id, libroId: libro.id, capitulo: opts.capitulo },
          orderBy: { versiculo: "asc" },
          select: { versiculo: true, texto: true },
        });
        if (rows.length > 0) {
          return { versos: rows, version: v, fallback: false };
        }
      }
    } catch (err) {
      console.error("[capituloEnVersion] error DB local:", err);
    }
    return { versos: opts.versosLocales, version: v, fallback: true };
  }

  // api.bible
  if (!v.apiId) return { versos: opts.versosLocales, version: v, fallback: true };
  try {
    const pasaje = await obtenerPasaje(v.apiId, {
      libro: opts.libroCodigo,
      capitulo: opts.capitulo,
      versiculo: null,
      contentType: "text",
    });
    const versos = parsearVersosDeCapitulo(pasaje.texto);
    if (versos.length === 0) {
      return { versos: opts.versosLocales, version: v, fallback: true };
    }
    return { versos, version: v, fallback: false };
  } catch (err) {
    console.error("[capituloEnVersion] fallback a local:", err);
    return { versos: opts.versosLocales, version: v, fallback: true };
  }
}

/**
 * api.bible devuelve el capitulo como "[1] texto del v1 [2] texto del v2 ..."
 */
function parsearVersosDeCapitulo(texto: string): Array<{ versiculo: number; texto: string }> {
  if (!texto) return [];
  const regex = /\[(\d+)\]\s*([^\[]+)/g;
  const out: Array<{ versiculo: number; texto: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(texto)) !== null) {
    const num = Number(m[1]);
    const t = (m[2] ?? "").replace(/\s+/g, " ").trim();
    if (num && t) out.push({ versiculo: num, texto: t });
  }
  return out;
}

export async function localizarVersiculo(versiculoId: bigint): Promise<Localizado | null> {
  const v = await prisma.versiculo.findUnique({
    where: { id: versiculoId },
    include: {
      libro: { select: { codigo: true } },
      version: { select: { codigo: true, nombre: true } },
    },
  });
  if (!v) return null;
  return {
    libroCodigo: v.libro.codigo,
    capitulo: v.capitulo,
    versiculo: v.versiculo,
    textoLocal: v.texto,
    versionLocalNombre: v.version.nombre,
    versionLocalCodigo: v.version.codigo,
  };
}

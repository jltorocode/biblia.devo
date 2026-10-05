"use server";

import { prisma } from "@/lib/db/prisma";
import { textoEnVersion } from "@/lib/versiculo-en-version";
import { listarVersionesParaUsuario } from "@/lib/versiones-biblia";
import { resolverUsuarioId } from "@/lib/usuario-actual";

export interface VersoComparado {
  versionId: number;
  versionCodigo: string;
  versionNombre: string;
  texto: string;
  copyright?: string;
  fallback?: boolean;
}

/**
 * Devuelve el mismo versículo en TODAS las versiones disponibles para el
 * usuario actual (globales + privadas asignadas). Usado en el comparador.
 */
export async function compararVersiculoAction(opts: {
  libroCodigo: string;
  capitulo: number;
  versiculo: number;
}): Promise<{ ok: true; versos: VersoComparado[] } | { ok: false; error: string }> {
  const libro = await prisma.libro.findUnique({
    where: { codigo: opts.libroCodigo },
    select: { id: true, nombre: true },
  });
  if (!libro) return { ok: false, error: "Libro no encontrado" };

  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  const versiones = await listarVersionesParaUsuario(usuarioId);

  // El texto local "base" siempre lo sacamos de RV1909 (donde viven los embeddings)
  const rv1909 = versiones.find((v) => v.codigo === "rv1909");
  if (!rv1909) return { ok: false, error: "Versión base no disponible" };
  const baseRow = await prisma.versiculo.findUnique({
    where: {
      versionId_libroId_capitulo_versiculo: {
        versionId: rv1909.id,
        libroId: libro.id,
        capitulo: opts.capitulo,
        versiculo: opts.versiculo,
      },
    },
    select: { texto: true },
  });
  if (!baseRow) return { ok: false, error: "Verso no encontrado en RV1909" };

  const tareas = versiones.map(async (v) => {
    const r = await textoEnVersion(
      {
        libroCodigo: opts.libroCodigo,
        capitulo: opts.capitulo,
        versiculo: opts.versiculo,
        textoLocal: baseRow.texto,
        versionLocalNombre: rv1909.nombre,
        versionLocalCodigo: rv1909.codigo,
      },
      v.id,
    );
    return {
      versionId: v.id,
      versionCodigo: r.versionCodigo,
      versionNombre: r.versionNombre,
      texto: r.texto,
      copyright: r.copyright,
      fallback: r.fallback,
    } satisfies VersoComparado;
  });

  const versos = await Promise.all(tareas);
  return { ok: true, versos };
}

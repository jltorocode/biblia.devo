"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { pedirVersiculo } from "@/lib/rotacion";
import { ESTADOS_POR_SLUG } from "@/lib/estados";
import { esAreaValida } from "@/lib/areas";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { actualizarNota, contarEntradasHoy, obtenerOCrearEntradaLectura } from "@/lib/entradas";
import { prisma } from "@/lib/db/prisma";
import { LIBROS_POR_CODIGO } from "@/lib/libros";
import { planDeUsuario, LIMITES } from "@/lib/plan-limits";

const schema = z.object({
  estadoSlug: z.string().refine((s) => ESTADOS_POR_SLUG.has(s), "estadoSlug invalido"),
});

export interface VersiculoSerializado {
  id: string;
  capitulo: number;
  versiculo: number;
  texto: string;
}

export interface PedirVersiculoData {
  versiculo: VersiculoSerializado;
  libro: { codigo: string; nombre: string; nombreCorto: string };
  estado: { slug: string; nombre: string; emoji: string | null; colorHex: string | null };
  fraseAliento: string;
  versionCodigo: string;
}

export type PedirVersiculoResult =
  | { ok: true; data: PedirVersiculoData }
  | { ok: false; error: string };

/**
 * Endpoint programatico (extensiones, webview, debugging) — no redirige.
 * Devuelve la data ya serializada (BigInt → string).
 */
export async function pedirVersiculoAction(input: {
  estadoSlug: string;
}): Promise<PedirVersiculoResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "estadoSlug invalido" };

  try {
    const usuarioId = await resolverUsuarioId({ crearSiNoExiste: true });
    if (!usuarioId) return { ok: false, error: "No se pudo resolver usuario" };

    const r = await pedirVersiculo(usuarioId, parsed.data.estadoSlug);

    return {
      ok: true,
      data: {
        versiculo: {
          id: r.versiculo.id.toString(),
          capitulo: r.versiculo.capitulo,
          versiculo: r.versiculo.versiculo,
          texto: r.versiculo.texto,
        },
        libro: r.libro,
        estado: r.estado,
        fraseAliento: r.fraseAliento,
        versionCodigo: r.versionCodigo,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error inesperado" };
  }
}

/**
 * Flujo UI: garantiza usuario (cookie anonima) y redirige a /versiculo.
 * Se llama desde el SelectorEstado al confirmar.
 */
export async function iniciarDevocionalAction(
  estadoSlug: string,
  area?: string | null,
): Promise<void> {
  const parsed = schema.safeParse({ estadoSlug });
  if (!parsed.success) redirect("/");

  await resolverUsuarioId({ crearSiNoExiste: true });
  const params = new URLSearchParams({ estado: parsed.data.estadoSlug });
  if (area && esAreaValida(area)) params.set("area", area);
  redirect(`/versiculo?${params.toString()}`);
}

const guardarNotaSchema = z.object({
  entradaId: z.string().regex(/^\d+$/, "id invalido"),
  nota: z.string().max(4000, "Nota demasiado larga"),
});

export type GuardarNotaResult = { ok: true } | { ok: false; error: string };

/**
 * Guarda/actualiza la nota de una entrada del diario. Verifica que la entrada
 * pertenezca al usuario actual.
 */
export async function guardarNotaEntradaAction(input: {
  entradaId: string;
  nota: string;
}): Promise<GuardarNotaResult> {
  const parsed = guardarNotaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) return { ok: false, error: "Sin sesion" };

  const r = await actualizarNota({
    entradaId: BigInt(parsed.data.entradaId),
    usuarioId,
    nota: parsed.data.nota,
  });
  if (!r.ok) return { ok: false, error: "Entrada no encontrada" };
  return { ok: true };
}

const crearLecturaSchema = z.object({
  libroCodigo: z.string().min(1),
  capitulo: z.number().int().positive(),
  nota: z.string().max(4000).optional(),
});

export type CrearLecturaResult =
  | { ok: true; entradaId: string; vistaPrevia: boolean }
  | { ok: false; error: string };

/**
 * Crea una entrada modo='lectura' para el capitulo indicado (rango: primer
 * versiculo al ultimo). Aplica el limite "1 entrada/dia" para free como
 * vista previa (no guarda) si ya excedio.
 */
export async function crearEntradaLecturaAction(input: {
  libroCodigo: string;
  capitulo: number;
  nota?: string;
}): Promise<CrearLecturaResult> {
  const parsed = crearLecturaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }
  const libroInfo = LIBROS_POR_CODIGO.get(parsed.data.libroCodigo);
  if (!libroInfo) return { ok: false, error: "Libro desconocido" };
  if (parsed.data.capitulo > libroInfo.numCapitulos) {
    return { ok: false, error: "Capitulo fuera de rango" };
  }

  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: true });
  if (!usuarioId) return { ok: false, error: "No se pudo resolver usuario" };

  // Resolver primer y ultimo versiculo del capitulo.
  const libroRow = await prisma.libro.findUnique({
    where: { codigo: parsed.data.libroCodigo },
    select: { id: true },
  });
  if (!libroRow) return { ok: false, error: "Libro no encontrado en DB" };

  // Base RV1909: ahí viven los embeddings/clasificación; las otras versiones
  // son solo "texto traducido" para display.
  const rv1909 = await prisma.versionBiblia.findUnique({
    where: { codigo: "rv1909" },
    select: { id: true },
  });
  if (!rv1909) return { ok: false, error: "Versión base no encontrada" };

  const versiculos = await prisma.versiculo.findMany({
    where: { versionId: rv1909.id, libroId: libroRow.id, capitulo: parsed.data.capitulo },
    orderBy: { versiculo: "asc" },
    select: { id: true },
  });
  if (versiculos.length === 0) return { ok: false, error: "Capitulo sin versiculos" };

  // Limite "1 entrada/dia" para free, si ya excedio devolvemos vistaPrevia=true
  // sin crear (asi el front puede mostrar el banner).
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { premiumHasta: true },
  });
  const esPremium = planDeUsuario(usuario?.premiumHasta) === "PREMIUM";
  const cuantasYa = await contarEntradasHoy(usuarioId);

  if (!esPremium && cuantasYa >= LIMITES.FREE.entradasPorDia) {
    return { ok: true, entradaId: "", vistaPrevia: true };
  }

  const { entrada } = await obtenerOCrearEntradaLectura({
    usuarioId,
    lecturaInicioId: versiculos[0]!.id,
    lecturaFinId: versiculos.at(-1)!.id,
  });

  if (parsed.data.nota && parsed.data.nota.trim()) {
    await actualizarNota({ entradaId: entrada.id, usuarioId, nota: parsed.data.nota });
  }

  return { ok: true, entradaId: entrada.id.toString(), vistaPrevia: false };
}

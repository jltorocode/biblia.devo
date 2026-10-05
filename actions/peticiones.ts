"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { CATEGORIAS_POR_SLUG, type CategoriaPeticion } from "@/lib/peticiones";
import { evaluarYOtorgarLogros } from "@/lib/logros";

type R<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

export async function crearPeticionAction(opts: {
  titulo: string;
  descripcion?: string;
  categoria?: CategoriaPeticion;
}): Promise<R<{ id: string }>> {
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: true });
  if (!usuarioId) return { ok: false, error: "No se pudo identificar el usuario" };

  const titulo = opts.titulo.trim();
  if (!titulo) return { ok: false, error: "El título es obligatorio" };
  if (titulo.length > 160) return { ok: false, error: "Título muy largo (máx 160)" };

  const categoria =
    opts.categoria && CATEGORIAS_POR_SLUG.has(opts.categoria) ? opts.categoria : "otro";

  const p = await prisma.peticion.create({
    data: {
      usuarioId,
      titulo,
      descripcion: opts.descripcion?.trim() || null,
      categoria,
      estado: "pendiente",
    },
  });

  await evaluarYOtorgarLogros(usuarioId).catch(() => null);

  revalidatePath("/oracion");
  return { ok: true, id: p.id.toString() };
}

export async function actualizarPeticionAction(
  id: string,
  opts: {
    titulo?: string;
    descripcion?: string;
    categoria?: CategoriaPeticion;
  },
): Promise<R> {
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) return { ok: false, error: "Necesitás cuenta" };

  const peticionId = BigInt(id);
  const ex = await prisma.peticion.findUnique({ where: { id: peticionId } });
  if (!ex || ex.usuarioId !== usuarioId) return { ok: false, error: "No encontrada" };

  const data: { titulo?: string; descripcion?: string | null; categoria?: string } = {};
  if (opts.titulo !== undefined) {
    const t = opts.titulo.trim();
    if (!t) return { ok: false, error: "El título no puede estar vacío" };
    data.titulo = t;
  }
  if (opts.descripcion !== undefined) data.descripcion = opts.descripcion.trim() || null;
  if (opts.categoria !== undefined && CATEGORIAS_POR_SLUG.has(opts.categoria)) {
    data.categoria = opts.categoria;
  }

  await prisma.peticion.update({ where: { id: peticionId }, data });
  revalidatePath("/oracion");
  revalidatePath(`/oracion/${id}`);
  return { ok: true };
}

export async function marcarRespondidaAction(id: string, respuesta?: string): Promise<R> {
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) return { ok: false, error: "Necesitás cuenta" };

  const peticionId = BigInt(id);
  const ex = await prisma.peticion.findUnique({ where: { id: peticionId } });
  if (!ex || ex.usuarioId !== usuarioId) return { ok: false, error: "No encontrada" };

  await prisma.peticion.update({
    where: { id: peticionId },
    data: {
      estado: "respondida",
      respuesta: respuesta?.trim() || null,
      fechaRespondida: new Date(),
    },
  });

  await evaluarYOtorgarLogros(usuarioId).catch(() => null);

  revalidatePath("/oracion");
  revalidatePath(`/oracion/${id}`);
  return { ok: true };
}

export async function archivarPeticionAction(id: string): Promise<R> {
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) return { ok: false, error: "Necesitás cuenta" };

  const peticionId = BigInt(id);
  const ex = await prisma.peticion.findUnique({ where: { id: peticionId } });
  if (!ex || ex.usuarioId !== usuarioId) return { ok: false, error: "No encontrada" };

  await prisma.peticion.update({
    where: { id: peticionId },
    data: { estado: "archivada" },
  });
  revalidatePath("/oracion");
  return { ok: true };
}

export async function eliminarPeticionAction(id: string): Promise<R> {
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) return { ok: false, error: "Necesitás cuenta" };

  const peticionId = BigInt(id);
  const ex = await prisma.peticion.findUnique({ where: { id: peticionId } });
  if (!ex || ex.usuarioId !== usuarioId) return { ok: false, error: "No encontrada" };

  await prisma.peticion.delete({ where: { id: peticionId } });
  revalidatePath("/oracion");
  return { ok: true };
}

export async function reactivarPeticionAction(id: string): Promise<R> {
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) return { ok: false, error: "Necesitás cuenta" };

  const peticionId = BigInt(id);
  const ex = await prisma.peticion.findUnique({ where: { id: peticionId } });
  if (!ex || ex.usuarioId !== usuarioId) return { ok: false, error: "No encontrada" };

  await prisma.peticion.update({
    where: { id: peticionId },
    data: { estado: "pendiente", fechaRespondida: null },
  });
  revalidatePath("/oracion");
  revalidatePath(`/oracion/${id}`);
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { esAdmin } from "@/lib/admin-guard";

type R = { ok: true } | { ok: false; error: string };

async function guard(): Promise<R | null> {
  if (!(await esAdmin())) return { ok: false, error: "Solo admin" };
  return null;
}

// ─── Biblias ────────────────────────────────────────────────────

export async function setVersionActiva(versionId: number, activa: boolean): Promise<R> {
  const g = await guard();
  if (g) return g;
  await prisma.versionBiblia.update({ where: { id: versionId }, data: { activa } });
  revalidatePath("/admin/biblias");
  revalidatePath("/ajustes");
  return { ok: true };
}

export async function setVersionGlobal(versionId: number, esGlobal: boolean): Promise<R> {
  const g = await guard();
  if (g) return g;
  await prisma.versionBiblia.update({ where: { id: versionId }, data: { esGlobal } });
  revalidatePath("/admin/biblias");
  revalidatePath("/ajustes");
  return { ok: true };
}

export async function asignarVersionAUsuario(versionId: number, usuarioId: string): Promise<R> {
  const g = await guard();
  if (g) return g;
  await prisma.versionUsuario.upsert({
    where: { versionId_usuarioId: { versionId, usuarioId } },
    create: { versionId, usuarioId },
    update: {},
  });
  revalidatePath("/admin/biblias");
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function quitarVersionDeUsuario(versionId: number, usuarioId: string): Promise<R> {
  const g = await guard();
  if (g) return g;
  await prisma.versionUsuario.deleteMany({ where: { versionId, usuarioId } });
  revalidatePath("/admin/biblias");
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

// ─── Usuarios ───────────────────────────────────────────────────

export async function setUsuarioRol(usuarioId: string, rol: "usuario" | "admin"): Promise<R> {
  const g = await guard();
  if (g) return g;
  await prisma.usuario.update({ where: { id: usuarioId }, data: { rol } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

// ─── Temas ──────────────────────────────────────────────────────

export async function crearTema(slug: string, nombre: string): Promise<R> {
  const g = await guard();
  if (g) return g;
  const s = slug.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!s || !nombre.trim()) return { ok: false, error: "Slug y nombre requeridos" };
  try {
    await prisma.tema.create({ data: { slug: s, nombre: nombre.trim() } });
  } catch {
    return { ok: false, error: "Ya existe un tema con ese slug" };
  }
  revalidatePath("/admin/temas");
  return { ok: true };
}

export async function renombrarTema(temaId: number, nombre: string): Promise<R> {
  const g = await guard();
  if (g) return g;
  if (!nombre.trim()) return { ok: false, error: "Nombre requerido" };
  await prisma.tema.update({ where: { id: temaId }, data: { nombre: nombre.trim() } });
  revalidatePath("/admin/temas");
  return { ok: true };
}

export async function borrarTema(temaId: number): Promise<R> {
  const g = await guard();
  if (g) return g;
  await prisma.tema.delete({ where: { id: temaId } });
  revalidatePath("/admin/temas");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { usuarioPuedeUsarVersion } from "@/lib/versiones-biblia";

export type CambiarVersionResult = { ok: true } | { ok: false; error: string };

export async function cambiarVersionPrefAction(
  versionId: number | null,
): Promise<CambiarVersionResult> {
  // Permitimos anónimos también — `resolverUsuarioId` crea uno si no existe
  // (la preferencia se guarda en el row anónimo y se migra si el user firma).
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: true });
  if (!usuarioId) return { ok: false, error: "No se pudo identificar el usuario" };

  if (versionId !== null) {
    const puede = await usuarioPuedeUsarVersion(usuarioId, versionId);
    if (!puede) return { ok: false, error: "No tenés acceso a esta versión" };
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { versionPrefId: versionId },
  });

  // Revalidamos todas las vistas que dependen de la versión.
  revalidatePath("/", "layout");
  return { ok: true };
}

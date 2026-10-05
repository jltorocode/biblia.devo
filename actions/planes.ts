"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { evaluarYOtorgarLogros } from "@/lib/logros";

type R<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/**
 * Inicia o reactiva un plan para el usuario. Si tiene una suscripción
 * abandonada al mismo plan, la reanuda con fechaInicio NUEVA (empieza de cero).
 */
export async function iniciarPlanAction(slug: string): Promise<R<{ planUsuarioId: string }>> {
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: true });
  if (!usuarioId) return { ok: false, error: "No se pudo identificar el usuario" };

  const plan = await prisma.planLectura.findUnique({ where: { slug } });
  if (!plan) return { ok: false, error: "Plan no encontrado" };

  const activo = await prisma.planUsuario.findFirst({
    where: { usuarioId, completadoEn: null, abandonadoEn: null },
  });
  if (activo && activo.planId !== plan.id) {
    return {
      ok: false,
      error: "Ya tenés un plan activo. Abandonalo primero para empezar uno nuevo.",
    };
  }
  if (activo && activo.planId === plan.id) {
    return { ok: true, planUsuarioId: activo.id.toString() };
  }

  // Si tiene una suscripción ABANDONADA al mismo plan, la reciclamos (start fresh)
  const previo = await prisma.planUsuario.findFirst({
    where: { usuarioId, planId: plan.id, abandonadoEn: { not: null } },
    orderBy: { creadoEn: "desc" },
  });

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pu = previo
    ? await prisma.planUsuario.update({
        where: { id: previo.id },
        data: {
          abandonadoEn: null,
          completadoEn: null,
          fechaInicio: hoy,
        },
      })
    : await prisma.planUsuario.create({
        data: { usuarioId, planId: plan.id, fechaInicio: hoy },
      });

  if (previo) {
    // limpiamos días viejos si reseteamos
    await prisma.planUsuarioDia.deleteMany({ where: { planUsuarioId: pu.id } });
  }

  await evaluarYOtorgarLogros(usuarioId).catch(() => null);

  revalidatePath("/planes");
  revalidatePath("/planes/mio");
  revalidatePath("/");
  return { ok: true, planUsuarioId: pu.id.toString() };
}

export async function marcarDiaLeidoAction(opts: {
  planUsuarioId: string;
  dia: number;
  notas?: string;
}): Promise<R<{ completado: boolean }>> {
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) return { ok: false, error: "Necesitás cuenta" };

  const planUsuarioId = BigInt(opts.planUsuarioId);
  const pu = await prisma.planUsuario.findUnique({
    where: { id: planUsuarioId },
    include: { plan: true },
  });
  if (!pu || pu.usuarioId !== usuarioId) {
    return { ok: false, error: "Plan no encontrado" };
  }
  if (opts.dia < 1 || opts.dia > pu.plan.dias) {
    return { ok: false, error: "Día fuera de rango" };
  }

  await prisma.planUsuarioDia.upsert({
    where: { planUsuarioId_dia: { planUsuarioId, dia: opts.dia } },
    create: {
      planUsuarioId,
      dia: opts.dia,
      notas: opts.notas?.trim() || null,
    },
    update: {
      notas: opts.notas?.trim() || null,
    },
  });

  // Si completó todos los días → marcar plan completado
  const totalLeidos = await prisma.planUsuarioDia.count({ where: { planUsuarioId } });
  let completado = false;
  if (totalLeidos >= pu.plan.dias && !pu.completadoEn) {
    await prisma.planUsuario.update({
      where: { id: planUsuarioId },
      data: { completadoEn: new Date() },
    });
    completado = true;
  }

  await evaluarYOtorgarLogros(usuarioId).catch(() => null);

  revalidatePath("/planes/mio");
  revalidatePath("/");
  return { ok: true, completado };
}

export async function abandonarPlanAction(planUsuarioId: string): Promise<R> {
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) return { ok: false, error: "Necesitás cuenta" };

  const id = BigInt(planUsuarioId);
  const pu = await prisma.planUsuario.findUnique({ where: { id } });
  if (!pu || pu.usuarioId !== usuarioId) return { ok: false, error: "Plan no encontrado" };

  await prisma.planUsuario.update({
    where: { id },
    data: { abandonadoEn: new Date() },
  });

  revalidatePath("/planes");
  revalidatePath("/planes/mio");
  revalidatePath("/");
  return { ok: true };
}

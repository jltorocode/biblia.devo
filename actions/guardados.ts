"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { planDeUsuario, excedeLimite, LIMITES } from "@/lib/plan-limits";
import {
  COLOR_DEFAULT,
  type ColorSubrayado,
  coloresPermitidos,
  esColorValido,
} from "@/lib/subrayados";

const idSchema = z.string().regex(/^\d+$/, "ID invalido");

async function getUserId(): Promise<string | null> {
  try {
    const s = await auth.api.getSession({ headers: await headers() });
    return s?.user?.id ?? null;
  } catch {
    return null;
  }
}

export type GuardarResult =
  | { ok: true; guardado: boolean }
  | { ok: false; error: string; limiteAlcanzado?: boolean; requiereCuenta?: boolean };

export async function guardarVersiculoAction(
  versiculoIdStr: string,
): Promise<GuardarResult> {
  const parsed = idSchema.safeParse(versiculoIdStr);
  if (!parsed.success) return { ok: false, error: "ID invalido" };

  const userId = await getUserId();
  if (!userId) {
    return { ok: false, error: "Necesitás una cuenta para guardar", requiereCuenta: true };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      premiumHasta: true,
      _count: { select: { guardados: true } },
    },
  });
  if (!usuario) return { ok: false, error: "Usuario no encontrado" };

  const plan = planDeUsuario(usuario.premiumHasta);
  if (excedeLimite(plan, "guardados", usuario._count.guardados)) {
    return {
      ok: false,
      error: `Llegaste al límite de ${LIMITES.FREE.guardados} guardados. Premium es ilimitado.`,
      limiteAlcanzado: true,
    };
  }

  const versiculoId = BigInt(parsed.data);
  await prisma.versiculoGuardado.upsert({
    where: { usuarioId_versiculoId: { usuarioId: userId, versiculoId } },
    create: { usuarioId: userId, versiculoId },
    update: {},
  });

  revalidatePath("/guardados");
  return { ok: true, guardado: true };
}

export async function quitarGuardadoAction(
  versiculoIdStr: string,
): Promise<GuardarResult> {
  const parsed = idSchema.safeParse(versiculoIdStr);
  if (!parsed.success) return { ok: false, error: "ID invalido" };

  const userId = await getUserId();
  if (!userId) return { ok: false, error: "No autenticado", requiereCuenta: true };

  const versiculoId = BigInt(parsed.data);
  await prisma.versiculoGuardado.deleteMany({
    where: { usuarioId: userId, versiculoId },
  });

  revalidatePath("/guardados");
  return { ok: true, guardado: false };
}

// ─── Subrayados (highlights con color) ─────────────────────────────────────

export type SubrayarResult =
  | { ok: true; color: ColorSubrayado }
  | { ok: false; error: string; requiereCuenta?: boolean; requierePremium?: boolean };

/**
 * Subraya un versiculo con el color indicado. Si ya existe un registro para
 * (usuario, versiculo) lo actualiza con el nuevo color. Si el usuario es free
 * y pide un color que no le corresponde, fallback al amarillo.
 */
export async function subrayarVersiculoAction(input: {
  versiculoId: string;
  color: string;
}): Promise<SubrayarResult> {
  const parsedId = idSchema.safeParse(input.versiculoId);
  if (!parsedId.success) return { ok: false, error: "ID invalido" };
  if (!esColorValido(input.color)) return { ok: false, error: "Color invalido" };

  const userId = await getUserId();
  if (!userId) {
    return { ok: false, error: "Necesitás una cuenta para subrayar", requiereCuenta: true };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { premiumHasta: true },
  });
  if (!usuario) return { ok: false, error: "Usuario no encontrado" };

  const esPremium = planDeUsuario(usuario.premiumHasta) === "PREMIUM";
  const permitidos = coloresPermitidos(esPremium);
  const colorFinal: ColorSubrayado = permitidos.includes(input.color as ColorSubrayado)
    ? (input.color as ColorSubrayado)
    : COLOR_DEFAULT;

  const versiculoId = BigInt(parsedId.data);
  await prisma.versiculoGuardado.upsert({
    where: { usuarioId_versiculoId: { usuarioId: userId, versiculoId } },
    create: { usuarioId: userId, versiculoId, color: colorFinal },
    update: { color: colorFinal },
  });

  revalidatePath("/guardados");
  return { ok: true, color: colorFinal };
}

export async function quitarSubrayadoAction(versiculoIdStr: string): Promise<GuardarResult> {
  return quitarGuardadoAction(versiculoIdStr);
}

export async function estaGuardado(versiculoIdStr: string): Promise<boolean> {
  const parsed = idSchema.safeParse(versiculoIdStr);
  if (!parsed.success) return false;

  const userId = await getUserId();
  if (!userId) return false;

  const versiculoId = BigInt(parsed.data);
  const found = await prisma.versiculoGuardado.findUnique({
    where: { usuarioId_versiculoId: { usuarioId: userId, versiculoId } },
    select: { id: true },
  });
  return !!found;
}

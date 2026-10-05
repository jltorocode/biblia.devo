"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { ANON_COOKIE, borrarCookieAnonima } from "@/lib/usuario-actual";

const signUpSchema = z.object({
  email: z.string().email("Email invalido").max(160),
  password: z.string().min(8, "Minimo 8 caracteres").max(120),
  nombre: z.string().max(80).optional(),
});

const signInSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "Falta la contrasena"),
});

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signUpAction(input: {
  email: string;
  password: string;
  nombre?: string;
}): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.nombre?.trim() || parsed.data.email.split("@")[0],
      },
      headers: await headers(),
    });

    if (!result?.user?.id) return { ok: false, error: "No se pudo crear la cuenta" };

    await migrarAnonimo(result.user.id);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error inesperado";
    if (/already|exists|registered/i.test(msg)) {
      return { ok: false, error: "Ya existe una cuenta con ese email" };
    }
    return { ok: false, error: msg };
  }
}

export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  try {
    const result = await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
    if (!result?.user?.id) return { ok: false, error: "Credenciales invalidas" };

    await migrarAnonimo(result.user.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Credenciales invalidas" };
  }
}

export async function signOutAction(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // No-op si la sesion ya expiro.
  }
}

/**
 * Migra historial, guardados y rotacion del usuario anonimo (cookie devo_uid)
 * al usuario recien registrado, y borra el anonimo + la cookie.
 *
 * Se llama justo despues de un sign-up/sign-in exitoso.
 */
async function migrarAnonimo(usuarioFinalId: string): Promise<void> {
  const store = await cookies();
  const anonId = store.get(ANON_COOKIE)?.value;
  if (!anonId || anonId === usuarioFinalId) return;

  const anon = await prisma.usuario.findUnique({
    where: { id: anonId },
    select: { id: true, email: true },
  });
  if (!anon) {
    borrarCookieAnonima(store);
    return;
  }
  // Si la "cookie anonima" en realidad apunta a una cuenta con email,
  // no es anonima — solo limpiamos.
  if (anon.email) {
    borrarCookieAnonima(store);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Entradas: no tienen unique, migración directa.
    await tx.entrada.updateMany({
      where: { usuarioId: anonId },
      data: { usuarioId: usuarioFinalId },
    });

    // Guardados: UNIQUE(usuarioId, versiculoId). Migrar solo los versículos
    // que el usuario destino aún no tiene; borrar los duplicados.
    const yaGuardados = await tx.versiculoGuardado.findMany({
      where: { usuarioId: usuarioFinalId },
      select: { versiculoId: true },
    });
    const setGuardados = new Set(yaGuardados.map((g) => g.versiculoId.toString()));
    const anonGuardados = await tx.versiculoGuardado.findMany({
      where: { usuarioId: anonId },
      select: { id: true, versiculoId: true },
    });
    const guardadosAMigrar = anonGuardados
      .filter((g) => !setGuardados.has(g.versiculoId.toString()))
      .map((g) => g.id);
    if (guardadosAMigrar.length > 0) {
      await tx.versiculoGuardado.updateMany({
        where: { id: { in: guardadosAMigrar } },
        data: { usuarioId: usuarioFinalId },
      });
    }
    await tx.versiculoGuardado.deleteMany({ where: { usuarioId: anonId } });

    // Rotación: PK compuesta (usuarioId, estadoId). Migrar solo los estados
    // que el usuario destino no ha tocado; borrar el resto.
    const yaRotados = await tx.rotacionUsuario.findMany({
      where: { usuarioId: usuarioFinalId },
      select: { estadoId: true },
    });
    const setRotados = new Set(yaRotados.map((r) => r.estadoId));
    const anonRotaciones = await tx.rotacionUsuario.findMany({
      where: { usuarioId: anonId },
      select: { estadoId: true },
    });
    const rotacionesAMigrar = anonRotaciones
      .filter((r) => !setRotados.has(r.estadoId))
      .map((r) => r.estadoId);
    if (rotacionesAMigrar.length > 0) {
      await tx.rotacionUsuario.updateMany({
        where: { usuarioId: anonId, estadoId: { in: rotacionesAMigrar } },
        data: { usuarioId: usuarioFinalId },
      });
    }
    await tx.rotacionUsuario.deleteMany({ where: { usuarioId: anonId } });

    await tx.usuario.delete({ where: { id: anonId } });
  });

  borrarCookieAnonima(store);
}

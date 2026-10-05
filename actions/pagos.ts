"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getProvider, type Plan, type ProviderName } from "@/lib/payments";

const checkoutSchema = z.object({
  plan: z.enum(["premium_mensual", "premium_anual"]),
  provider: z.enum(["stripe", "mercadopago", "paypal"]),
});

export type CheckoutActionResult =
  | { ok: true }
  | { ok: false; error: string; requiereCuenta?: boolean };

export async function iniciarCheckoutAction(input: {
  plan: Plan;
  provider: ProviderName;
}): Promise<CheckoutActionResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Plan o provider invalido" };

  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!sesion?.user?.id) {
    return { ok: false, error: "Necesitas una cuenta", requiereCuenta: true };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.user.id },
    select: { email: true },
  });

  let url: string;
  try {
    const provider = getProvider(parsed.data.provider);
    const result = await provider.iniciarCheckout({
      usuarioId: sesion.user.id,
      plan: parsed.data.plan,
      email: usuario?.email ?? null,
    });
    url = result.url;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No pudimos crear el checkout",
    };
  }

  redirect(url);
}

export async function cancelarSuscripcionAction(): Promise<
  { ok: true; canceladaHasta: string } | { ok: false; error: string }
> {
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!sesion?.user?.id) return { ok: false, error: "No autenticado" };

  // Tomamos la suscripcion activa mas reciente.
  const sub = await prisma.suscripcion.findFirst({
    where: {
      usuarioId: sesion.user.id,
      status: "active",
      cancelAtPeriodEnd: false,
    },
    orderBy: { periodEnd: "desc" },
  });
  if (!sub) return { ok: false, error: "No hay una suscripcion activa para cancelar" };

  try {
    const provider = getProvider(sub.provider as ProviderName);
    await provider.cancelarSuscripcion(sub.externalId);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "El provider no acepto la cancelacion",
    };
  }

  // Optimista: marcamos cancel_at_period_end localmente; el webhook confirmara.
  await prisma.suscripcion.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });

  return { ok: true, canceladaHasta: sub.periodEnd.toISOString() };
}

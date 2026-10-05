import { prisma } from "@/lib/db/prisma";
import type { ResultadoWebhook } from "@/lib/payments/types";

/**
 * Aplica el resultado de un webhook a la DB:
 *  - Upsert en `suscripciones` (provider + externalId es UNIQUE).
 *  - Actualiza `usuarios.premium_hasta` segun el estado de la suscripcion.
 *
 * Idempotente: re-procesar el mismo evento no rompe ni duplica.
 */
export async function aplicarSuscripcion(r: ResultadoWebhook): Promise<void> {
  if (!r.usuarioId) {
    console.warn(`[payments] webhook ${r.provider}/${r.externalId} sin usuarioId — skip`);
    return;
  }
  if (!r.plan) {
    console.warn(`[payments] webhook ${r.provider}/${r.externalId} sin plan — skip`);
    return;
  }

  const status = mapEventoAStatus(r.evento);
  const periodStart = r.periodStart ?? new Date();
  const periodEnd = r.periodEnd ?? periodStart;

  await prisma.$transaction(async (tx) => {
    await tx.suscripcion.upsert({
      where: {
        provider_externalId: { provider: r.provider, externalId: r.externalId },
      },
      create: {
        usuarioId: r.usuarioId!,
        provider: r.provider,
        externalId: r.externalId,
        status,
        plan: r.plan!,
        periodStart,
        periodEnd,
        cancelAtPeriodEnd: r.cancelAtPeriodEnd ?? false,
      },
      update: {
        status,
        plan: r.plan!,
        periodStart,
        periodEnd,
        cancelAtPeriodEnd: r.cancelAtPeriodEnd ?? false,
      },
    });

    // Reglas para premium_hasta:
    //  - activada / renovada → premium hasta period_end
    //  - cancelada con cancelAtPeriodEnd → premium hasta period_end
    //  - expirada / pago_fallido → revocar
    const premiumHasta =
      status === "active" ||
      (status === "canceled" && (r.cancelAtPeriodEnd ?? false))
        ? periodEnd
        : null;

    await tx.usuario.update({
      where: { id: r.usuarioId! },
      data: {
        premiumHasta,
        paymentProvider: r.provider,
        ...(r.provider === "stripe" && r.customerId
          ? { stripeCustomerId: r.customerId, stripeSubscriptionId: r.externalId }
          : {}),
        ...(r.provider === "mercadopago"
          ? { mercadopagoSubscriptionId: r.externalId }
          : {}),
        ...(r.provider === "paypal" ? { paypalSubscriptionId: r.externalId } : {}),
      },
    });
  });
}

function mapEventoAStatus(
  evento: ResultadoWebhook["evento"],
): "active" | "canceled" | "past_due" {
  switch (evento) {
    case "activada":
    case "renovada":
      return "active";
    case "cancelada":
      return "canceled";
    case "expirada":
      return "canceled";
    case "pago_fallido":
      return "past_due";
    default:
      return "active";
  }
}

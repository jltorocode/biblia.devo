import Stripe from "stripe";
import type {
  CheckoutResult,
  IPaymentProvider,
  Plan,
  ResultadoWebhook,
} from "@/lib/payments/types";

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function client(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurada");
  return new Stripe(key);
}

function priceIdPara(plan: Plan): string {
  const id =
    plan === "premium_mensual"
      ? process.env.STRIPE_PRICE_PREMIUM_MENSUAL
      : process.env.STRIPE_PRICE_PREMIUM_ANUAL;
  if (!id) throw new Error(`Falta env STRIPE_PRICE_${plan.toUpperCase()}`);
  return id;
}

export const stripeProvider: IPaymentProvider = {
  nombre: "stripe",

  async iniciarCheckout({ usuarioId, plan, email }): Promise<CheckoutResult> {
    const stripe = client();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceIdPara(plan), quantity: 1 }],
      client_reference_id: usuarioId,
      customer_email: email ?? undefined,
      success_url: `${baseUrl()}/premium/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl()}/premium`,
      subscription_data: {
        trial_period_days: 7,
        metadata: { usuarioId, plan },
      },
      metadata: { usuarioId, plan },
    });
    if (!session.url) throw new Error("Stripe no devolvio URL de checkout");
    return { url: session.url };
  },

  async cancelarSuscripcion(externalSubscriptionId: string): Promise<void> {
    const stripe = client();
    await stripe.subscriptions.update(externalSubscriptionId, {
      cancel_at_period_end: true,
    });
  },

  async parseWebhook(rawBody, headers): Promise<ResultadoWebhook> {
    const stripe = client();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET no configurada");

    const sig = headers["stripe-signature"];
    if (!sig) throw new Error("falta header stripe-signature");
    const event = stripe.webhooks.constructEvent(rawBody, sig, secret);

    return await traducir(event, stripe);
  },
};

async function traducir(
  event: Stripe.Event,
  stripe: Stripe,
): Promise<ResultadoWebhook> {
  const base = { provider: "stripe" as const };

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const subId =
        typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
      if (!subId) {
        return { ...base, evento: "desconocido", externalId: s.id };
      }
      const sub = await stripe.subscriptions.retrieve(subId);
      return {
        ...base,
        evento: "activada",
        externalId: sub.id,
        usuarioId:
          (sub.metadata?.usuarioId as string | undefined) ??
          (s.metadata?.usuarioId as string | undefined) ??
          (s.client_reference_id ?? undefined),
        plan: detectarPlan(sub),
        periodStart: timestampPrincipal(sub, "start"),
        periodEnd: timestampPrincipal(sub, "end"),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
      };
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const isActive = sub.status === "active" || sub.status === "trialing";
      return {
        ...base,
        evento: isActive
          ? sub.cancel_at_period_end
            ? "cancelada"
            : "renovada"
          : "expirada",
        externalId: sub.id,
        usuarioId: sub.metadata?.usuarioId as string | undefined,
        plan: detectarPlan(sub),
        periodStart: timestampPrincipal(sub, "start"),
        periodEnd: timestampPrincipal(sub, "end"),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
      };
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      return {
        ...base,
        evento: "expirada",
        externalId: sub.id,
        usuarioId: sub.metadata?.usuarioId as string | undefined,
        plan: detectarPlan(sub),
        periodStart: timestampPrincipal(sub, "start"),
        periodEnd: timestampPrincipal(sub, "end"),
        cancelAtPeriodEnd: false,
      };
    }

    case "invoice.payment_failed": {
      // En distintas versiones de la API el id de la subscription vive en
      // `invoice.subscription` (legacy) o `invoice.parent.subscription_details.subscription`.
      // Defensivos para no acoplarnos a una sola forma.
      type InvoiceLike = {
        id?: string;
        subscription?: string | { id?: string } | null;
        parent?: { subscription_details?: { subscription?: string | { id?: string } } };
      };
      const inv = event.data.object as InvoiceLike;
      const raw =
        inv.subscription ?? inv.parent?.subscription_details?.subscription ?? null;
      const subId = typeof raw === "string" ? raw : raw?.id;
      return {
        ...base,
        evento: "pago_fallido",
        externalId: subId ?? inv.id ?? "unknown",
      };
    }

    default:
      return { ...base, evento: "desconocido", externalId: event.id };
  }
}

function detectarPlan(sub: Stripe.Subscription): Plan | undefined {
  const metaPlan = sub.metadata?.plan as string | undefined;
  if (metaPlan === "premium_mensual" || metaPlan === "premium_anual") return metaPlan;

  const priceId = sub.items?.data?.[0]?.price?.id;
  if (!priceId) return undefined;
  if (priceId === process.env.STRIPE_PRICE_PREMIUM_MENSUAL) return "premium_mensual";
  if (priceId === process.env.STRIPE_PRICE_PREMIUM_ANUAL) return "premium_anual";
  return undefined;
}

// La API de Stripe expone current_period_start / current_period_end.
// Tipamos defensivamente para mantener compatibilidad con cambios menores.
function timestampPrincipal(
  sub: Stripe.Subscription,
  cual: "start" | "end",
): Date | undefined {
  type SubConPeriodo = Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const s = sub as SubConPeriodo;
  const epoch = cual === "start" ? s.current_period_start : s.current_period_end;
  return typeof epoch === "number" ? new Date(epoch * 1000) : undefined;
}

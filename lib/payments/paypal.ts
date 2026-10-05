import type {
  CheckoutResult,
  IPaymentProvider,
  Plan,
  ResultadoWebhook,
} from "@/lib/payments/types";

// El SDK @paypal/paypal-server-sdk v2 no expone todavia un controller estable
// para subscriptions, asi que vamos directo a la REST API. Es 3 fetch:
//   1) POST /v1/oauth2/token  → access_token
//   2) POST /v1/billing/subscriptions  → approval link
//   3) POST /v1/billing/subscriptions/{id}/cancel  → cancelar
// y la verificacion de webhook va por /v1/notifications/verify-webhook-signature.

function basePayPal(): string {
  const env = (process.env.PAYPAL_ENV ?? "sandbox").toLowerCase();
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function accessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID/SECRET no configurados");

  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${basePayPal()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth: ${res.status}`);
  const j = (await res.json()) as { access_token: string };
  return j.access_token;
}

function planId(plan: Plan): string {
  const v =
    plan === "premium_mensual"
      ? process.env.PAYPAL_PLAN_PREMIUM_MENSUAL
      : process.env.PAYPAL_PLAN_PREMIUM_ANUAL;
  if (!v) throw new Error(`Falta env PAYPAL_PLAN_${plan.toUpperCase()}`);
  return v;
}

export const paypalProvider: IPaymentProvider = {
  nombre: "paypal",

  async iniciarCheckout({ usuarioId, plan, email }): Promise<CheckoutResult> {
    const token = await accessToken();
    const res = await fetch(`${basePayPal()}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId(plan),
        custom_id: `${usuarioId}|${plan}`,
        subscriber: email ? { email_address: email } : undefined,
        application_context: {
          return_url: `${appUrl()}/premium/exito?provider=paypal`,
          cancel_url: `${appUrl()}/premium`,
          user_action: "SUBSCRIBE_NOW",
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`PayPal subscription: ${res.status} ${await res.text()}`);
    }
    const j = (await res.json()) as { links: Array<{ rel: string; href: string }> };
    const approve = j.links.find((l) => l.rel === "approve");
    if (!approve) throw new Error("PayPal no devolvio link de aprobacion");
    return { url: approve.href };
  },

  async cancelarSuscripcion(externalSubscriptionId: string): Promise<void> {
    const token = await accessToken();
    const res = await fetch(
      `${basePayPal()}/v1/billing/subscriptions/${externalSubscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Cancelacion solicitada por el usuario" }),
      },
    );
    if (!res.ok && res.status !== 204) {
      throw new Error(`PayPal cancel: ${res.status} ${await res.text()}`);
    }
  },

  async parseWebhook(rawBody, headers): Promise<ResultadoWebhook> {
    type Evento = {
      event_type?: string;
      resource?: {
        id?: string;
        custom_id?: string;
        billing_info?: {
          next_billing_time?: string;
          cycle_executions?: Array<{ cycles_completed: number }>;
        };
        start_time?: string;
      };
    };
    let body: Evento;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return { provider: "paypal", evento: "desconocido", externalId: "unparseable" };
    }

    // Verificar firma contra PayPal (necesita PAYPAL_WEBHOOK_ID)
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId) {
      const token = await accessToken();
      const verify = await fetch(
        `${basePayPal()}/v1/notifications/verify-webhook-signature`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_algo: headers["paypal-auth-algo"],
            cert_url: headers["paypal-cert-url"],
            transmission_id: headers["paypal-transmission-id"],
            transmission_sig: headers["paypal-transmission-sig"],
            transmission_time: headers["paypal-transmission-time"],
            webhook_id: webhookId,
            webhook_event: body,
          }),
        },
      );
      const ok = (await verify.json()) as { verification_status?: string };
      if (ok.verification_status !== "SUCCESS") {
        throw new Error("PayPal: firma de webhook invalida");
      }
    }

    const externalId = body.resource?.id ?? "unknown";
    const [usuarioId, planTxt] = (body.resource?.custom_id ?? "").split("|");
    const plan: Plan | undefined =
      planTxt === "premium_mensual" || planTxt === "premium_anual" ? planTxt : undefined;

    let evento: ResultadoWebhook["evento"] = "desconocido";
    switch (body.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
        evento = "activada";
        break;
      case "BILLING.SUBSCRIPTION.RENEWED":
      case "PAYMENT.SALE.COMPLETED":
        evento = "renovada";
        break;
      case "BILLING.SUBSCRIPTION.CANCELLED":
        evento = "cancelada";
        break;
      case "BILLING.SUBSCRIPTION.EXPIRED":
        evento = "expirada";
        break;
      case "PAYMENT.SALE.DENIED":
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        evento = "pago_fallido";
        break;
      default:
        evento = "desconocido";
    }

    return {
      provider: "paypal",
      evento,
      externalId,
      usuarioId: usuarioId || undefined,
      plan,
      periodStart: body.resource?.start_time ? new Date(body.resource.start_time) : undefined,
      periodEnd: body.resource?.billing_info?.next_billing_time
        ? new Date(body.resource.billing_info.next_billing_time)
        : undefined,
      cancelAtPeriodEnd: evento === "cancelada",
    };
  },
};

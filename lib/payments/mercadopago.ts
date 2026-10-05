import { MercadoPagoConfig, PreApproval } from "mercadopago";
import type {
  CheckoutResult,
  IPaymentProvider,
  Plan,
  ResultadoWebhook,
} from "@/lib/payments/types";

// MercadoPago no separa entornos por SDK — la cuenta sandbox usa un access
// token APP_USR-... distinto. Mismo SDK, distinta credencial.
function client() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurada");
  return new MercadoPagoConfig({ accessToken: token });
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Plan → (monto, moneda) — configurable por env para soportar varios paises. */
function precioPara(plan: Plan): { amount: number; currency: string; frequency: 1; frequencyType: "months" | "years" } {
  const moneda = process.env.MERCADOPAGO_CURRENCY ?? "ARS";

  if (plan === "premium_mensual") {
    const monto = Number(process.env.MERCADOPAGO_PRECIO_MENSUAL ?? "4000");
    return { amount: monto, currency: moneda, frequency: 1, frequencyType: "months" };
  }
  const montoAnual = Number(process.env.MERCADOPAGO_PRECIO_ANUAL ?? "40000");
  return { amount: montoAnual, currency: moneda, frequency: 1, frequencyType: "years" };
}

export const mercadopagoProvider: IPaymentProvider = {
  nombre: "mercadopago",

  async iniciarCheckout({ usuarioId, plan, email }): Promise<CheckoutResult> {
    const precio = precioPara(plan);
    const preApproval = new PreApproval(client());

    const result = await preApproval.create({
      body: {
        reason: `Devocional Premium (${plan})`,
        auto_recurring: {
          frequency: precio.frequency,
          frequency_type: precio.frequencyType,
          transaction_amount: precio.amount,
          currency_id: precio.currency,
        },
        back_url: `${baseUrl()}/premium/exito?provider=mercadopago`,
        payer_email: email ?? undefined,
        external_reference: `${usuarioId}|${plan}`,
        status: "pending",
      },
    });

    const initPoint = (result as { init_point?: string }).init_point;
    if (!initPoint) throw new Error("MercadoPago no devolvio init_point");
    return { url: initPoint };
  },

  async cancelarSuscripcion(externalSubscriptionId: string): Promise<void> {
    const preApproval = new PreApproval(client());
    await preApproval.update({
      id: externalSubscriptionId,
      body: { status: "cancelled" },
    });
  },

  async parseWebhook(rawBody): Promise<ResultadoWebhook> {
    type Notificacion = {
      type?: string;
      action?: string;
      data?: { id?: string };
    };
    let body: Notificacion;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return { provider: "mercadopago", evento: "desconocido", externalId: "unparseable" };
    }

    const tipo = body.type ?? body.action ?? "";
    const externalId = body.data?.id;

    if (!externalId || !tipo.startsWith("preapproval")) {
      return { provider: "mercadopago", evento: "desconocido", externalId: externalId ?? "unknown" };
    }

    // Pedimos el estado actual al API (la notificacion no trae el payload completo).
    const preApproval = new PreApproval(client());
    const sub = (await preApproval.get({ id: externalId })) as {
      status?: string;
      external_reference?: string;
      auto_recurring?: { frequency_type?: string };
      date_created?: string;
      next_payment_date?: string;
    };

    const [usuarioId, planTxt] = (sub.external_reference ?? "").split("|");
    const plan: Plan | undefined =
      planTxt === "premium_mensual" || planTxt === "premium_anual" ? planTxt : undefined;

    let evento: ResultadoWebhook["evento"] = "desconocido";
    switch (sub.status) {
      case "authorized":
        evento = "activada";
        break;
      case "paused":
      case "cancelled":
        evento = "cancelada";
        break;
      case "finished":
        evento = "expirada";
        break;
      default:
        evento = "desconocido";
    }

    return {
      provider: "mercadopago",
      evento,
      externalId,
      usuarioId: usuarioId || undefined,
      plan,
      periodStart: sub.date_created ? new Date(sub.date_created) : undefined,
      periodEnd: sub.next_payment_date ? new Date(sub.next_payment_date) : undefined,
      cancelAtPeriodEnd: sub.status === "cancelled",
    };
  },
};

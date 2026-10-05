import type { IPaymentProvider, ProviderName } from "@/lib/payments/types";
import { stripeProvider } from "@/lib/payments/stripe";
import { mercadopagoProvider } from "@/lib/payments/mercadopago";
import { paypalProvider } from "@/lib/payments/paypal";

export type { CheckoutResult, IPaymentProvider, Plan, ProviderName, ResultadoWebhook } from "@/lib/payments/types";
export { aplicarSuscripcion } from "@/lib/payments/aplicar-suscripcion";

export function getProvider(nombre: ProviderName): IPaymentProvider {
  switch (nombre) {
    case "stripe":
      return stripeProvider;
    case "mercadopago":
      return mercadopagoProvider;
    case "paypal":
      return paypalProvider;
  }
}

export function planesDisponibles(): ProviderName[] {
  const out: ProviderName[] = [];
  if (process.env.STRIPE_SECRET_KEY) out.push("stripe");
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) out.push("mercadopago");
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) out.push("paypal");
  return out;
}

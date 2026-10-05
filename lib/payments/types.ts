// Tipos compartidos por los tres providers.

export type Plan = "premium_mensual" | "premium_anual";
export type ProviderName = "stripe" | "mercadopago" | "paypal";

export type EventoSuscripcion =
  | "activada" // primer pago OK
  | "renovada" // pago recurrente OK
  | "cancelada" // user pidio cancelar — mantiene acceso hasta period_end
  | "expirada" // periodo agotado / cancelada y vencida
  | "pago_fallido"
  | "desconocido";

export interface ResultadoWebhook {
  evento: EventoSuscripcion;
  provider: ProviderName;
  externalId: string;
  usuarioId?: string;
  plan?: Plan;
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  /** Para guardar IDs externos en usuarios (customer_id de Stripe, etc.) */
  customerId?: string;
}

export interface CheckoutResult {
  url: string;
}

export interface IPaymentProvider {
  readonly nombre: ProviderName;
  iniciarCheckout(opts: {
    usuarioId: string;
    plan: Plan;
    email: string | null;
  }): Promise<CheckoutResult>;
  cancelarSuscripcion(externalSubscriptionId: string): Promise<void>;
  parseWebhook(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<ResultadoWebhook>;
}

import { NextResponse } from "next/server";
import { mercadopagoProvider } from "@/lib/payments/mercadopago";
import { aplicarSuscripcion } from "@/lib/payments/aplicar-suscripcion";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k] = v));

  try {
    const r = await mercadopagoProvider.parseWebhook(rawBody, headers);
    await aplicarSuscripcion(r);
  } catch (err) {
    console.error("[webhook/mercadopago]", err);
  }
  // MercadoPago tolera 200; reintenta si recibe error.
  return NextResponse.json({ received: true });
}

import { NextResponse } from "next/server";
import { stripeProvider } from "@/lib/payments/stripe";
import { aplicarSuscripcion } from "@/lib/payments/aplicar-suscripcion";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k] = v));

  try {
    const r = await stripeProvider.parseWebhook(rawBody, headers);
    await aplicarSuscripcion(r);
  } catch (err) {
    console.error("[webhook/stripe]", err);
    // Devolvemos 200 igual para que Stripe no reintente eternamente,
    // EXCEPTO si falla la firma — ahi 400 para que Stripe alerte.
    if (err instanceof Error && /signature|webhook/i.test(err.message)) {
      return new NextResponse(err.message, { status: 400 });
    }
  }
  return NextResponse.json({ received: true });
}

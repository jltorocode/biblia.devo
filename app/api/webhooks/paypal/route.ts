import { NextResponse } from "next/server";
import { paypalProvider } from "@/lib/payments/paypal";
import { aplicarSuscripcion } from "@/lib/payments/aplicar-suscripcion";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k] = v));

  try {
    const r = await paypalProvider.parseWebhook(rawBody, headers);
    await aplicarSuscripcion(r);
  } catch (err) {
    console.error("[webhook/paypal]", err);
    if (err instanceof Error && /firma|signature/i.test(err.message)) {
      return new NextResponse(err.message, { status: 400 });
    }
  }
  return NextResponse.json({ received: true });
}

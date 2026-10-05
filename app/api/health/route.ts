import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "ok" });
  } catch (err) {
    // Endpoint publico: el mensaje de Prisma incluye host/IP y puerto de la DB,
    // asi que el detalle solo va al log del servidor.
    console.error("[health] db down", err);
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}

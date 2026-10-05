import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { pedirVersiculo } from "@/lib/rotacion";
import { enviarEmail } from "@/lib/email";
import { plantillaRecordatorio } from "@/lib/email-plantillas";
import { clientKey, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const ESTADO_FALLBACK = "general";

type ResultadoEnvio = {
  usuarioId: string;
  email: string;
  ok: boolean;
  error?: string;
};

/**
 * GET /api/cron/recordatorios?hora=HH
 *
 * Envia el versiculo del dia a todos los usuarios cuya `hora_recordatorio`
 * coincide con `hora` (UTC). Si no se pasa `hora`, usa la hora UTC actual.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Para cada usuario:
 *  - Toma su estado mas reciente en historial; si no hay, usa "esperanzado".
 *  - Llama a `pedirVersiculo` (rota normalmente, sin escribir historial).
 *  - Manda el email; falla aislada por usuario (no aborta el batch).
 */
export async function GET(request: Request) {
  // Rate limit por IP — protege ante fuerza bruta del bearer.
  const rl = await rateLimit({
    key: `cron:${clientKey(request.headers)}`,
    limit: 30,
    windowSeconds: 60,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "demasiadas solicitudes" },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "no autorizado" },
      { status: 401, headers: rateLimitHeaders(rl) },
    );
  }

  const url = new URL(request.url);
  const horaParam = url.searchParams.get("hora");
  const hora = horaParam !== null ? Number(horaParam) : new Date().getUTCHours();
  if (!Number.isInteger(hora) || hora < 0 || hora > 23) {
    return NextResponse.json({ error: "hora invalida (0-23)" }, { status: 400 });
  }

  // Filtrar usuarios cuya hora UTC coincide.
  const usuarios = await prisma.$queryRaw<
    Array<{ id: string; email: string; nombre: string | null }>
  >`
    SELECT id, email, nombre
    FROM usuarios
    WHERE email IS NOT NULL
      AND hora_recordatorio IS NOT NULL
      AND EXTRACT(HOUR FROM hora_recordatorio) = ${hora}::int
  `;

  const resultados: ResultadoEnvio[] = [];
  for (const u of usuarios) {
    try {
      const ultimo = await prisma.entrada.findFirst({
        where: { usuarioId: u.id, modo: "estado", estadoId: { not: null } },
        orderBy: { creadoEn: "desc" },
        select: { estado: { select: { slug: true } } },
      });
      const estadoSlug = ultimo?.estado?.slug ?? ESTADO_FALLBACK;

      const r = await pedirVersiculo(u.id, estadoSlug, { sinEntrada: true });

      const ref = `${r.libro.nombre} ${r.versiculo.capitulo}:${r.versiculo.versiculo}`;
      const { subject, html, text } = plantillaRecordatorio({
        nombre: u.nombre,
        referencia: ref,
        texto: r.versiculo.texto,
        estadoNombre: r.estado.nombre,
        appUrl: APP_URL,
      });
      await enviarEmail({ to: u.email, subject, html, text });
      resultados.push({ usuarioId: u.id, email: u.email, ok: true });
    } catch (err) {
      resultados.push({
        usuarioId: u.id,
        email: u.email,
        ok: false,
        error: err instanceof Error ? err.message : "desconocido",
      });
    }
  }

  const enviados = resultados.filter((r) => r.ok).length;
  const fallidos = resultados.length - enviados;
  return NextResponse.json({ hora, total: resultados.length, enviados, fallidos, resultados });
}

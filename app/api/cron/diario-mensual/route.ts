import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { enviarEmail } from "@/lib/email";
import { plantillaResumenMensual } from "@/lib/email-plantillas";
import { clientKey, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type Resultado = {
  usuarioId: string;
  email: string;
  ok: boolean;
  error?: string;
};

/**
 * GET /api/cron/diario-mensual?mes=YYYY-MM
 *
 * Dispara el dia 1 de cada mes. Si no se pasa `mes`, usa el mes anterior al
 * actual (UTC). Envia el resumen "Tu mes con Dios" a usuarios PREMIUM con email
 * y que tuvieron al menos 1 entrada ese mes.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: Request) {
  const rl = await rateLimit({
    key: `cron-mensual:${clientKey(request.headers)}`,
    limit: 10,
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
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  // Resolver el mes a procesar.
  const url = new URL(request.url);
  const mesParam = url.searchParams.get("mes");
  const ahora = new Date();
  const { anio, mes } = (() => {
    if (mesParam) {
      const m = mesParam.match(/^(\d{4})-(\d{2})$/);
      if (m) return { anio: Number(m[1]), mes: Number(m[2]) };
    }
    // Mes anterior al actual
    const prev = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 1, 1));
    return { anio: prev.getUTCFullYear(), mes: prev.getUTCMonth() + 1 };
  })();
  if (mes < 1 || mes > 12) {
    return NextResponse.json({ error: "mes invalido" }, { status: 400 });
  }
  const mesISO = `${anio}-${String(mes).padStart(2, "0")}`;
  const desde = new Date(Date.UTC(anio, mes - 1, 1));
  const hasta = new Date(Date.UTC(anio, mes, 1));

  // Filtrar premium con email, que tengan entradas en el mes objetivo.
  const candidatos = await prisma.$queryRaw<
    Array<{ id: string; email: string; nombre: string | null }>
  >`
    SELECT u.id, u.email, u.nombre
    FROM usuarios u
    WHERE u.email IS NOT NULL
      AND u.premium_hasta IS NOT NULL
      AND u.premium_hasta > NOW()
      AND EXISTS (
        SELECT 1 FROM entradas e
        WHERE e.usuario_id = u.id
          AND e.fecha >= ${desde}
          AND e.fecha <  ${hasta}
      )
  `;

  const mesNombre = new Date(Date.UTC(anio, mes - 1, 15)).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const resultados: Resultado[] = [];
  for (const u of candidatos) {
    try {
      const entradas = await prisma.entrada.findMany({
        where: { usuarioId: u.id, fecha: { gte: desde, lt: hasta } },
        orderBy: [{ fecha: "asc" }, { creadoEn: "asc" }],
        select: {
          fecha: true,
          estado: { select: { emoji: true } },
          versiculo: {
            select: { capitulo: true, versiculo: true, libro: { select: { nombre: true } } },
          },
          lecturaInicio: {
            select: { capitulo: true, libro: { select: { nombre: true } } },
          },
        },
      });

      const diasUnicos = new Set(entradas.map((e) => e.fecha.toISOString().slice(0, 10)));

      // Destacados: una por dia (la primera).
      const destacadosPorDia = new Map<
        string,
        { fecha: string; emoji: string | null; referencia: string }
      >();
      for (const e of entradas) {
        const f = e.fecha.toISOString().slice(0, 10);
        if (destacadosPorDia.has(f)) continue;
        let referencia = "Lectura";
        if (e.versiculo) {
          referencia = `${e.versiculo.libro.nombre} ${e.versiculo.capitulo}:${e.versiculo.versiculo}`;
        } else if (e.lecturaInicio) {
          referencia = `${e.lecturaInicio.libro.nombre} ${e.lecturaInicio.capitulo}`;
        }
        destacadosPorDia.set(f, {
          fecha: f.slice(8, 10),
          emoji: e.estado?.emoji ?? null,
          referencia,
        });
      }

      const { subject, html, text } = plantillaResumenMensual({
        nombre: u.nombre,
        mesNombre,
        mesISO,
        totalEntradas: entradas.length,
        diasActivos: diasUnicos.size,
        destacados: Array.from(destacadosPorDia.values()),
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

  return NextResponse.json({
    mes: mesISO,
    total: resultados.length,
    enviados: resultados.filter((r) => r.ok).length,
    fallidos: resultados.filter((r) => !r.ok).length,
    resultados,
  });
}

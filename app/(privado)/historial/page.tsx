import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { LIMITES, planDeUsuario } from "@/lib/plan-limits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Historial" };

const PAGE_SIZE = 50;

export default async function HistorialPage() {
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!sesion?.user?.id) redirect("/signin");

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.user.id },
    select: { premiumHasta: true },
  });
  const plan = planDeUsuario(usuario?.premiumHasta);
  const dias = LIMITES[plan].historialDias;

  // Server component dinámico — Date.now() es legítimo por request.
  const desde = Number.isFinite(dias)
    // eslint-disable-next-line react-hooks/purity
    ? new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
    : undefined;

  const historial = await prisma.entrada.findMany({
    where: {
      usuarioId: sesion.user.id,
      ...(desde ? { creadoEn: { gte: desde } } : {}),
    },
    orderBy: { creadoEn: "desc" },
    take: PAGE_SIZE,
    select: {
      id: true,
      creadoEn: true,
      modo: true,
      nota: true,
      estado: { select: { slug: true, nombre: true, emoji: true } },
      versiculo: {
        select: {
          capitulo: true,
          versiculo: true,
          libro: { select: { nombre: true } },
        },
      },
      lecturaInicio: {
        select: {
          capitulo: true,
          libro: { select: { nombre: true } },
        },
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-12 pt-16">
      <header className="mb-6">
        <h1 className="text-2xl font-medium text-neutral-800">Tu historial</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {plan === "PREMIUM"
            ? "Historial completo."
            : `Últimos ${LIMITES.FREE.historialDias} días (plan gratuito).`}
        </p>
      </header>

      {historial.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-8 py-12 text-center">
          <p className="text-3xl mb-3" aria-hidden>✦</p>
          <p className="font-serif text-lg text-stone-700 mb-1" style={{ fontFamily: "var(--font-lora), Georgia, serif" }}>
            Tu historia con Su Palabra empieza acá.
          </p>
          <p className="text-sm text-stone-500 mb-6">
            Cada estado que abras, cada lectura que hagas, queda registrado en este lugar.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/"
              className="inline-block rounded-full bg-stone-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-900"
            >
              Empezar
            </Link>
            <Link
              href="/leer"
              className="inline-block rounded-full px-5 py-2.5 text-sm text-stone-600 hover:text-stone-900"
            >
              o leer la Biblia →
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {historial.map((h) => (
            <li
              key={h.id.toString()}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm"
            >
              <span className="text-2xl" aria-hidden="true">
                {h.modo === "lectura" ? "📖" : h.estado?.emoji ?? "·"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-800">
                  {h.modo === "lectura"
                    ? "Lectura"
                    : h.estado?.nombre ?? "—"}
                </p>
                {h.modo === "lectura" && h.lecturaInicio && (
                  <p className="text-xs text-neutral-500">
                    {h.lecturaInicio.libro.nombre} {h.lecturaInicio.capitulo}
                  </p>
                )}
                {h.versiculo && h.modo !== "lectura" && (
                  <p className="text-xs text-neutral-500">
                    {h.versiculo.libro.nombre} {h.versiculo.capitulo}:{h.versiculo.versiculo}
                  </p>
                )}
                {h.nota && (
                  <p className="mt-1 text-xs italic text-neutral-600 line-clamp-2">
                    “{h.nota}”
                  </p>
                )}
              </div>
              <time
                className="text-xs text-neutral-400"
                dateTime={h.creadoEn.toISOString()}
              >
                {h.creadoEn.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

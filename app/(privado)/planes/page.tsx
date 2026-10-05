import Link from "next/link";
import { BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { listarPlanesCatalogo, obtenerPlanActivo } from "@/lib/planes";
import { resolverUsuarioId } from "@/lib/usuario-actual";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planes de lectura" };

export default async function PlanesPage() {
  const [planes, usuarioId] = await Promise.all([
    listarPlanesCatalogo(),
    resolverUsuarioId({ crearSiNoExiste: false }),
  ]);
  const activo = usuarioId ? await obtenerPlanActivo(usuarioId) : null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Hábito</p>
        <h1 className="mt-2 font-serif text-3xl text-stone-900 sm:text-4xl">
          Planes de lectura
        </h1>
        <p className="mt-2 max-w-xl mx-auto text-sm text-stone-600">
          Leé la Biblia con propósito. Elegí un plan y construí el hábito día a día.
        </p>
      </header>

      {activo && (
        <section className="mb-8 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm sm:p-5">
          {/* Fila superior: emoji + título + (Continuar en desktop) */}
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="text-3xl shrink-0">{activo.planEmoji ?? "📖"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                Plan en curso
              </p>
              <h2 className="mt-1 font-serif text-lg leading-snug text-stone-900 sm:text-xl">
                {activo.planNombre}
              </h2>
            </div>
            <Link
              href="/planes/mio"
              className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 sm:inline-flex"
            >
              Continuar
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {/* Metadata con wrap */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-stone-600">
            <span className="font-medium">
              Día {activo.diaSiguienteParaLeer} / {activo.totalDias}
            </span>
            <span className="size-1 rounded-full bg-stone-300" aria-hidden />
            <span>{activo.porcentaje}% completado</span>
            {activo.atrasadoDias > 0 && (
              <>
                <span className="size-1 rounded-full bg-stone-300" aria-hidden />
                <span className="font-medium text-amber-700">
                  Atrasado {activo.atrasadoDias} día{activo.atrasadoDias === 1 ? "" : "s"}
                </span>
              </>
            )}
          </div>

          {/* Barra de progreso */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${activo.porcentaje}%` }}
            />
          </div>

          {/* CTA full-width en mobile */}
          <Link
            href="/planes/mio"
            className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 sm:hidden"
          >
            Continuar
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {planes.map((p) => (
          <Link
            key={p.id}
            href={`/planes/${p.slug}`}
            className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-3xl">{p.emoji ?? "📖"}</span>
              {p.esDestacado && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">
                  <Sparkles className="size-3" /> Destacado
                </span>
              )}
            </div>
            <h2 className="mt-3 font-serif text-lg leading-tight text-stone-900 group-hover:text-stone-700">
              {p.nombre}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
              {p.descripcion}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-stone-500">
                <BookOpen className="size-3.5" /> {p.dias} día{p.dias === 1 ? "" : "s"}
              </span>
              <span className="font-medium text-stone-700 group-hover:underline">
                Ver detalle →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

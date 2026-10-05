import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, BookOpen } from "lucide-react";
import { obtenerPlanPorSlug, pasajeATexto, type Pasaje } from "@/lib/planes";
import { LIBROS_POR_CODIGO } from "@/lib/libros";
import { BotonIniciarPlan } from "@/components/BotonIniciarPlan";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const plan = await obtenerPlanPorSlug(slug);
  return { title: plan?.nombre ?? "Plan de lectura" };
}

export default async function PlanDetallePage({ params }: Props) {
  const { slug } = await params;
  const plan = await obtenerPlanPorSlug(slug);
  if (!plan) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-14">
      <Link
        href="/planes"
        className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
      >
        <ChevronLeft className="size-4" /> Volver al catálogo
      </Link>

      <header className="text-center">
        <span className="text-5xl">{plan.emoji ?? "📖"}</span>
        <h1 className="mt-3 font-serif text-3xl text-stone-900">{plan.nombre}</h1>
        <p className="mt-3 mx-auto max-w-md text-sm leading-relaxed text-stone-600">
          {plan.descripcion}
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5" /> {plan.dias} día{plan.dias === 1 ? "" : "s"}
          </span>
          <span className="size-1 rounded-full bg-stone-300" />
          <span className="capitalize">{plan.categoria}</span>
        </div>
      </header>

      <div className="my-8 flex justify-center">
        <BotonIniciarPlan slug={plan.slug} />
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Vista previa de los primeros días
        </h2>
        <ul className="mt-3 divide-y divide-stone-100">
          {plan.diasContenido.map((d) => (
            <li key={d.dia} className="flex items-start gap-3 py-2.5">
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-700">
                {d.dia}
              </span>
              <div className="min-w-0 flex-1">
                {d.titulo && (
                  <p className="text-xs font-medium text-stone-700">{d.titulo}</p>
                )}
                <p className="text-sm text-stone-700">
                  {(d.pasajes as unknown as Pasaje[])
                    .map((p) =>
                      pasajeATexto(p, LIBROS_POR_CODIGO.get(p.libro)?.nombre ?? p.libro),
                    )
                    .join(" · ")}
                </p>
              </div>
              <BookOpen className="mt-1 size-3.5 shrink-0 text-stone-300" />
            </li>
          ))}
        </ul>
        {plan._count.diasContenido > 7 && (
          <p className="mt-3 text-center text-xs text-stone-500">
            …y {plan._count.diasContenido - 7} días más
          </p>
        )}
      </section>
    </main>
  );
}

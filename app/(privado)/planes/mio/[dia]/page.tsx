import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, BookOpen, Check } from "lucide-react";
import { obtenerPlanActivo, diaDelPlan, pasajeATexto, type Pasaje } from "@/lib/planes";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { LIBROS_POR_CODIGO } from "@/lib/libros";
import { BotonMarcarDiaLeido } from "@/components/BotonMarcarDiaLeido";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ dia: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { dia } = await params;
  return { title: `Día ${dia} · Plan de lectura` };
}

export default async function DiaLecturaPage({ params }: Props) {
  const { dia: diaParam } = await params;
  const dia = Number(diaParam);
  if (!Number.isInteger(dia) || dia < 1) notFound();

  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) redirect("/signin?next=/planes/mio");

  const activo = await obtenerPlanActivo(usuarioId);
  if (!activo) redirect("/planes");

  if (dia > activo.totalDias) notFound();

  const contenido = await diaDelPlan(activo.planUsuarioId, dia);
  if (!contenido) notFound();

  const diaAnterior = dia > 1 ? dia - 1 : null;
  const diaSiguiente = dia < activo.totalDias ? dia + 1 : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-14">
      <Link
        href="/planes/mio"
        className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
      >
        <ChevronLeft className="size-4" /> Mi plan
      </Link>

      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          {activo.planEmoji} {activo.planNombre}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-stone-900">
          Día {dia}
        </h1>
        {contenido.titulo && (
          <p className="mt-1 text-sm italic text-stone-600">{contenido.titulo}</p>
        )}
        <p className="mt-3 text-xs text-stone-500">de {activo.totalDias} días</p>
      </header>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Tu lectura para hoy
        </h2>
        <ul className="mt-3 space-y-2">
          {contenido.pasajes.map((p, i) => {
            const libro = LIBROS_POR_CODIGO.get(p.libro);
            const ref = pasajeATexto(p, libro?.nombre ?? p.libro);
            return (
              <li key={i}>
                <Link
                  href={`/leer/${p.libro}/${p.capInicio}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 transition hover:border-stone-400 hover:bg-white"
                >
                  <span className="flex items-center gap-3">
                    <BookOpen className="size-4 text-stone-400 group-hover:text-stone-700" />
                    <span className="font-medium text-stone-800 group-hover:text-stone-900">
                      {ref}
                    </span>
                  </span>
                  <span className="text-xs text-stone-500 group-hover:text-stone-700">
                    Leer →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6">
        <BotonMarcarDiaLeido
          planUsuarioId={activo.planUsuarioId.toString()}
          dia={dia}
          leidoInicial={contenido.leido}
          notasInicial={contenido.notas ?? ""}
          siguienteDia={diaSiguiente}
        />
      </section>

      <nav className="mt-8 flex items-center justify-between text-sm text-stone-500">
        {diaAnterior ? (
          <Link
            href={`/planes/mio/${diaAnterior}`}
            className="inline-flex items-center gap-1 hover:text-stone-800"
          >
            <ChevronLeft className="size-4" /> Día {diaAnterior}
          </Link>
        ) : (
          <span />
        )}
        {diaSiguiente ? (
          <Link
            href={`/planes/mio/${diaSiguiente}`}
            className="inline-flex items-center gap-1 hover:text-stone-800"
          >
            Día {diaSiguiente}
            <ChevronLeft className="size-4 rotate-180" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}

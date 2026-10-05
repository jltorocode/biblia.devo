import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { obtenerPlanActivo, diasDelPlan } from "@/lib/planes";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { CalendarioPlan } from "@/components/CalendarioPlan";
import { BotonAbandonarPlan } from "@/components/BotonAbandonarPlan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi plan de lectura" };

export default async function MiPlanPage() {
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) redirect("/signin?next=/planes/mio");

  const activo = await obtenerPlanActivo(usuarioId);
  if (!activo) redirect("/planes");

  const dias = await diasDelPlan(activo.planUsuarioId);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <Link
        href="/planes"
        className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
      >
        <ChevronLeft className="size-4" /> Ver otros planes
      </Link>

      <header className="text-center">
        <span className="text-5xl">{activo.planEmoji ?? "📖"}</span>
        <h1 className="mt-3 font-serif text-3xl text-stone-900">{activo.planNombre}</h1>
        <p className="mt-2 text-sm text-stone-500">
          Día {activo.diaSiguienteParaLeer} de {activo.totalDias}
          {activo.atrasadoDias > 0 && (
            <span className="ml-2 text-amber-700">
              · atrasado {activo.atrasadoDias} día{activo.atrasadoDias === 1 ? "" : "s"}
            </span>
          )}
        </p>

        <div className="mx-auto mt-4 max-w-md">
          <div className="h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
              style={{ width: `${activo.porcentaje}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {activo.diasLeidos} de {activo.totalDias} días leídos ({activo.porcentaje}%)
          </p>
        </div>

        {!activo.estaCompleto && (
          <Link
            href={`/planes/mio/${activo.diaSiguienteParaLeer}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-base font-medium text-white shadow-lg transition hover:bg-stone-800"
          >
            Leer día {activo.diaSiguienteParaLeer} →
          </Link>
        )}
        {activo.estaCompleto && (
          <div className="mt-6 inline-flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4">
            <p className="text-3xl">🎉</p>
            <p className="font-medium text-emerald-800">Completado</p>
            <p className="text-xs text-emerald-700">¡Terminaste este plan!</p>
          </div>
        )}
      </header>

      <section className="mt-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Tu calendario
        </h2>
        <CalendarioPlan
          planUsuarioId={activo.planUsuarioId.toString()}
          dias={dias.map((d) => ({
            dia: d.dia,
            leido: d.leido,
            titulo: d.titulo,
          }))}
          diaActual={activo.diaActualSegunCalendario}
          diaSiguiente={activo.diaSiguienteParaLeer}
        />
      </section>

      <section className="mt-10 flex justify-center">
        <BotonAbandonarPlan planUsuarioId={activo.planUsuarioId.toString()} />
      </section>
    </main>
  );
}

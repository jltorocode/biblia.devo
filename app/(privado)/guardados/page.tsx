import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { LIMITES, planDeUsuario } from "@/lib/plan-limits";
import { QuitarGuardadoBoton } from "@/components/QuitarGuardadoBoton";
import { COLORES_POR_SLUG, esColorValido } from "@/lib/subrayados";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guardados" };

export default async function GuardadosPage() {
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!sesion?.user?.id) redirect("/signin");

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.user.id },
    select: { premiumHasta: true },
  });
  const plan = planDeUsuario(usuario?.premiumHasta);

  const guardados = await prisma.versiculoGuardado.findMany({
    where: { usuarioId: sesion.user.id },
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      creadoEn: true,
      notaPersonal: true,
      color: true,
      versiculo: {
        select: {
          id: true,
          capitulo: true,
          versiculo: true,
          texto: true,
          libro: { select: { nombre: true, codigo: true } },
        },
      },
    },
  });

  const total = guardados.length;
  const limite = LIMITES[plan].guardados;
  const cerca = plan === "FREE" && total >= LIMITES.FREE.guardados - 2;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-12 pt-16">
      <header className="mb-6">
        <h1 className="text-2xl font-medium text-neutral-800">Tus guardados</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {plan === "PREMIUM"
            ? `${total} versículos guardados.`
            : `${total} de ${limite} (plan gratuito).`}
        </p>
      </header>

      {cerca && plan === "FREE" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Estás llegando al límite del plan gratuito.{" "}
          <Link href="/premium" className="font-medium underline">
            Probar Premium
          </Link>{" "}
          para guardados ilimitados.
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-8 py-12 text-center">
          <Heart className="mx-auto size-7 text-stone-300" aria-hidden="true" />
          <p
            className="mt-3 font-serif text-lg text-stone-700"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            Ningún versículo guardado todavía.
          </p>
          <p className="mt-1 text-sm text-stone-500 mb-6">
            Cuando uno te toque, tocá el corazón para volver a leerlo cuando lo necesites.
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-stone-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-900"
          >
            Buscar un versículo
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {guardados.map((g) => {
            const colorInfo = esColorValido(g.color) ? COLORES_POR_SLUG.get(g.color) : null;
            return (
              <li
                key={g.id.toString()}
                className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                {/* Tira de color a la izquierda si es subrayado */}
                {colorInfo && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 h-full w-1.5"
                    style={{ backgroundColor: colorInfo.hex }}
                  />
                )}
                <div className={`flex-1 ${colorInfo ? "pl-2" : ""}`}>
                  <p
                    className="text-base leading-relaxed text-neutral-800"
                    style={{ fontFamily: "var(--devo-font-serif)" }}
                  >
                    {g.versiculo.texto}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xs font-medium text-neutral-500">
                    <Link
                      href={`/leer/${g.versiculo.libro.codigo}/${g.versiculo.capitulo}`}
                      className="hover:text-neutral-800 hover:underline"
                    >
                      {g.versiculo.libro.nombre} {g.versiculo.capitulo}:{g.versiculo.versiculo}
                    </Link>
                    {colorInfo && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                        style={{
                          backgroundColor: colorInfo.bg,
                          color: "#3a2a1a",
                        }}
                      >
                        subrayado
                      </span>
                    )}
                  </p>
                  {g.notaPersonal && (
                    <p className="mt-2 text-xs italic text-neutral-500">{g.notaPersonal}</p>
                  )}
                </div>
                <QuitarGuardadoBoton versiculoId={g.versiculo.id.toString()} />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

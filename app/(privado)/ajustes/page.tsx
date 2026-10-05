import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { planDeUsuario } from "@/lib/plan-limits";
import { BotonSignOut } from "@/components/BotonSignOut";
import { BotonCancelarSuscripcion } from "@/components/BotonCancelarSuscripcion";
import { SelectorTema } from "@/components/SelectorTema";
import { getTemaActual } from "@/lib/tema-actual";
import { SelectorVersion } from "@/components/SelectorVersion";
import { listarVersionesParaUsuario } from "@/lib/versiones-biblia";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!sesion?.user?.id) redirect("/signin");

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.user.id },
    select: {
      email: true,
      nombre: true,
      rol: true,
      creadoEn: true,
      premiumHasta: true,
      versionPrefId: true,
      _count: { select: { guardados: true, entradas: true } },
    },
  });
  if (!usuario) redirect("/signin");

  const plan = planDeUsuario(usuario.premiumHasta);
  const tema = await getTemaActual();
  const versiones = await listarVersionesParaUsuario(sesion.user.id);

  const suscripcion = await prisma.suscripcion.findFirst({
    where: { usuarioId: sesion.user.id, status: "active" },
    orderBy: { periodEnd: "desc" },
    select: {
      id: true,
      provider: true,
      plan: true,
      periodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-12 pt-16">
      <header className="mb-6">
        <h1 className="text-2xl font-medium text-neutral-800">Ajustes</h1>
      </header>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <Row label="Email" value={usuario.email ?? "—"} />
        <Row label="Nombre" value={usuario.nombre ?? "—"} />
        <Row
          label="Plan"
          value={
            plan === "PREMIUM"
              ? `Premium hasta ${usuario.premiumHasta?.toLocaleDateString("es-AR")}`
              : "Gratuito"
          }
        />
        <Row label="Versículos guardados" value={String(usuario._count.guardados)} />
        <Row label="Entradas en tu diario" value={String(usuario._count.entradas)} />
        <Row
          label="Cuenta creada"
          value={usuario.creadoEn.toLocaleDateString("es-AR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        />
      </section>

      <section className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-medium text-neutral-800">Suscripción</h2>
        {!suscripcion && plan === "FREE" && (
          <p className="text-sm text-neutral-600">
            Estás en el plan gratuito.{" "}
            <Link href="/premium" className="font-medium underline">
              Probar Premium
            </Link>
            .
          </p>
        )}
        {suscripcion && (
          <>
            <Row
              label="Provider"
              value={suscripcion.provider[0].toUpperCase() + suscripcion.provider.slice(1)}
            />
            <Row
              label="Plan"
              value={suscripcion.plan === "premium_anual" ? "Anual" : "Mensual"}
            />
            <Row
              label="Próximo cobro / fin"
              value={suscripcion.periodEnd.toLocaleDateString("es-AR")}
            />
            <Row
              label="Estado"
              value={
                suscripcion.cancelAtPeriodEnd
                  ? "Cancelada (mantiene acceso hasta fin de período)"
                  : "Activa"
              }
            />
            {!suscripcion.cancelAtPeriodEnd && (
              <BotonCancelarSuscripcion hasta={suscripcion.periodEnd.toISOString()} />
            )}
          </>
        )}
      </section>

      {/* Versión preferida de la Biblia */}
      <section className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-medium text-neutral-800">Versión de la Biblia</h2>
        <SelectorVersion
          versiones={versiones.map((v) => ({
            id: v.id,
            codigo: v.codigo,
            nombre: v.nombre,
            esApi: v.esApi,
          }))}
          preferidaId={usuario.versionPrefId ?? null}
        />
      </section>

      {/* Selector de tema */}
      <section className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-medium text-neutral-800">Apariencia</h2>
        <p className="text-sm text-neutral-500">
          Elegí el tema visual que más te acompañe en tu lectura.
        </p>
        <div className="mt-4">
          <SelectorTema temaActivo={tema.slug} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-medium text-stone-800">Tu caminar</h2>
        <p className="mt-1 text-sm text-stone-500">
          Estadísticas, racha, logros, heatmap del año.
        </p>
        <Link
          href="/estadisticas"
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          Ver mi caminar →
        </Link>
      </section>

      {usuario.rol === "admin" && (
        <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-6">
          <h2 className="text-base font-medium text-violet-900">Panel admin</h2>
          <p className="mt-1 text-sm text-violet-700">
            Sos admin de esta instancia. Podés gestionar versiones de la Biblia, usuarios y temas.
          </p>
          <Link
            href="/admin"
            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-800"
          >
            Abrir /admin →
          </Link>
        </section>
      )}

      <div className="mt-6 flex justify-end">
        <BotonSignOut />
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  );
}

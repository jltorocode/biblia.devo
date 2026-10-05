import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, CheckCircle2, Archive, Clock } from "lucide-react";
import { listarPeticiones, contarPorEstado, CATEGORIAS_POR_SLUG, type EstadoPeticion } from "@/lib/peticiones";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { NuevaPeticionForm } from "@/components/NuevaPeticionForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Oraciones" };

interface Props {
  searchParams: Promise<{ estado?: EstadoPeticion }>;
}

export default async function OracionPage({ searchParams }: Props) {
  const { estado: estadoQs } = await searchParams;
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) redirect("/signin?next=/oracion");

  const filtro: EstadoPeticion | undefined =
    estadoQs === "pendiente" || estadoQs === "respondida" || estadoQs === "archivada" ? estadoQs : "pendiente";

  const [peticiones, conteos] = await Promise.all([
    listarPeticiones(usuarioId, { estado: filtro }),
    contarPorEstado(usuarioId),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-14">
      <header className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Lista de</p>
        <h1 className="mt-2 font-serif text-3xl text-stone-900">Mis oraciones</h1>
        <p className="mt-2 text-sm text-stone-600">
          Anotá tus peticiones y celebrá cuando Dios responde.
        </p>
      </header>

      <NuevaPeticionForm />

      <nav className="mt-8 flex justify-center gap-2 text-sm">
        <TabFiltro
          activo={filtro === "pendiente"}
          href="/oracion?estado=pendiente"
          icon={<Clock className="size-3.5" />}
          label="Pendientes"
          count={conteos.pendiente}
        />
        <TabFiltro
          activo={filtro === "respondida"}
          href="/oracion?estado=respondida"
          icon={<CheckCircle2 className="size-3.5" />}
          label="Respondidas"
          count={conteos.respondida}
        />
        <TabFiltro
          activo={filtro === "archivada"}
          href="/oracion?estado=archivada"
          icon={<Archive className="size-3.5" />}
          label="Archivo"
          count={conteos.archivada}
        />
      </nav>

      <section className="mt-6">
        {peticiones.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 p-8 text-center text-sm text-stone-500">
            {filtro === "pendiente" && "No tenés peticiones pendientes. Anotá una arriba ↑"}
            {filtro === "respondida" && "Todavía no marcaste ninguna como respondida."}
            {filtro === "archivada" && "Tu archivo está vacío."}
          </div>
        ) : (
          <ul className="space-y-2">
            {peticiones.map((p) => {
              const cat = CATEGORIAS_POR_SLUG.get(p.categoria);
              return (
                <li key={p.id}>
                  <Link
                    href={`/oracion/${p.id}`}
                    className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 transition hover:border-stone-400 hover:shadow-sm"
                  >
                    <span className="text-2xl">{cat?.emoji ?? "✨"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-stone-900 group-hover:text-stone-700">
                        {p.titulo}
                      </p>
                      {p.descripcion && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
                          {p.descripcion}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-stone-400">
                        <span>{cat?.nombre}</span>
                        <span className="size-1 rounded-full bg-stone-300" />
                        <span>{new Date(p.fechaPedida).toLocaleDateString("es-AR")}</span>
                        {p.estado === "respondida" && (
                          <>
                            <span className="size-1 rounded-full bg-stone-300" />
                            <span className="font-semibold text-emerald-600">Respondida</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function TabFiltro({
  activo,
  href,
  icon,
  label,
  count,
}: {
  activo: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
        activo
          ? "bg-stone-900 text-white"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${
          activo ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { obtenerPeticion, CATEGORIAS_POR_SLUG } from "@/lib/peticiones";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { DetallePeticion } from "@/components/DetallePeticion";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Oración #${id}` };
}

export default async function PeticionDetalle({ params }: Props) {
  const { id } = await params;
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) redirect("/signin?next=/oracion");

  const p = await obtenerPeticion(id, usuarioId);
  if (!p) notFound();

  const cat = CATEGORIAS_POR_SLUG.get(p.categoria);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-14">
      <Link
        href="/oracion"
        className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
      >
        <ChevronLeft className="size-4" /> Mis oraciones
      </Link>

      <header className="text-center">
        <span className="text-5xl">{cat?.emoji ?? "✨"}</span>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">
          {cat?.nombre}
        </p>
        <h1 className="mt-1 font-serif text-2xl text-stone-900">{p.titulo}</h1>
        {p.estado === "respondida" && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            ✓ Respondida
          </p>
        )}
        {p.estado === "archivada" && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Archivada
          </p>
        )}
        <p className="mt-2 text-xs text-stone-500">
          Pedida el {new Date(p.fechaPedida).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
          {p.fechaRespondida && (
            <span> · respondida el {new Date(p.fechaRespondida).toLocaleDateString("es-AR")}</span>
          )}
        </p>
      </header>

      {p.descripcion && (
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {p.descripcion}
          </p>
        </section>
      )}

      {p.respuesta && (
        <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Cómo Dios respondió
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-emerald-900">
            {p.respuesta}
          </p>
        </section>
      )}

      <DetallePeticion peticion={p} />
    </main>
  );
}

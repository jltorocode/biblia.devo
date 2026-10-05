import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, BookOpen } from "lucide-react";
import { buscarLibre, buscarEnMisNotas, parsearReferencia } from "@/lib/buscar";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { LIBROS_POR_CODIGO } from "@/lib/libros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buscar" };

interface Props {
  searchParams: Promise<{ q?: string; en?: "biblia" | "notas" }>;
}

export default async function BuscarPage({ searchParams }: Props) {
  const { q, en } = await searchParams;
  const query = (q ?? "").trim();
  const tab: "biblia" | "notas" = en === "notas" ? "notas" : "biblia";

  // Si parece una referencia exacta, redirect
  if (query) {
    const ref = parsearReferencia(query);
    if (ref) {
      redirect(`/leer/${ref.libroCodigo}/${ref.capitulo}`);
    }
  }

  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });

  const resultados =
    !query
      ? null
      : tab === "biblia"
        ? { tipo: "biblia" as const, items: await buscarLibre(query, { k: 30 }) }
        : usuarioId
          ? { tipo: "notas" as const, items: await buscarEnMisNotas(usuarioId, query) }
          : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-14">
      <header className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Buscar</p>
        <h1 className="mt-2 font-serif text-3xl text-stone-900">¿Qué buscás?</h1>
        <p className="mt-2 text-sm text-stone-600">
          Palabra, tema o referencia. Ej: <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">paz</code>{" "}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">Juan 3:16</code>{" "}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">ansiedad</code>
        </p>
      </header>

      <form action="/buscar" method="get" className="mb-6">
        <input type="hidden" name="en" value={tab} />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder='"paz", "no temas", "Juan 3:16"'
            autoFocus={!query}
            className="w-full rounded-full border-2 border-stone-200 bg-white px-4 py-3 pl-12 text-base text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
          />
        </div>
      </form>

      {usuarioId && (
        <nav className="mb-6 flex justify-center gap-2 text-sm">
          <TabLink activo={tab === "biblia"} href={`/buscar?q=${encodeURIComponent(query)}&en=biblia`}>
            En la Biblia
          </TabLink>
          <TabLink activo={tab === "notas"} href={`/buscar?q=${encodeURIComponent(query)}&en=notas`}>
            En mis notas
          </TabLink>
        </nav>
      )}

      {!query && (
        <p className="rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
          Escribí algo arriba y aprietá Enter.
        </p>
      )}

      {resultados?.tipo === "biblia" && (
        <ResultadosBiblia items={resultados.items} query={query} />
      )}

      {resultados?.tipo === "notas" && (
        <ResultadosNotas items={resultados.items} query={query} />
      )}
    </main>
  );
}

function TabLink({
  activo,
  href,
  children,
}: {
  activo: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 transition ${
        activo
          ? "bg-stone-900 text-white"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {children}
    </Link>
  );
}

function ResultadosBiblia({
  items,
  query,
}: {
  items: Awaited<ReturnType<typeof buscarLibre>>;
  query: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
        No encontré nada para “{query}”. Probá con otra palabra.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">
        {items.length} versículos encontrados
      </p>
      {items.map((r) => {
        const referencia = `${r.libroNombre} ${r.capitulo}:${r.versiculo}`;
        const libro = LIBROS_POR_CODIGO.get(r.libroCodigo);
        return (
          <li key={r.versiculoId}>
            <Link
              href={`/leer/${r.libroCodigo}/${r.capitulo}`}
              className="group block rounded-xl border border-stone-200 bg-white p-4 transition hover:border-stone-400 hover:shadow-sm"
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">{referencia}</span>
                <span className="text-[10px] uppercase tracking-wider text-stone-400">
                  {libro?.testamento === "AT" ? "Antiguo T." : "Nuevo T."}
                </span>
              </div>
              <p
                className="text-sm leading-relaxed text-stone-700"
                style={{ fontFamily: "var(--devo-font-serif, var(--font-lora))" }}
              >
                {r.texto}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ResultadosNotas({
  items,
  query,
}: {
  items: Awaited<ReturnType<typeof buscarEnMisNotas>>;
  query: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
        No encontré “{query}” en tus reflexiones.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">
        {items.length} reflexiones
      </p>
      {items.map((r) => (
        <li key={`${r.origen}-${r.id}`}>
          <Link
            href={r.href}
            className="group block rounded-xl border border-stone-200 bg-white p-4 transition hover:border-stone-400 hover:shadow-sm"
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-stone-500">
                {r.origen === "entrada" ? "Diario" : "Plan de lectura"}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-stone-400">
                {new Date(r.fecha).toLocaleDateString("es-AR")}
              </span>
            </div>
            <p className="text-sm text-stone-700">{r.preview}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

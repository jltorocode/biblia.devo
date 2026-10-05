import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LIBROS_POR_CODIGO } from "@/lib/libros";
import { tituloCapitulo } from "@/lib/capitulos-titulos";

interface Props {
  params: Promise<{ libro: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { libro } = await params;
  const info = LIBROS_POR_CODIGO.get(libro);
  if (!info) return { title: "Libro no encontrado" };
  return {
    title: info.nombre,
    description: `Capítulos de ${info.nombre} en Reina-Valera 1909.`,
  };
}

export default async function CapitulosPage({ params }: Props) {
  const { libro } = await params;
  const info = LIBROS_POR_CODIGO.get(libro);
  if (!info) notFound();

  const capitulos = Array.from({ length: info.numCapitulos }, (_, i) => i + 1);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5 sm:py-12">
      <header className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          <Link href="/leer" className="hover:underline">
            Libros
          </Link>
        </p>
        <h1 className="mt-2 font-serif text-3xl text-stone-800 sm:text-4xl">
          {info.nombre}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {info.numCapitulos} capítulo{info.numCapitulos > 1 ? "s" : ""}
        </p>
      </header>

      {/* Grid compacto de números (atajo rápido) */}
      <div className="mb-6 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {capitulos.map((c) => (
          <a
            key={c}
            href={`#cap-${c}`}
            className="flex aspect-square items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 transition hover:border-stone-400 hover:bg-stone-50"
          >
            {c}
          </a>
        ))}
      </div>

      {/* Lista con subtítulos descriptivos */}
      <ul className="space-y-1.5">
        {capitulos.map((c) => {
          const titulo = tituloCapitulo(info.codigo, c);
          return (
            <li key={c} id={`cap-${c}`} className="scroll-mt-20">
              <Link
                href={`/leer/${info.codigo}/${c}`}
                className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 transition hover:border-stone-400 hover:bg-stone-50"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 font-serif text-sm font-semibold text-stone-700 group-hover:bg-stone-200">
                  {c}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-base leading-snug text-stone-900">
                    {info.nombre} {c}
                  </p>
                  {titulo && (
                    <p className="mt-0.5 truncate text-xs italic text-stone-600">
                      {titulo}
                    </p>
                  )}
                </div>
                <span className="text-stone-300 transition group-hover:text-stone-500">
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

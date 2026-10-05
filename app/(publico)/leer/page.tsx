import Link from "next/link";
import type { Metadata } from "next";
import { LIBROS } from "@/lib/libros";

export const metadata: Metadata = {
  title: "Leer la Biblia",
  description: "Elegí un libro y leé directamente la Palabra. Reina-Valera 1909.",
};

export default function LeerPage() {
  const at = LIBROS.filter((l) => l.testamento === "AT");
  const nt = LIBROS.filter((l) => l.testamento === "NT");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
      <header className="mb-10 text-center">
        <h1 className="font-serif text-3xl text-stone-800">Leer la Biblia</h1>
        <p className="mt-2 text-sm text-stone-500">
          Elegí un libro. Después un capítulo. Y dejá tu reflexión.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/timeline"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100"
          >
            ✦ Línea de tiempo
          </Link>
          <Link
            href="/trivia"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
          >
            🎮 Trivia bíblica
          </Link>
        </div>
      </header>

      <Seccion titulo="Antiguo Testamento" libros={at} />
      <Seccion titulo="Nuevo Testamento" libros={nt} className="mt-10" />
    </main>
  );
}

function Seccion({
  titulo,
  libros,
  className,
}: {
  titulo: string;
  libros: typeof LIBROS;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-xs uppercase tracking-[0.18em] text-stone-500">{titulo}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {libros.map((l) => (
          <Link
            key={l.codigo}
            href={`/leer/${l.codigo}`}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 transition hover:border-stone-400 hover:bg-stone-50"
          >
            <span className="font-medium">{l.nombre}</span>
            <span className="ml-1 text-xs text-neutral-400">{l.numCapitulos}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

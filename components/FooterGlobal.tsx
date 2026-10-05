import Link from "next/link";

export function FooterGlobal() {
  return (
    <footer className="mt-auto border-t border-stone-200/70 bg-stone-50/50 py-6 px-6 text-sm text-stone-500">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-serif">
          Devocional &middot; La Palabra de Dios para cada momento.
        </p>
        <nav className="flex flex-wrap gap-5">
          <Link href="/menu" className="hover:text-stone-700 underline-offset-4 hover:underline">
            Todas las secciones
          </Link>
          <Link href="/trivia" className="hover:text-stone-700 underline-offset-4 hover:underline">
            Trivia
          </Link>
          <Link href="/timeline" className="hover:text-stone-700 underline-offset-4 hover:underline">
            Línea de tiempo
          </Link>
          <Link href="/leer" className="hover:text-stone-700 underline-offset-4 hover:underline">
            Leer la Biblia
          </Link>
          <Link href="/privacidad" className="hover:text-stone-700 underline-offset-4 hover:underline">
            Privacidad
          </Link>
          <Link href="/terminos" className="hover:text-stone-700 underline-offset-4 hover:underline">
            Términos
          </Link>
        </nav>
      </div>
    </footer>
  );
}

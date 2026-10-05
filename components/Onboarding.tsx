// Panel introductorio que aparece SOLO si el usuario aun no tiene entradas.
// Server Component: la decision de mostrarlo se hace antes de renderizar.

import Link from "next/link";

const TARJETAS = [
  {
    emoji: "💭",
    titulo: "Decí cómo estás",
    bajada: "Elegí un estado y recibí un versículo curado para ese momento.",
  },
  {
    emoji: "🗣️",
    titulo: "Contá el porqué",
    bajada: "¿Trabajo, pareja, familia? El versículo se guarda con el contexto.",
  },
  {
    emoji: "📖",
    titulo: "Leé la Biblia",
    bajada: "Abrila en cualquier capítulo y dejá tu reflexión.",
  },
];

export function Onboarding() {
  return (
    <section className="mb-10 rounded-2xl border border-stone-200 bg-gradient-to-b from-white to-stone-50/50 px-6 py-7 sm:px-8 sm:py-8 shadow-sm">
      <header className="text-center mb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-400 mb-2">
          Tu primera vez
        </p>
        <h2
          className="font-serif text-2xl text-stone-800"
          style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
        >
          Tres formas de buscar Su voz
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Sin algoritmos extraños. Sin IA hablando por Dios. Solo tú, Su Palabra y tu reflexión.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TARJETAS.map((t) => (
          <div
            key={t.titulo}
            className="rounded-xl border border-stone-100 bg-white px-4 py-5 text-center"
          >
            <p className="text-3xl mb-2" aria-hidden>
              {t.emoji}
            </p>
            <p className="font-medium text-stone-800">{t.titulo}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">{t.bajada}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-stone-500">
        Una entrada al día gratis. Más con{" "}
        <Link href="/premium" className="underline underline-offset-2 hover:text-stone-700">
          Premium
        </Link>
        .
      </p>
    </section>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  PREGUNTAS,
  PREGUNTAS_POR_RONDA,
  preguntasPorLibro,
  preguntasPorTestamento,
  preguntasAleatorias,
  type Pregunta,
} from "@/lib/trivia";
import { LIBROS_POR_CODIGO } from "@/lib/libros";
import { TriviaGame } from "@/components/TriviaGame";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jugando · Trivia bíblica",
};

interface Props {
  searchParams: Promise<{
    modo?: "mezcla" | "at" | "nt" | "libro";
    libro?: string;
  }>;
}

export default async function JugarPage({ searchParams }: Props) {
  const { modo = "mezcla", libro } = await searchParams;

  let pool: Pregunta[];
  let modoLabel: string;
  let modoEmoji: string;

  if (modo === "libro" && libro) {
    pool = preguntasPorLibro(libro);
    const l = LIBROS_POR_CODIGO.get(libro);
    modoLabel = l?.nombre ?? libro;
    modoEmoji = "📖";
  } else if (modo === "at") {
    pool = preguntasPorTestamento("AT");
    modoLabel = "Antiguo Testamento";
    modoEmoji = "📜";
  } else if (modo === "nt") {
    pool = preguntasPorTestamento("NT");
    modoLabel = "Nuevo Testamento";
    modoEmoji = "✝️";
  } else {
    pool = PREGUNTAS;
    modoLabel = "Mezcla total";
    modoEmoji = "🎲";
  }

  // Si el pool está vacío (libro inválido o sin preguntas), volver al hub
  if (pool.length === 0) {
    redirect("/trivia");
  }

  // Selección aleatoria. Si hay menos preguntas que las que pediríamos, jugar las que haya.
  const cantidad = Math.min(PREGUNTAS_POR_RONDA, pool.length);
  // Semilla basada en Date.now() (server) — cada SSR genera un orden distinto.
  // Al ser force-dynamic, esto es nuevo cada navegación.
  // eslint-disable-next-line react-hooks/purity
  const semilla = Date.now() & 0xffffffff;
  const preguntas = preguntasAleatorias(pool, cantidad, semilla);

  return (
    <main className="flex-1">
      <TriviaGame
        preguntas={preguntas}
        modoLabel={modoLabel}
        modoEmoji={modoEmoji}
        modoHref="/trivia"
      />

      {/* Footer mínimo bajo el juego */}
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-2 text-center">
        <Link
          href="/trivia"
          className="text-xs text-stone-500 underline-offset-4 hover:text-stone-700 hover:underline"
        >
          ← Cambiar de modo
        </Link>
      </div>
    </main>
  );
}

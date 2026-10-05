import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, BookOpen, Zap, Clock, Heart } from "lucide-react";
import { LIBROS } from "@/lib/libros";
import { conteoPorLibro, statsTrivia, PREGUNTAS_POR_RONDA } from "@/lib/trivia";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Trivia bíblica · ¿Cuánto sabés?",
  description:
    "Mega juego de trivia bíblica: los 66 libros, modo contrarreloj estilo Duolingo. Vidas, rachas y puntaje. Diversión que enseña.",
};

export default function TriviaHubPage() {
  const stats = statsTrivia();
  const conteo = conteoPorLibro();
  const at = LIBROS.filter((l) => l.testamento === "AT");
  const nt = LIBROS.filter((l) => l.testamento === "NT");

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-amber-50 via-orange-50/40 to-white"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(251, 146, 60, 0.18), transparent 50%), radial-gradient(circle at 80% 60%, rgba(16, 185, 129, 0.12), transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-5 py-16 sm:py-20 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-600">
            🎮 Mega trivia bíblica
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-stone-900 sm:text-5xl">
            ¿Cuánto sabés de{" "}
            <span className="bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 bg-clip-text text-transparent">
              la Biblia
            </span>
            ?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-stone-600">
            {stats.totalPreguntas} preguntas curadas, los 66 libros, contrarreloj. 3 vidas, racha
            x2 y puntaje. Cuando lo arrasés, andá a leer ;)
          </p>

          {/* Mini explicación de mecánicas */}
          <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-3 text-xs">
            <Pill icon={<Clock className="size-3.5" />} label="15s por pregunta" />
            <Pill icon={<Heart className="size-3.5 fill-rose-500 text-rose-500" />} label="3 vidas" />
            <Pill icon={<Zap className="size-3.5 text-amber-500" />} label="Racha x N" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 pb-16">
        {/* Modos rápidos */}
        <section className="mt-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            ⚡ Empezar ya
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <ModoCard
              href="/trivia/jugar?modo=mezcla"
              emoji="🎲"
              titulo="Mezcla total"
              desc={`${PREGUNTAS_POR_RONDA} preguntas al azar de toda la Biblia`}
              gradient="from-amber-100 via-orange-100 to-rose-100"
            />
            <ModoCard
              href="/trivia/jugar?modo=at"
              emoji="📜"
              titulo="Antiguo Testamento"
              desc={`${stats.at} preguntas · de Génesis a Malaquías`}
              gradient="from-yellow-100 via-amber-100 to-orange-100"
            />
            <ModoCard
              href="/trivia/jugar?modo=nt"
              emoji="✝️"
              titulo="Nuevo Testamento"
              desc={`${stats.nt} preguntas · de Mateo a Apocalipsis`}
              gradient="from-emerald-100 via-teal-100 to-sky-100"
            />
          </div>
        </section>

        {/* Por libro */}
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            📚 Por libro
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {stats.librosCubiertos} de 66 libros tienen preguntas. Toca uno para jugar solo con ese.
          </p>

          <h3 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Antiguo Testamento
          </h3>
          <LibroGrid libros={at} conteo={conteo} />

          <h3 className="mt-8 mb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Nuevo Testamento
          </h3>
          <LibroGrid libros={nt} conteo={conteo} />
        </section>

        {/* CTA leer */}
        <section className="mt-16 rounded-3xl bg-stone-900 p-8 text-center sm:p-10">
          <Sparkles className="mx-auto mb-3 size-6 text-amber-300" aria-hidden />
          <h2 className="font-serif text-2xl text-white sm:text-3xl">
            La mejor preparación es leer
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-300">
            Cada respuesta correcta empieza por una buena lectura. Andá a la fuente.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/leer"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-amber-300"
            >
              <BookOpen className="size-4" aria-hidden />
              Leer la Biblia
            </Link>
            <Link
              href="/timeline"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
            >
              ✦ Línea de tiempo
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-stone-200 backdrop-blur">
      {icon}
      <span className="text-stone-700">{label}</span>
    </span>
  );
}

function ModoCard({
  href,
  emoji,
  titulo,
  desc,
  gradient,
}: {
  href: string;
  emoji: string;
  titulo: string;
  desc: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 ring-1 ring-stone-200/70 transition hover:scale-[1.02] hover:shadow-md active:scale-100`}
    >
      <div className="text-3xl">{emoji}</div>
      <h3 className="mt-2 font-serif text-lg text-stone-900">{titulo}</h3>
      <p className="mt-1 text-xs text-stone-700">{desc}</p>
      <span className="absolute right-4 top-4 text-xs font-semibold text-stone-700 opacity-0 transition group-hover:opacity-100">
        Jugar →
      </span>
    </Link>
  );
}

function LibroGrid({
  libros,
  conteo,
}: {
  libros: typeof LIBROS;
  conteo: Map<string, number>;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
      {libros.map((l) => {
        const n = conteo.get(l.codigo) ?? 0;
        const disponible = n > 0;
        if (!disponible) {
          return (
            <div
              key={l.codigo}
              className="rounded-lg border border-dashed border-stone-200 bg-stone-50/50 px-3 py-2.5 text-sm text-stone-400"
            >
              <span>{l.nombre}</span>
              <span className="ml-1 text-[10px]">—</span>
            </div>
          );
        }
        return (
          <Link
            key={l.codigo}
            href={`/trivia/jugar?modo=libro&libro=${l.codigo}`}
            className="group flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 transition hover:border-amber-400 hover:bg-amber-50/40"
          >
            <span className="font-medium">{l.nombre}</span>
            <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 group-hover:bg-amber-100 group-hover:text-amber-800">
              {n}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

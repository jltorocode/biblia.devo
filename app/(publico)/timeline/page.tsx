import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Users, Sparkles, ArrowRight } from "lucide-react";
import {
  ERAS,
  HITOS,
  TIPO_HITO,
  obtenerEstadisticas,
  type Era,
  type Hito,
} from "@/lib/timeline-biblica";
import { LIBROS_POR_CODIGO } from "@/lib/libros";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Línea de tiempo bíblica · De Génesis a Apocalipsis",
  description:
    "Toda la Biblia como una sola historia. Hitos, eras y personajes — desde la Creación hasta la visión de Juan en Patmos. Una vista cronológica con los pasajes clave para leer.",
};

export default function TimelinePage() {
  const stats = obtenerEstadisticas();

  return (
    <main className="flex-1">
      {/* ───────── Hero cinemático ───────── */}
      <section id="top" className="relative overflow-hidden scroll-mt-24">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-amber-50 via-stone-50 to-white"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.10), transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-5 py-20 sm:py-28 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">
            ✦ De Génesis a Apocalipsis ✦
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-stone-900 sm:text-6xl">
            La Biblia es{" "}
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
              una sola historia
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
            Una sola trama desde la Creación hasta la Nueva Jerusalén — con
            promesas que tardan milenios en cumplirse y un protagonista que
            recorre cada página.
          </p>

          {/* Stats row */}
          <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat numero={stats.totalHitos} label="Hitos" />
            <Stat numero={stats.totalEras} label="Eras" />
            <Stat numero={stats.totalLibros} label="Libros" />
            <Stat numero="66" label="Total Biblia" />
          </dl>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#era-origen"
              className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
            >
              Empezar por el principio
              <ArrowRight className="size-4" aria-hidden />
            </a>
            <a
              href="#era-jesus"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-stone-700 ring-1 ring-stone-200 shadow-sm transition hover:bg-stone-50"
            >
              ✝️ Saltar a Jesús
            </a>
          </div>
        </div>
      </section>

      {/* ───────── Sticky era navigator ───────── */}
      <nav
        aria-label="Navegación de eras"
        className="sticky top-16 z-30 border-y border-stone-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:top-0"
      >
        <div className="mx-auto max-w-5xl overflow-x-auto px-4 py-3">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <ChipNav href="#top" emoji="✦" nombre="Inicio" />
            {ERAS.map((e) => (
              <ChipNav
                key={e.slug}
                href={`#era-${e.slug}`}
                emoji={e.emoji}
                nombre={e.nombre}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* ───────── Eras ───────── */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        {ERAS.map((era, i) => (
          <EraSection key={era.slug} era={era} esPrimera={i === 0} />
        ))}

        {/* ───────── CTA final ───────── */}
        <section className="mt-16 overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-8 text-center sm:p-12">
          <Sparkles
            className="mx-auto mb-4 size-6 text-amber-300"
            aria-hidden
          />
          <h2 className="font-serif text-2xl text-white sm:text-3xl">
            La historia sigue siendo tuya
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-300">
            Esta línea de tiempo termina en el siglo I — pero la historia no.
            Cada lector entra en ella. ¿Querés empezar a leer?
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/leer"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition hover:bg-amber-300"
            >
              <BookOpen className="size-4" aria-hidden />
              Empezar a leer
            </Link>
            <Link
              href="/planes"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur ring-1 ring-white/20 transition hover:bg-white/20"
            >
              Plan de lectura
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

// ────────── Subcomponentes ──────────

function Stat({ numero, label }: { numero: number | string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/60 px-3 py-4 ring-1 ring-stone-200/70 backdrop-blur">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-3xl text-stone-900">{numero}</dd>
    </div>
  );
}

function ChipNav({
  href,
  emoji,
  nombre,
}: {
  href: string;
  emoji: string;
  nombre: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-900 hover:text-white"
    >
      <span>{emoji}</span>
      <span>{nombre}</span>
    </a>
  );
}

function EraSection({ era, esPrimera }: { era: Era; esPrimera: boolean }) {
  const hitos = HITOS.filter((h) => h.era === era.slug);

  return (
    <section id={`era-${era.slug}`} className={esPrimera ? "" : "mt-20 scroll-mt-24"}>
      {/* Header de era — banner cinemático */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${era.cls.gradient} p-6 ring-1 ${era.cls.ring} sm:p-10`}
      >
        <div
          aria-hidden
          className="absolute -right-12 -top-12 text-[200px] opacity-10 select-none"
        >
          {era.emoji}
        </div>
        <div className="relative">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl">{era.emoji}</span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${era.cls.text}`}
            >
              {era.rangoAprox}
            </span>
          </div>
          <h2 className="mt-2 font-serif text-3xl text-stone-900 sm:text-4xl">
            {era.nombre}
          </h2>
          <p className={`mt-1 font-serif text-base italic ${era.cls.text}`}>
            {era.subtitulo}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-700 sm:text-base">
            {era.resumen}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {/* Personajes */}
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-white/40 backdrop-blur">
              <div className="flex items-center gap-1.5">
                <Users className={`size-3.5 ${era.cls.text}`} aria-hidden />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-600">
                  Personajes
                </p>
              </div>
              <p className="mt-1.5 text-sm text-stone-700">
                {era.personajes.join(" · ")}
              </p>
            </div>
            {/* Cristo */}
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-white/40 backdrop-blur">
              <div className="flex items-center gap-1.5">
                <span className="text-sm" aria-hidden>✦</span>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-600">
                  Cristo en esta era
                </p>
              </div>
              <p className="mt-1.5 text-sm italic leading-relaxed text-stone-700">
                {era.temaCristo}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hitos verticales */}
      <ol className="relative mt-8 space-y-5 pl-6 sm:pl-8">
        {/* Línea vertical decorativa */}
        <div
          aria-hidden
          className={`absolute left-2 top-2 bottom-2 w-px ${era.cls.accent} opacity-30`}
        />

        {hitos.map((h) => (
          <HitoCard key={h.slug} hito={h} era={era} />
        ))}
      </ol>

      {/* Libros del período sugeridos */}
      <LibrosDelPeriodo era={era} hitos={hitos} />
    </section>
  );
}

function HitoCard({ hito, era }: { hito: Hito; era: Era }) {
  const tipoInfo = hito.tipo ? TIPO_HITO[hito.tipo] : null;

  return (
    <li className="relative">
      {/* Marker en la línea */}
      <span
        className={`absolute -left-[1.55rem] top-4 z-10 inline-flex size-3 items-center justify-center rounded-full ring-4 ring-white ${era.cls.accent} sm:-left-[1.95rem]`}
        aria-hidden
      />

      <article
        className={`rounded-2xl border ${era.cls.border} bg-white p-5 shadow-sm transition hover:shadow-md`}
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl shrink-0 leading-none">{hito.emoji}</span>
          <div className="min-w-0 flex-1">
            {/* Línea superior: año + tipo */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${era.cls.text}`}
              >
                {hito.anio}
              </span>
              {tipoInfo && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tipoInfo.cls}`}
                >
                  {tipoInfo.label}
                </span>
              )}
            </div>

            {/* Título */}
            <h3 className="mt-1 font-serif text-xl text-stone-900">
              {hito.titulo}
            </h3>

            {/* Descripción */}
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              {hito.descripcion}
            </p>

            {/* Significado destacado */}
            {hito.significado && (
              <blockquote
                className={`mt-3 border-l-2 ${era.cls.border} pl-3 font-serif text-sm italic text-stone-600`}
              >
                {hito.significado}
              </blockquote>
            )}

            {/* Versos clave */}
            {hito.versosClaves.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  Lecturas clave
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {hito.versosClaves.map((v, i) => (
                    <Link
                      key={i}
                      href={`/leer/${v.libro}/${v.capInicio}`}
                      className="group inline-flex items-center gap-1 rounded-full bg-stone-50 px-2.5 py-1 text-xs text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-900 hover:text-white hover:ring-stone-900"
                    >
                      <BookOpen className="size-3" aria-hidden />
                      {v.ref}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}

function LibrosDelPeriodo({ era, hitos }: { era: Era; hitos: Hito[] }) {
  const codigos = new Set<string>();
  for (const h of hitos) for (const c of h.librosDelPeriodo) codigos.add(c);
  if (codigos.size === 0) return null;

  const libros = Array.from(codigos)
    .map((c) => LIBROS_POR_CODIGO.get(c))
    .filter((l): l is NonNullable<typeof l> => !!l);

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-stone-300 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        Para leer en esta era
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {libros.map((l) => (
          <Link
            key={l.codigo}
            href={`/leer/${l.codigo}`}
            className={`inline-flex items-center gap-1 rounded-full ${era.cls.bg} px-2.5 py-1 text-xs text-stone-700 ring-1 ${era.cls.ring} transition hover:bg-white hover:shadow-sm`}
          >
            {l.nombre}
          </Link>
        ))}
      </div>
    </div>
  );
}

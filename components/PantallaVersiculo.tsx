import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BotonCompartir } from "@/components/BotonCompartir";
import { BotonGuardar } from "@/components/BotonGuardar";
import { BotonComparar } from "@/components/BotonComparar";
import { NotaEntrada } from "@/components/NotaEntrada";
import { tintFondo, tintAccent } from "@/lib/colores";

interface Props {
  versiculoId: string;
  texto: string;
  capitulo: number;
  versiculo: number;
  libro: { codigo: string; nombre: string; nombreCorto: string };
  estado: { slug: string; nombre: string; emoji: string | null; colorHex: string | null };
  fraseAliento: string;
  versionCodigo: string;
  versionNombre: string;
  copyright?: string;
  fallbackVersion?: boolean;
  autenticado: boolean;
  guardadoInicial: boolean;
  entradaId: string | null;
  notaInicial: string;
  vistaPrevia?: boolean;
  area?: { nombre: string; emoji: string } | null;
  temaSlug?: string;
}

export function PantallaVersiculo({
  versiculoId,
  texto,
  capitulo,
  versiculo,
  libro,
  estado,
  fraseAliento,
  versionCodigo,
  versionNombre,
  copyright,
  fallbackVersion = false,
  autenticado,
  guardadoInicial,
  entradaId,
  notaInicial,
  vistaPrevia = false,
  area = null,
  temaSlug,
}: Props) {
  const referencia = `${libro.nombre} ${capitulo}:${versiculo}`;
  const bg = tintFondo(estado.colorHex);
  const accent = tintAccent(estado.colorHex, 0.5);

  return (
    <div
      style={{ backgroundColor: bg }}
      className="relative flex flex-1 flex-col items-center justify-center px-5 py-10 sm:py-16 transition-colors"
    >
      {/* Back prominente arriba a la izquierda (mobile y desktop) */}
      <Link
        href="/"
        aria-label="Volver al inicio"
        className="absolute left-3 top-3 sm:left-6 sm:top-6 z-10 inline-flex items-center gap-1 rounded-full bg-white/70 backdrop-blur px-3 py-1.5 text-sm text-stone-700 border border-stone-200/70 shadow-sm hover:bg-white hover:text-stone-900 transition"
      >
        <ChevronLeft className="size-4" aria-hidden />
        <span>Inicio</span>
      </Link>

      <article className="w-full max-w-xl flex flex-col items-center text-center">
        {vistaPrevia && (
          <div className="mb-6 w-full max-w-md rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-left text-sm text-amber-900">
            <p className="font-medium">Ya hiciste tu entrada de hoy.</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Esto es una vista previa — el versículo está bien, pero no lo
              guardamos en tu diario. <Link href="/premium" className="underline font-medium">Pasá a Premium</Link> para
              registrar todas las entradas que quieras en un mismo día.
            </p>
          </div>
        )}

        {/* Cabecera: emoji + estado */}
        <header className="flex flex-col items-center gap-3">
          {estado.emoji && (
            <span
              aria-hidden="true"
              className="text-4xl sm:text-5xl"
              style={{
                textShadow: estado.colorHex ? `0 0 24px ${tintAccent(estado.colorHex, 0.25)}` : undefined,
              }}
            >
              {estado.emoji}
            </span>
          )}
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            {estado.nombre}
            {area && (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                <span>{area.emoji} {area.nombre}</span>
              </>
            )}
          </p>
          <p className="mt-1 max-w-sm text-sm sm:text-base text-neutral-600 italic">
            {fraseAliento}
          </p>
        </header>

        {/* Separador */}
        <div
          className="my-8 h-px w-16"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        />

        {/* Versiculo */}
        <p
          className="font-serif text-balance text-2xl sm:text-3xl leading-relaxed text-neutral-800"
          style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
        >
          {limpiarTexto(texto)}
        </p>

        <p className="mt-6 text-sm font-medium text-neutral-700">{referencia}</p>
        <p className="text-xs text-neutral-500">{versionNombre}</p>
        {copyright && (
          <p className="mt-1 max-w-sm text-[10px] uppercase tracking-wider text-neutral-400">
            {copyright}
          </p>
        )}
        {fallbackVersion && (
          <p className="mt-2 max-w-sm text-xs text-amber-700">
            No se pudo cargar tu versión preferida. Mostrando Reina-Valera 1909.
          </p>
        )}

        {/* Separador */}
        <div
          className="my-8 h-px w-16"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        />

        {/* Acciones */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <BotonGuardar
            versiculoId={versiculoId}
            autenticado={autenticado}
            guardadoInicial={guardadoInicial}
          />
          <BotonCompartir
            texto={limpiarTexto(texto)}
            referencia={referencia}
            versionCodigo={versionCodigo}
            versionNombre={versionNombre}
            temaSlug={temaSlug}
          />
          <BotonComparar
            libroCodigo={libro.codigo}
            libroNombre={libro.nombre}
            capitulo={capitulo}
            versiculo={versiculo}
            versionActualCodigo={versionCodigo}
          />
        </div>

        {/* Nota del diario (solo si tenemos entrada) */}
        {entradaId && (
          <>
            <div
              className="my-8 h-px w-16"
              style={{ backgroundColor: accent }}
              aria-hidden="true"
            />
            <NotaEntrada
              entradaId={entradaId}
              notaInicial={notaInicial}
              colorAccento={estado.colorHex}
            />
          </>
        )}

        {/* Navegacion: doble call-to-action */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full bg-white/70 px-4 py-2 text-stone-700 border border-stone-200 hover:bg-white hover:text-stone-900 transition"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            <span>Otro estado</span>
          </Link>
          <Link
            href="/leer"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-stone-600 hover:bg-white/60 hover:text-stone-900 transition"
          >
            <span>Leer la Biblia →</span>
          </Link>
        </div>
      </article>
    </div>
  );
}

/** Quita comillas/espacios extra que vienen del JSON fuente. */
function limpiarTexto(t: string): string {
  return t.trim().replace(/\s+/g, " ");
}

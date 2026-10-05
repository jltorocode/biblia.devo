"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { crearEntradaLecturaAction } from "@/actions/devocional";
import { VersoSubrayable, limpiarVersoTexto } from "@/components/VersoSubrayable";
import type { ColorSubrayado } from "@/lib/subrayados";

interface VersoProps {
  id: string;
  versiculo: number;
  texto: string;
  colorInicial: ColorSubrayado | null;
}

interface Props {
  libroNombre: string;
  libroCodigo: string;
  capitulo: number;
  /** Subtítulo descriptivo del capítulo (adición editorial). */
  tituloCapitulo: string | null;
  versiculos: VersoProps[];
  capAnterior: number | null;
  capSiguiente: number | null;
  autenticado: boolean;
  esPremium: boolean;
  versionNombre: string;
  fallbackVersion?: boolean;
}

export function LectorCapitulo({
  libroNombre,
  libroCodigo,
  capitulo,
  tituloCapitulo,
  versiculos,
  capAnterior,
  capSiguiente,
  autenticado,
  esPremium,
  versionNombre,
  fallbackVersion = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nota, setNota] = useState("");
  const [estado, setEstado] = useState<
    { tipo: "idle" } | { tipo: "ok"; vistaPrevia: boolean } | { tipo: "error"; mensaje: string }
  >({ tipo: "idle" });

  function guardar() {
    setEstado({ tipo: "idle" });
    startTransition(async () => {
      const r = await crearEntradaLecturaAction({ libroCodigo, capitulo, nota });
      if (!r.ok) {
        setEstado({ tipo: "error", mensaje: r.error });
        return;
      }
      setEstado({ tipo: "ok", vistaPrevia: r.vistaPrevia });
      if (!r.vistaPrevia) {
        // Refrescamos para que el header/menu se actualice (entrada en diario).
        router.refresh();
      }
    });
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <header className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          <Link href="/leer" className="hover:underline">
            Biblia
          </Link>
          <span className="mx-1.5 opacity-50">·</span>
          <Link href={`/leer/${libroCodigo}`} className="hover:underline">
            {libroNombre}
          </Link>
        </p>
        <h1 className="mt-2 font-serif text-3xl text-stone-800">
          {libroNombre} {capitulo}
        </h1>
        {tituloCapitulo && (
          <p className="mt-1.5 font-serif text-base italic text-stone-600">
            {tituloCapitulo}
          </p>
        )}
        <p className="mt-1 text-xs text-stone-500">{versionNombre}</p>
        {fallbackVersion && (
          <p className="mt-2 text-xs text-amber-700">
            No se pudo cargar tu versión preferida. Mostrando Reina-Valera 1909.
          </p>
        )}
      </header>

      {/* Texto del capítulo. Cada verso es clickable → subrayado. */}
      <article
        className="rounded-2xl border border-stone-200 bg-white/70 px-6 py-8 shadow-sm"
        style={{ fontFamily: "var(--devo-font-serif)" }}
      >
        {autenticado && (
          <p className="mb-4 text-xs text-stone-400">
            Tocá un versículo para subrayarlo.
          </p>
        )}
        <p className="leading-relaxed text-neutral-800">
          {versiculos.map((v) => (
            <VersoSubrayable
              key={v.id}
              versiculoId={v.id}
              numero={v.versiculo}
              texto={limpiarVersoTexto(v.texto)}
              colorInicial={v.colorInicial}
              esPremium={esPremium}
              autenticado={autenticado}
            />
          ))}
        </p>
      </article>

      {/* Nav anterior/siguiente */}
      <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
        {capAnterior ? (
          <Link
            href={`/leer/${libroCodigo}/${capAnterior}`}
            className="inline-flex items-center gap-1 hover:text-stone-700"
          >
            <ChevronLeft className="size-4" />
            Cap. {capAnterior}
          </Link>
        ) : (
          <span />
        )}
        {capSiguiente ? (
          <Link
            href={`/leer/${libroCodigo}/${capSiguiente}`}
            className="inline-flex items-center gap-1 hover:text-stone-700"
          >
            Cap. {capSiguiente}
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Nota + guardar lectura */}
      <section className="mt-10">
        <label htmlFor="nota" className="text-xs uppercase tracking-[0.18em] text-stone-500">
          Tu reflexión
        </label>
        <textarea
          id="nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Lo que Dios te dijo en esta lectura…"
          rows={4}
          maxLength={4000}
          className="mt-2 w-full resize-y rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
          <span>{nota.length}/4000</span>
          <button
            type="button"
            onClick={guardar}
            disabled={pending}
            className="rounded-full bg-stone-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-stone-900 disabled:opacity-60 disabled:cursor-wait"
          >
            {pending ? "Guardando…" : "Guardar mi lectura"}
          </button>
        </div>

        {estado.tipo === "ok" && !estado.vistaPrevia && (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            ✓ Guardado en tu diario. <Link href="/historial" className="underline">Verlo</Link>
          </p>
        )}
        {estado.tipo === "ok" && estado.vistaPrevia && (
          <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="font-medium">Ya hiciste tu entrada de hoy.</p>
            <p className="mt-1 text-xs leading-relaxed">
              Tu lectura es válida — pero como sos free, solo guardamos una entrada
              por día.{" "}
              <Link href="/premium" className="underline font-medium">
                Pasá a Premium
              </Link>{" "}
              para registrar todas las lecturas que quieras.
            </p>
          </div>
        )}
        {estado.tipo === "error" && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {estado.mensaje}
          </p>
        )}
      </section>
    </main>
  );
}


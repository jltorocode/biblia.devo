"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { iniciarDevocionalAction } from "@/actions/devocional";
import { ESTADOS, ESTADOS_POR_SLUG, type EstadoInfo } from "@/lib/estados";
import { AREAS } from "@/lib/areas";
import { tintFondo, tintAccent } from "@/lib/colores";

const ORDEN_GRUPOS: EstadoInfo["categoria"][] = ["dificil", "neutral", "positivo"];

function agruparPorCategoria(): Record<EstadoInfo["categoria"], EstadoInfo[]> {
  const out = { dificil: [] as EstadoInfo[], neutral: [] as EstadoInfo[], positivo: [] as EstadoInfo[] };
  for (const e of ESTADOS) out[e.categoria].push(e);
  return out;
}

type Etapa = "estado" | "area";

export function SelectorEstado() {
  const [pending, startTransition] = useTransition();
  const [etapa, setEtapa] = useState<Etapa>("estado");
  const [estadoElegido, setEstadoElegido] = useState<string | null>(null);
  const [areaEnCurso, setAreaEnCurso] = useState<string | null>(null);

  const grupos = agruparPorCategoria();
  const infoEstado = estadoElegido ? ESTADOS_POR_SLUG.get(estadoElegido) : null;

  function elegirEstado(slug: string) {
    setEstadoElegido(slug);
    setEtapa("area");
  }

  function elegirArea(area: string | null) {
    setAreaEnCurso(area ?? "__saltar");
    startTransition(() => {
      iniciarDevocionalAction(estadoElegido!, area);
    });
  }

  function volver() {
    setEtapa("estado");
    setEstadoElegido(null);
    setAreaEnCurso(null);
  }

  return (
    <div className="w-full max-w-2xl">
      <AnimatePresence mode="wait">
        {etapa === "estado" && (
          <motion.div
            key="estado"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <header className="mb-8 text-center">
              <h1 className="text-2xl sm:text-3xl font-medium text-neutral-800">
                ¿Cómo estás en este momento?
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Tocá lo que más se acerca a lo que sentís.
              </p>
            </header>

            <div className="space-y-6">
              {ORDEN_GRUPOS.map((cat) => (
                <section key={cat}>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {grupos[cat].map((estado) => (
                      <button
                        key={estado.slug}
                        onClick={() => elegirEstado(estado.slug)}
                        style={{
                          backgroundColor: tintFondo(estado.colorHex),
                          borderColor: tintAccent(estado.colorHex, 0.45),
                        }}
                        className={[
                          "group relative flex flex-col items-center justify-center gap-2",
                          "rounded-2xl border px-3 py-4 sm:py-5",
                          "text-center transition-all duration-150",
                          "hover:scale-[1.02] active:scale-[0.97]",
                          "shadow-sm hover:shadow",
                        ].join(" ")}
                      >
                        <span className="text-3xl sm:text-4xl select-none" aria-hidden="true">
                          {estado.emoji}
                        </span>
                        <span className="text-sm sm:text-[15px] font-medium leading-tight text-neutral-800">
                          {estado.nombre}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <p className="text-xs text-neutral-400">Sin registro. La Biblia, ahora.</p>
              <Link
                href="/leer"
                className="text-sm text-neutral-500 hover:text-neutral-700 underline-offset-4 hover:underline"
              >
                O leer la Biblia directamente →
              </Link>
            </div>
          </motion.div>
        )}

        {etapa === "area" && infoEstado && (
          <motion.div
            key="area"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <header className="mb-8 text-center">
              <div
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                style={{ backgroundColor: tintFondo(infoEstado.colorHex) }}
                aria-hidden="true"
              >
                {infoEstado.emoji}
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                {infoEstado.nombre}
              </p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-medium text-neutral-800">
                ¿Por qué?
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Si querés contarlo. Si no, podés saltar este paso.
              </p>
            </header>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AREAS.map((a) => {
                const cargando = areaEnCurso === a.slug && pending;
                return (
                  <button
                    key={a.slug}
                    onClick={() => elegirArea(a.slug)}
                    disabled={pending}
                    aria-busy={cargando || undefined}
                    className={[
                      "flex flex-col items-center justify-center gap-1.5",
                      "rounded-2xl border border-neutral-200 bg-white px-3 py-4",
                      "text-center transition-all duration-150",
                      "hover:scale-[1.02] hover:border-neutral-300 active:scale-[0.97]",
                      "shadow-sm hover:shadow",
                      "disabled:opacity-60 disabled:cursor-wait",
                    ].join(" ")}
                  >
                    <span className="text-2xl select-none" aria-hidden="true">
                      {a.emoji}
                    </span>
                    <span className="text-sm font-medium leading-tight text-neutral-800">
                      {a.nombre}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={volver}
                disabled={pending}
                className="text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-60"
              >
                ← Otro estado
              </button>
              <button
                type="button"
                onClick={() => elegirArea(null)}
                disabled={pending}
                aria-busy={(areaEnCurso === "__saltar" && pending) || undefined}
                className="font-medium text-neutral-600 underline-offset-4 hover:underline disabled:opacity-60"
              >
                {areaEnCurso === "__saltar" && pending ? "abriendo…" : "Ir directo al versículo"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

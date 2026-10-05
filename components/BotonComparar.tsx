"use client";

import { useState, useTransition } from "react";
import { Layers, X, Cloud, AlertTriangle } from "lucide-react";
import { compararVersiculoAction, type VersoComparado } from "@/actions/comparar";

interface Props {
  libroCodigo: string;
  libroNombre: string;
  capitulo: number;
  versiculo: number;
  versionActualCodigo: string;
}

export function BotonComparar({
  libroCodigo,
  libroNombre,
  capitulo,
  versiculo,
  versionActualCodigo,
}: Props) {
  const [open, setOpen] = useState(false);
  const [versos, setVersos] = useState<VersoComparado[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function abrir() {
    setOpen(true);
    if (versos || pending) return;
    setError(null);
    startTransition(async () => {
      const r = await compararVersiculoAction({ libroCodigo, capitulo, versiculo });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setVersos(r.versos);
    });
  }

  const referencia = `${libroNombre} ${capitulo}:${versiculo}`;

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-white hover:text-stone-900"
        title="Comparar este versículo en otras versiones"
      >
        <Layers className="size-4" aria-hidden />
        <span>Comparar</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="comparador-titulo"
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
        >
          <div
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
            <header className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
              <div>
                <p id="comparador-titulo" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Comparar versiones
                </p>
                <h2 className="mt-0.5 font-serif text-xl text-stone-900">{referencia}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {pending && (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-xl bg-stone-100"
                    />
                  ))}
                </div>
              )}

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}

              {versos && (
                <ul className="space-y-3">
                  {versos.map((v) => {
                    const esActiva = v.versionCodigo === versionActualCodigo;
                    return (
                      <li
                        key={v.versionId}
                        className={`rounded-xl border p-4 transition ${
                          esActiva
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-stone-200 bg-stone-50/50"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-stone-800">
                            {v.versionNombre}
                            {esActiva && (
                              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-700">
                                Tuya
                              </span>
                            )}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-stone-400">
                            {v.fallback ? (
                              <>
                                <AlertTriangle className="size-3" /> fallback
                              </>
                            ) : v.versionCodigo === "rv1909" ? (
                              "local"
                            ) : (
                              <>
                                <Cloud className="size-3" /> {v.versionCodigo}
                              </>
                            )}
                          </span>
                        </div>
                        <p
                          className="text-base leading-relaxed text-stone-800"
                          style={{ fontFamily: "var(--devo-font-serif, var(--font-lora))" }}
                        >
                          {v.texto}
                        </p>
                        {v.copyright && (
                          <p className="mt-2 text-[10px] uppercase tracking-wider text-stone-400">
                            {v.copyright}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="border-t border-stone-100 bg-stone-50 px-5 py-3 text-xs text-stone-500">
              {versos
                ? `${versos.length} versión${versos.length === 1 ? "" : "es"} disponible${versos.length === 1 ? "" : "s"}`
                : "Cargando…"}
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

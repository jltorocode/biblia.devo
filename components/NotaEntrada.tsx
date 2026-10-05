"use client";

import { useEffect, useRef, useState } from "react";
import { guardarNotaEntradaAction } from "@/actions/devocional";

type Estado = "idle" | "guardando" | "guardado" | "error";

interface Props {
  entradaId: string;
  notaInicial: string;
  colorAccento?: string | null;
}

const DEBOUNCE_MS = 800;

export function NotaEntrada({ entradaId, notaInicial, colorAccento }: Props) {
  const [valor, setValor] = useState(notaInicial);
  const [estado, setEstado] = useState<Estado>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimoGuardado = useRef(notaInicial);

  useEffect(() => {
    if (valor === ultimoGuardado.current) {
      setEstado("idle");
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setEstado("guardando");
    timerRef.current = setTimeout(async () => {
      const r = await guardarNotaEntradaAction({ entradaId, nota: valor });
      if (r.ok) {
        ultimoGuardado.current = valor;
        setEstado("guardado");
        setTimeout(() => setEstado("idle"), 1500);
      } else {
        setEstado("error");
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [valor, entradaId]);

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="nota" className="text-xs uppercase tracking-[0.18em] text-neutral-500">
          Tu reflexión
        </label>
        <span
          aria-live="polite"
          className={`text-xs transition-opacity ${
            estado === "idle" ? "opacity-0" : "opacity-100"
          }`}
        >
          {estado === "guardando" && <span className="text-neutral-400">guardando…</span>}
          {estado === "guardado" && <span className="text-emerald-600">✓ guardado</span>}
          {estado === "error" && <span className="text-red-600">error</span>}
        </span>
      </div>
      <textarea
        id="nota"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Lo que Dios te dijo hoy, lo que estás sintiendo…"
        rows={4}
        maxLength={4000}
        className="w-full resize-y rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 transition"
        style={{
          // borde focus en el color del estado, sutil
          ...(colorAccento ? ({ "--tw-ring-color": colorAccento + "55" } as React.CSSProperties) : {}),
        }}
      />
      <p className="mt-1 text-xs text-neutral-400 text-right">
        {valor.length}/4000
      </p>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { guardarVersiculoAction, quitarGuardadoAction } from "@/actions/guardados";

interface Props {
  versiculoId: string;
  autenticado: boolean;
  guardadoInicial: boolean;
}

export function BotonGuardar({ versiculoId, autenticado, guardadoInicial }: Props) {
  const [pending, startTransition] = useTransition();
  const [guardado, setGuardado] = useState(guardadoInicial);
  const [hint, setHint] = useState<{ tipo: "auth" | "error"; texto: string } | null>(null);

  function toggle() {
    if (!autenticado) {
      setHint({ tipo: "auth", texto: "Creá una cuenta para guardar versículos." });
      setTimeout(() => setHint(null), 2800);
      return;
    }

    const previo = guardado;
    setGuardado(!previo);
    setHint(null);

    startTransition(async () => {
      const res = previo
        ? await quitarGuardadoAction(versiculoId)
        : await guardarVersiculoAction(versiculoId);

      if (!res.ok) {
        setGuardado(previo);
        setHint({ tipo: "error", texto: res.error });
        setTimeout(() => setHint(null), 3600);
      }
    });
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        disabled={pending}
        type="button"
        aria-pressed={guardado}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 active:scale-[0.97] disabled:cursor-wait"
      >
        <Heart
          className={`size-4 transition-colors ${
            guardado ? "fill-rose-500 stroke-rose-500" : ""
          }`}
          aria-hidden="true"
        />
        <span>{guardado ? "Guardado" : "Guardar"}</span>
      </button>
      {hint && (
        <div className="absolute left-1/2 top-full z-10 mt-2 w-max max-w-[18rem] -translate-x-1/2 rounded-md bg-neutral-900 px-3 py-1.5 text-center text-xs text-white shadow-md">
          {hint.tipo === "auth" ? (
            <>
              {hint.texto}{" "}
              <Link href="/signup" className="font-medium underline">
                Crear cuenta
              </Link>
            </>
          ) : (
            hint.texto
          )}
        </div>
      )}
    </div>
  );
}

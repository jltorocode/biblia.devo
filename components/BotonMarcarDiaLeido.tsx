"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, PartyPopper } from "lucide-react";
import { marcarDiaLeidoAction } from "@/actions/planes";

interface Props {
  planUsuarioId: string;
  dia: number;
  leidoInicial: boolean;
  notasInicial: string;
  siguienteDia: number | null;
}

export function BotonMarcarDiaLeido({
  planUsuarioId,
  dia,
  leidoInicial,
  notasInicial,
  siguienteDia,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leido, setLeido] = useState(leidoInicial);
  const [notas, setNotas] = useState(notasInicial);
  const [completado, setCompletado] = useState(false);

  function marcar() {
    startTransition(async () => {
      const r = await marcarDiaLeidoAction({ planUsuarioId, dia, notas });
      if (!r.ok) {
        alert(r.error);
        return;
      }
      setLeido(true);
      if (r.completado) {
        setCompletado(true);
        setTimeout(() => router.push("/planes/mio"), 2000);
      }
      router.refresh();
    });
  }

  if (completado) {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
        <PartyPopper className="mx-auto size-10 text-emerald-600" />
        <p className="mt-3 font-serif text-2xl text-emerald-900">¡Plan completado!</p>
        <p className="mt-1 text-sm text-emerald-800">
          Terminaste todo el plan. Volvé al catálogo a elegir otro.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <label htmlFor="notas-dia" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
        Tu reflexión (opcional)
      </label>
      <textarea
        id="notas-dia"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Lo que Dios te dijo hoy…"
        rows={3}
        maxLength={2000}
        className="mt-2 w-full resize-y rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
      />
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-stone-400">{notas.length}/2000</span>
        <button
          type="button"
          onClick={marcar}
          disabled={pending}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-60 disabled:cursor-wait ${
            leido
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              : "bg-stone-900 text-white hover:bg-stone-800"
          }`}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          {leido ? "Releído · Actualizar nota" : "Marcar como leído"}
        </button>
      </div>
      {leido && siguienteDia && (
        <p className="mt-3 text-center text-xs text-stone-500">
          <a href={`/planes/mio/${siguienteDia}`} className="underline hover:text-stone-700">
            Continuar al día {siguienteDia} →
          </a>
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cambiarVersionPrefAction } from "@/actions/version";

interface VersionOption {
  id: number;
  codigo: string;
  nombre: string;
  esApi: boolean;
}

interface Props {
  versiones: VersionOption[];
  preferidaId: number | null;
}

export function SelectorVersion({ versiones, preferidaId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [seleccionada, setSeleccionada] = useState<number | null>(preferidaId);
  const [estado, setEstado] = useState<"idle" | "ok" | "error">("idle");

  function elegir(idStr: string) {
    const id = idStr === "" ? null : Number(idStr);
    setSeleccionada(id);
    setEstado("idle");
    startTransition(async () => {
      const r = await cambiarVersionPrefAction(id);
      if (r.ok) {
        setEstado("ok");
        router.refresh();
        setTimeout(() => setEstado("idle"), 1500);
      } else {
        setEstado("error");
      }
    });
  }

  return (
    <div className="space-y-3">
      <select
        value={seleccionada ?? ""}
        onChange={(e) => elegir(e.target.value)}
        disabled={pending}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:opacity-60"
      >
        <option value="">Reina-Valera 1909 (local, dominio público)</option>
        {versiones
          .filter((v) => v.codigo !== "rv1909")
          .map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre} {v.esApi ? "· api.bible" : ""}
            </option>
          ))}
      </select>

      <p className="text-xs text-stone-500 leading-relaxed">
        La <strong>búsqueda</strong> de versículos siempre usa Reina-Valera 1909 (donde están los embeddings).
        La <strong>versión que ves</strong> se ajusta a tu preferencia — los versículos se traducen
        en tiempo real desde scripture.api.bible.
      </p>

      {estado === "ok" && (
        <p className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
          ✓ Versión cambiada.
        </p>
      )}
      {estado === "error" && (
        <p className="rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700">
          No se pudo guardar la preferencia.
        </p>
      )}
    </div>
  );
}

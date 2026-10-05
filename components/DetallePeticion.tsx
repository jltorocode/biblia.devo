"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Archive, Trash2, RotateCcw, Loader2 } from "lucide-react";
import {
  marcarRespondidaAction,
  archivarPeticionAction,
  eliminarPeticionAction,
  reactivarPeticionAction,
} from "@/actions/peticiones";
import type { PeticionDTO } from "@/lib/peticiones";

export function DetallePeticion({ peticion }: { peticion: PeticionDTO }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [respondiendo, setRespondiendo] = useState(false);
  const [respuesta, setRespuesta] = useState("");

  function marcarRespondida() {
    if (!confirm("¿Marcar esta petición como respondida?")) return;
    startTransition(async () => {
      await marcarRespondidaAction(peticion.id, respuesta || undefined);
      setRespondiendo(false);
      router.refresh();
    });
  }

  function archivar() {
    if (!confirm("¿Archivar esta petición?")) return;
    startTransition(async () => {
      await archivarPeticionAction(peticion.id);
      router.push("/oracion");
      router.refresh();
    });
  }

  function eliminar() {
    if (!confirm("Esto borra la petición permanentemente. ¿Seguro?")) return;
    startTransition(async () => {
      await eliminarPeticionAction(peticion.id);
      router.push("/oracion");
      router.refresh();
    });
  }

  function reactivar() {
    startTransition(async () => {
      await reactivarPeticionAction(peticion.id);
      router.refresh();
    });
  }

  return (
    <section className="mt-6">
      {peticion.estado === "pendiente" && (
        <>
          {!respondiendo ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setRespondiendo(true)}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <CheckCircle2 className="size-4" />
                Marcar respondida
              </button>
              <button
                type="button"
                onClick={archivar}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
              >
                <Archive className="size-4" />
                Archivar
              </button>
              <button
                type="button"
                onClick={eliminar}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="size-3.5" />
                Borrar
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                ¿Cómo respondió Dios?
              </p>
              <textarea
                autoFocus
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Contale a tu yo del futuro qué pasó…"
                rows={3}
                className="mt-2 w-full resize-y rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRespondiendo(false)}
                  className="rounded-full px-3 py-1.5 text-sm text-stone-600 hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={marcarRespondida}
                  disabled={pending}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                  Guardar respuesta
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {(peticion.estado === "respondida" || peticion.estado === "archivada") && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reactivar}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
          >
            <RotateCcw className="size-4" />
            Volver a pendiente
          </button>
          <button
            type="button"
            onClick={eliminar}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="size-3.5" />
            Borrar
          </button>
        </div>
      )}
    </section>
  );
}

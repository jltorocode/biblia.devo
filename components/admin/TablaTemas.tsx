"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { crearTema, renombrarTema, borrarTema } from "@/actions/admin";

interface TemaRow {
  id: number;
  slug: string;
  nombre: string;
  conteo: number;
}

export function TablaTemas({ temas }: { temas: TemaRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editando, setEditando] = useState<number | null>(null);
  const [valor, setValor] = useState("");
  const [nuevoSlug, setNuevoSlug] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [error, setError] = useState<string | null>(null);

  function comenzarEdicion(t: TemaRow) {
    setEditando(t.id);
    setValor(t.nombre);
    setError(null);
  }

  function guardarEdicion(t: TemaRow) {
    if (!valor.trim() || valor === t.nombre) {
      setEditando(null);
      return;
    }
    startTransition(async () => {
      const r = await renombrarTema(t.id, valor);
      if (!r.ok) setError(r.error);
      else {
        setEditando(null);
        router.refresh();
      }
    });
  }

  function eliminar(t: TemaRow) {
    if (
      !confirm(
        `Borrar tema "${t.nombre}"? Esto desclasifica ${t.conteo} versículos de este tema.`,
      )
    )
      return;
    startTransition(async () => {
      await borrarTema(t.id);
      router.refresh();
    });
  }

  function agregar() {
    setError(null);
    if (!nuevoSlug.trim() || !nuevoNombre.trim()) {
      setError("Slug y nombre requeridos");
      return;
    }
    startTransition(async () => {
      const r = await crearTema(nuevoSlug, nuevoNombre);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setNuevoSlug("");
      setNuevoNombre("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Form alta */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          Nuevo tema
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={nuevoSlug}
            onChange={(e) => setNuevoSlug(e.target.value)}
            placeholder="slug (ej: fe-pequena)"
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder='Nombre (ej: "Fe pequeña")'
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={agregar}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-900 disabled:opacity-60"
          >
            <Plus className="size-4" /> Agregar
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 text-left">Tema</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-right">Versículos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {temas.map((t) => (
              <tr key={t.id} className="border-t border-stone-100">
                <td className="px-4 py-3">
                  {editando === t.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        autoFocus
                        className="flex-1 rounded-md border border-stone-300 px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => guardarEdicion(t)}
                        disabled={pending}
                        className="rounded-md bg-emerald-100 p-1.5 text-emerald-700 hover:bg-emerald-200"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditando(null)}
                        className="rounded-md bg-stone-100 p-1.5 text-stone-600 hover:bg-stone-200"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-medium text-stone-900">{t.nombre}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">{t.slug}</td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-600">{t.conteo}</td>
                <td className="px-4 py-3 text-right">
                  {editando !== t.id && (
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => comenzarEdicion(t)}
                        className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(t)}
                        disabled={pending}
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {temas.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-stone-500">
            No hay temas todavía.
          </p>
        )}
      </div>
    </div>
  );
}

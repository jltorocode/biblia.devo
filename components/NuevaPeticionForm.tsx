"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { crearPeticionAction } from "@/actions/peticiones";
import { CATEGORIAS, type CategoriaPeticion } from "@/lib/peticiones";

export function NuevaPeticionForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<CategoriaPeticion>("otro");
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    setError(null);
    if (!titulo.trim()) {
      setError("Escribí algo en el título");
      return;
    }
    startTransition(async () => {
      const r = await crearPeticionAction({ titulo, descripcion, categoria });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setTitulo("");
      setDescripcion("");
      setCategoria("otro");
      setAbierto(false);
      router.refresh();
    });
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-white py-4 text-sm font-medium text-stone-600 transition hover:border-stone-400 hover:bg-stone-50 hover:text-stone-900"
      >
        <Plus className="size-4" /> Nueva petición
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-300 bg-white p-4 shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
        Nueva petición
      </p>
      <input
        type="text"
        autoFocus
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Por mi mamá enferma…"
        maxLength={160}
        className="mt-3 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
      />
      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Detalles (opcional)"
        rows={2}
        maxLength={1000}
        className="mt-2 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
      />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {CATEGORIAS.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCategoria(c.slug)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
              categoria === c.slug
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <span>{c.emoji}</span>
            <span>{c.nombre}</span>
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setError(null);
          }}
          className="rounded-full px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Guardar
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cambiarTemaAction } from "@/actions/tema";
import { TEMAS, type Tema } from "@/lib/temas";

interface Props {
  temaActivo: string;
}

export function SelectorTema({ temaActivo }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [seleccionado, setSeleccionado] = useState(temaActivo);

  function elegir(slug: string) {
    if (slug === seleccionado) return;
    setSeleccionado(slug);
    startTransition(async () => {
      const r = await cambiarTemaAction(slug);
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TEMAS.map((t) => (
        <TarjetaTema
          key={t.slug}
          tema={t}
          activo={seleccionado === t.slug}
          deshabilitado={pending}
          onElegir={() => elegir(t.slug)}
        />
      ))}
    </div>
  );
}

function TarjetaTema({
  tema,
  activo,
  deshabilitado,
  onElegir,
}: {
  tema: Tema;
  activo: boolean;
  deshabilitado: boolean;
  onElegir: () => void;
}) {
  const fontVar =
    tema.font === "lora"
      ? "var(--font-lora)"
      : tema.font === "garamond"
        ? "var(--font-eb-garamond)"
        : "var(--font-cardo)";

  return (
    <button
      type="button"
      onClick={onElegir}
      disabled={deshabilitado}
      aria-pressed={activo}
      className={`group relative overflow-hidden rounded-2xl border-2 text-left transition-all ${
        activo
          ? "border-stone-700 shadow-md ring-2 ring-stone-300"
          : "border-stone-200 hover:border-stone-400 hover:shadow"
      } ${deshabilitado ? "cursor-wait opacity-60" : ""}`}
      style={{ backgroundColor: tema.bg }}
    >
      {/* Preview visual */}
      <div className="p-5 pb-4" style={{ backgroundColor: tema.bg }}>
        <div className="flex items-center gap-2 mb-3">
          <span
            aria-hidden
            className="size-3 rounded-full"
            style={{ backgroundColor: tema.accent }}
          />
          <span
            aria-hidden
            className="size-3 rounded-full"
            style={{ backgroundColor: tema.ornament }}
          />
          <span
            aria-hidden
            className="size-3 rounded-full"
            style={{ backgroundColor: tema.accentSoft }}
          />
        </div>

        <div
          className="rounded-lg px-4 py-3"
          style={{ backgroundColor: tema.bgCard }}
        >
          <p
            className="text-lg leading-tight"
            style={{
              fontFamily: `${fontVar}, Georgia, serif`,
              color: tema.text,
            }}
          >
            «En el principio era el Verbo.»
          </p>
          <p className="mt-1 text-xs" style={{ color: tema.textMuted }}>
            — Juan 1:1
          </p>
        </div>
      </div>

      {/* Etiqueta inferior */}
      <div
        className="px-5 py-3 border-t"
        style={{
          backgroundColor: tema.bgCard,
          borderColor: tema.accentSoft,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p
              className="font-medium truncate"
              style={{ color: tema.text }}
            >
              {tema.nombre}
            </p>
            <p
              className="text-xs leading-tight"
              style={{ color: tema.textMuted }}
            >
              {tema.descripcion}
            </p>
          </div>
          {activo && (
            <span
              aria-hidden
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: tema.accent, color: tema.bgCard }}
            >
              activo
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

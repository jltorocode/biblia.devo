"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface Props {
  fecha: string; // YYYY-MM-DD
}

export function BotonCompartirDiario({ fecha }: Props) {
  const [estado, setEstado] = useState<"idle" | "copiando" | "copiado">("idle");

  async function compartir() {
    const url = `${window.location.origin}/api/og/diario/${fecha}`;
    setEstado("copiando");

    // 1) Si esta disponible Web Share con archivos, fetch + share.
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch fallo");
      const blob = await res.blob();
      const file = new File([blob], `devocional-${fecha}.png`, { type: "image/png" });

      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({
          title: "Mi día en Devocional",
          files: [file],
        });
        setEstado("idle");
        return;
      }

      // 2) Sin Web Share: forzar descarga + copiar URL al portapapeles.
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `devocional-${fecha}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      setEstado("copiado");
      setTimeout(() => setEstado("idle"), 1500);
    } catch (err) {
      console.error("[compartir-diario]", err);
      setEstado("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={compartir}
      disabled={estado === "copiando"}
      className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm text-stone-700 transition hover:border-stone-400 hover:bg-white disabled:opacity-60"
    >
      {estado === "copiado" ? (
        <>
          <Check className="size-4" /> Descargado
        </>
      ) : (
        <>
          <Share2 className="size-4" />
          {estado === "copiando" ? "Generando…" : "Compartir como imagen"}
        </>
      )}
    </button>
  );
}

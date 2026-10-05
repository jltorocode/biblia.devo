"use client";

import { useEffect, useRef, useState } from "react";
import { Share2, Check, Image as ImageIcon, MessageSquareText, ChevronDown, Loader2 } from "lucide-react";

interface Props {
  texto: string;
  referencia: string;
  versionCodigo: string;
  /** Nombre humano de la versión para mostrar en la imagen ("Reina-Valera 1909"). */
  versionNombre?: string;
  /** Slug del tema activo, para pintar la imagen acorde. */
  temaSlug?: string;
}

export function BotonCompartir({
  texto,
  referencia,
  versionCodigo,
  versionNombre,
  temaSlug,
}: Props) {
  const [open, setOpen] = useState(false);
  const [estado, setEstado] = useState<"idle" | "copiado" | "generando">("idle");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function compartirTexto() {
    setOpen(false);
    const cuerpo = `"${texto}"\n— ${referencia} (${versionCodigo.toUpperCase()})`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: referencia, text: cuerpo });
        return;
      } catch {
        // cancelado → copiamos
      }
    }
    try {
      await navigator.clipboard.writeText(cuerpo);
      setEstado("copiado");
      setTimeout(() => setEstado("idle"), 2000);
    } catch {}
  }

  async function compartirImagen() {
    setOpen(false);
    setEstado("generando");
    try {
      const url = `/api/og/versiculo?texto=${encodeURIComponent(texto)}&ref=${encodeURIComponent(referencia)}&version=${encodeURIComponent(versionNombre ?? versionCodigo.toUpperCase())}&tema=${encodeURIComponent(temaSlug ?? "pergamino")}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo generar la imagen");
      const blob = await res.blob();

      const safeName = referencia.replace(/[^\w]+/g, "-").toLowerCase();
      const file = new File([blob], `${safeName}.png`, { type: "image/png" });

      // Mobile: Web Share API con files
      const canShareFiles =
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });
      if (canShareFiles && typeof navigator.share === "function") {
        try {
          await navigator.share({ files: [file], title: referencia });
          setEstado("idle");
          return;
        } catch {
          // cancelado → caemos a descarga
        }
      }

      // Desktop: descarga
      const urlBlob = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(urlBlob);
      setEstado("idle");
    } catch (err) {
      console.error("[BotonCompartir] imagen:", err);
      setEstado("idle");
    }
  }

  if (estado === "copiado") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-700">
        <Check className="size-4" aria-hidden /> Texto copiado
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={estado === "generando"}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 active:scale-[0.97] disabled:opacity-60"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {estado === "generando" ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span>Generando…</span>
          </>
        ) : (
          <>
            <Share2 className="size-4" aria-hidden />
            <span>Compartir</span>
            <ChevronDown className="size-3 opacity-60" aria-hidden />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-stone-200"
        >
          <button
            type="button"
            role="menuitem"
            onClick={compartirImagen}
            className="flex w-56 items-center gap-3 px-4 py-3 text-left text-sm text-stone-800 transition hover:bg-stone-50"
          >
            <ImageIcon className="size-4 text-stone-500" aria-hidden />
            <div>
              <p className="font-medium">Como imagen</p>
              <p className="text-[11px] text-stone-500">PNG para WhatsApp / IG</p>
            </div>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={compartirTexto}
            className="flex w-56 items-center gap-3 border-t border-stone-100 px-4 py-3 text-left text-sm text-stone-800 transition hover:bg-stone-50"
          >
            <MessageSquareText className="size-4 text-stone-500" aria-hidden />
            <div>
              <p className="font-medium">Como texto</p>
              <p className="text-[11px] text-stone-500">Copia al portapapeles</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

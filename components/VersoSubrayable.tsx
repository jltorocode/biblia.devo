"use client";

import { useEffect, useRef, useState } from "react";
import { subrayarVersiculoAction, quitarSubrayadoAction } from "@/actions/guardados";
import {
  COLORES,
  COLOR_DEFAULT,
  type ColorSubrayado,
  COLORES_POR_SLUG,
} from "@/lib/subrayados";

interface Props {
  versiculoId: string;
  numero: number;
  texto: string;
  colorInicial: ColorSubrayado | null;
  esPremium: boolean;
  autenticado: boolean;
}

/**
 * Verso renderizado inline en el lector. Click → abre popover con paleta
 * (1 color si free, 4 si premium) + "quitar". Aplica el subrayado optimista
 * mientras el Server Action se resuelve.
 */
export function VersoSubrayable({
  versiculoId,
  numero,
  texto,
  colorInicial,
  esPremium,
  autenticado,
}: Props) {
  const [color, setColor] = useState<ColorSubrayado | null>(colorInicial);
  const [abierto, setAbierto] = useState(false);
  const [savingMsg, setSavingMsg] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function onDocClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
          setAbierto(false);
        }
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [abierto]);

  async function pintar(c: ColorSubrayado) {
    if (!autenticado) {
      setSavingMsg("Iniciá sesión para subrayar");
      setTimeout(() => setSavingMsg(null), 2000);
      setAbierto(false);
      return;
    }
    setColor(c); // optimista
    setAbierto(false);
    const r = await subrayarVersiculoAction({ versiculoId, color: c });
    if (!r.ok) {
      setColor(colorInicial); // rollback
      setSavingMsg(r.error);
      setTimeout(() => setSavingMsg(null), 2500);
    } else if (r.color !== c) {
      // El servidor cambio el color (p.ej. cayo al default por plan)
      setColor(r.color);
    }
  }

  async function quitar() {
    setColor(null);
    setAbierto(false);
    const r = await quitarSubrayadoAction(versiculoId);
    if (!r.ok) {
      setColor(colorInicial);
      setSavingMsg(r.error);
      setTimeout(() => setSavingMsg(null), 2500);
    }
  }

  const info = color ? COLORES_POR_SLUG.get(color) : null;
  const colores: ColorSubrayado[] = esPremium ? COLORES.map((c) => c.slug) : [COLOR_DEFAULT];

  return (
    <span className="relative inline">
      <sup className="mr-0.5 text-[10px] font-sans text-stone-400">{numero}</sup>
      <span
        ref={buttonRef}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setAbierto((a) => !a);
          }
        }}
        className="cursor-pointer rounded-sm px-0.5 transition-colors"
        style={{ backgroundColor: info?.bg ?? "transparent" }}
      >
        {texto}
      </span>{" "}

      {abierto && (
        <div
          ref={popoverRef}
          className="absolute z-30 mt-1 flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-1.5 shadow-lg"
          role="menu"
        >
          {colores.map((c) => {
            const ci = COLORES_POR_SLUG.get(c)!;
            const activo = color === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => pintar(c)}
                aria-label={`Subrayar en ${ci.nombre.toLowerCase()}`}
                className={`size-6 rounded-full border-2 transition-transform ${
                  activo ? "scale-110 border-stone-700" : "border-white hover:scale-110"
                }`}
                style={{ backgroundColor: ci.hex }}
              />
            );
          })}
          {!esPremium && (
            <span className="ml-1 text-[10px] text-stone-400" title="Más colores con Premium">
              +
            </span>
          )}
          {color && (
            <>
              <span aria-hidden className="mx-0.5 h-4 w-px bg-stone-200" />
              <button
                type="button"
                onClick={quitar}
                aria-label="Quitar subrayado"
                className="rounded-full px-2 py-0.5 text-[11px] text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              >
                Quitar
              </button>
            </>
          )}
        </div>
      )}

      {savingMsg && (
        <span className="absolute z-30 mt-1 rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-700 shadow whitespace-nowrap">
          {savingMsg}
        </span>
      )}
    </span>
  );
}

/** Util usado server-side para limpiar texto antes de pasarlo al componente. */
export function limpiarVersoTexto(t: string): string {
  return t.trim().replace(/\s+/g, " ");
}

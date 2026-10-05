"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, Check, Cloud } from "lucide-react";
import { cambiarVersionPrefAction } from "@/actions/version";

interface VersionOpt {
  id: number;
  codigo: string;
  nombre: string;
  esApi: boolean;
}

interface Props {
  versiones: VersionOpt[];
  preferidaId: number | null;
  /** Si está, el codigo de RV1909 (default cuando no hay preferencia). */
  defaultCodigo: string;
}

export function SelectorVersionHeader({ versiones, preferidaId, defaultCodigo }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const activa = versiones.find((v) => v.id === preferidaId);
  const labelActiva = activa?.codigo.toUpperCase() ?? defaultCodigo.toUpperCase();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function elegir(id: number | null) {
    startTransition(async () => {
      const r = await cambiarVersionPrefAction(id);
      if (r.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-white hover:text-stone-900 disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Cambiar versión de la Biblia"
      >
        <BookOpen className="size-3.5 shrink-0" aria-hidden />
        <span className="tabular-nums">{labelActiva}</span>
        <ChevronDown className="size-3 shrink-0 opacity-60" aria-hidden />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-stone-200"
        >
          <div className="border-b border-stone-100 bg-stone-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Versión de la Biblia
            </p>
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            <Item
              activa={!preferidaId}
              label="Reina-Valera 1909"
              hint="local · dominio público"
              onClick={() => elegir(null)}
              pending={pending}
            />
            {versiones
              .filter((v) => v.codigo !== defaultCodigo)
              .map((v) => (
                <Item
                  key={v.id}
                  activa={v.id === preferidaId}
                  label={v.nombre}
                  hint={v.esApi ? "api.bible" : "local"}
                  icon={v.esApi ? <Cloud className="size-3 opacity-60" /> : null}
                  onClick={() => elegir(v.id)}
                  pending={pending}
                />
              ))}
          </ul>
          <div className="border-t border-stone-100 bg-stone-50 px-3 py-2 text-[10px] text-stone-500">
            La <strong>búsqueda</strong> siempre usa RV1909. La <strong>visualización</strong> se traduce a tu elección.
          </div>
        </div>
      )}
    </div>
  );
}

function Item({
  activa,
  label,
  hint,
  icon,
  onClick,
  pending,
}: {
  activa: boolean;
  label: string;
  hint: string;
  icon?: React.ReactNode;
  onClick: () => void;
  pending: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition hover:bg-stone-50 disabled:opacity-60 ${
          activa ? "bg-stone-50" : ""
        }`}
      >
        <span className="mt-0.5 size-4 shrink-0">
          {activa && <Check className="size-4 text-emerald-600" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-stone-800">{label}</span>
          <span className="block text-[10px] uppercase tracking-wider text-stone-400">
            {icon}
            {hint}
          </span>
        </span>
      </button>
    </li>
  );
}

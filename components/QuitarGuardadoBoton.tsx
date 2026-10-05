"use client";

import { useTransition, useState } from "react";
import { X } from "lucide-react";
import { quitarGuardadoAction } from "@/actions/guardados";

interface Props {
  versiculoId: string;
}

export function QuitarGuardadoBoton({ versiculoId }: Props) {
  const [pending, startTransition] = useTransition();
  const [oculto, setOculto] = useState(false);

  function quitar() {
    setOculto(true);
    startTransition(async () => {
      const res = await quitarGuardadoAction(versiculoId);
      if (!res.ok) setOculto(false);
    });
  }

  if (oculto && !pending) return null;

  return (
    <button
      onClick={quitar}
      disabled={pending}
      type="button"
      title="Quitar de guardados"
      className="text-neutral-400 transition hover:text-rose-600 disabled:cursor-wait"
    >
      <X className="size-4" aria-hidden="true" />
      <span className="sr-only">Quitar de guardados</span>
    </button>
  );
}

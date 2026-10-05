"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelarSuscripcionAction } from "@/actions/pagos";

interface Props {
  hasta: string; // ISO
}

export function BotonCancelarSuscripcion({ hasta }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  function confirmar() {
    if (
      !window.confirm(
        `Vas a cancelar tu suscripción. Mantenés acceso Premium hasta ${new Date(
          hasta,
        ).toLocaleDateString("es-AR")}.\n\n¿Continuar?`,
      )
    )
      return;

    startTransition(async () => {
      const r = await cancelarSuscripcionAction();
      if (r.ok) {
        setMensaje(
          `Cancelada. Mantenés Premium hasta ${new Date(r.canceladaHasta).toLocaleDateString("es-AR")}.`,
        );
        router.refresh();
      } else {
        setMensaje(r.error);
      }
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={confirmar}
        disabled={pending}
        className="text-sm text-rose-600 underline-offset-2 hover:underline disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Cancelando…" : "Cancelar al final del período"}
      </button>
      {mensaje && (
        <p className="mt-2 text-xs text-neutral-600">{mensaje}</p>
      )}
    </div>
  );
}

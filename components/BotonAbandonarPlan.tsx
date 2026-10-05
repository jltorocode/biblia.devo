"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { abandonarPlanAction } from "@/actions/planes";

export function BotonAbandonarPlan({ planUsuarioId }: { planUsuarioId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function abandonar() {
    if (
      !confirm(
        "¿Seguro que querés abandonar este plan? Tu progreso queda guardado y podés volver a empezarlo después.",
      )
    )
      return;
    startTransition(async () => {
      await abandonarPlanAction(planUsuarioId);
      router.push("/planes");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={abandonar}
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
    >
      <X className="size-3.5" />
      Abandonar plan
    </button>
  );
}

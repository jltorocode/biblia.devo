"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2 } from "lucide-react";
import { iniciarPlanAction } from "@/actions/planes";

export function BotonIniciarPlan({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function iniciar() {
    setError(null);
    startTransition(async () => {
      const r = await iniciarPlanAction(slug);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push("/planes/mio");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={iniciar}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-base font-medium text-white shadow-lg transition hover:bg-stone-800 disabled:opacity-60 disabled:cursor-wait"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
        {pending ? "Iniciando…" : "Empezar este plan"}
      </button>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth";

export function BotonSignOut() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function salir() {
    startTransition(async () => {
      await signOutAction();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      onClick={salir}
      disabled={pending}
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-wait"
    >
      <LogOut className="size-4" aria-hidden="true" />
      <span>{pending ? "Saliendo…" : "Cerrar sesión"}</span>
    </button>
  );
}

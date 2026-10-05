"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Wallet } from "lucide-react";
import { iniciarCheckoutAction } from "@/actions/pagos";
import type { Plan, ProviderName } from "@/lib/payments";

interface Props {
  plan: Plan;
  /** Solo los providers con credenciales configuradas se renderizan. */
  habilitados: ProviderName[];
}

const ETIQUETA: Record<ProviderName, { texto: string; sub: string; icon: typeof CreditCard }> = {
  stripe: { texto: "Tarjeta (Stripe)", sub: "USD · trial 7 días", icon: CreditCard },
  mercadopago: { texto: "MercadoPago", sub: "Pesos · LATAM", icon: Wallet },
  paypal: { texto: "PayPal", sub: "Saldo o tarjeta", icon: Wallet },
};

export function BotonesPremium({ plan, habilitados }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enCurso, setEnCurso] = useState<ProviderName | null>(null);
  const [error, setError] = useState<string | null>(null);

  function elegir(provider: ProviderName) {
    setEnCurso(provider);
    setError(null);
    startTransition(async () => {
      const r = await iniciarCheckoutAction({ plan, provider });
      if (r && r.ok === false) {
        setEnCurso(null);
        if (r.requiereCuenta) {
          router.push("/signup");
          return;
        }
        setError(r.error);
      }
      // Si todo va bien la action hace redirect() — no llegamos a este punto.
    });
  }

  if (habilitados.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Ningún provider está configurado todavía. Agregá las API keys en{" "}
        <code>.env</code> para activar el checkout.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {habilitados.map((p) => {
        const E = ETIQUETA[p];
        const Icon = E.icon;
        const cargando = enCurso === p && pending;
        return (
          <button
            key={p}
            onClick={() => elegir(p)}
            disabled={pending}
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm transition hover:border-neutral-400 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
          >
            <Icon className="size-5 text-neutral-600" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium text-neutral-800">{E.texto}</p>
              <p className="text-xs text-neutral-500">{E.sub}</p>
            </div>
            {cargando && <span className="text-xs text-neutral-500">redirigiendo…</span>}
          </button>
        );
      })}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

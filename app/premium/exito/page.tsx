import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Gracias" };

export default function ExitoPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <CheckCircle2
          className="mx-auto size-12 text-emerald-500"
          aria-hidden="true"
        />
        <h1 className="mt-4 text-2xl font-medium text-neutral-800">
          ¡Bienvenido a Premium!
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Tu suscripción se está confirmando. Vas a tener acceso completo en
          cuanto el provider termine de procesar el pago (segundos a minutos).
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Si tarda más de unos minutos, revisá tu email o escribinos.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Buscar un versículo
          </Link>
          <Link
            href="/ajustes"
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700"
          >
            Ver mi cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}

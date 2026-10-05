import Link from "next/link";
import { Check } from "lucide-react";
import { BotonesPremium } from "@/components/BotonesPremium";
import { planesDisponibles } from "@/lib/payments";

export const dynamic = "force-dynamic";
export const metadata = { title: "Premium" };

const PRECIOS = {
  mensual: { usd: "$4.99 / mes", ars: "$4.000 / mes" },
  anual: { usd: "$39.99 / año", ars: "$40.000 / año", ahorro: "33%" },
};

const FEATURES = [
  "Guardados ilimitados",
  "Historial completo",
  "Recordatorio diario personalizado",
  "Búsquedas sin límite",
  "Acceso a versiones bíblicas premium (cuando estén disponibles)",
];

export default function PremiumPage() {
  const habilitados = planesDisponibles();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-12 pt-16">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-medium text-neutral-800">Devocional Premium</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Para llevar la Palabra contigo, sin límites. Cancelás cuando quieras.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <PlanCard
          titulo="Mensual"
          precio={PRECIOS.mensual.usd}
          precioAlt={PRECIOS.mensual.ars}
          features={FEATURES}
          habilitados={habilitados}
          plan="premium_mensual"
        />
        <PlanCard
          titulo="Anual"
          precio={PRECIOS.anual.usd}
          precioAlt={PRECIOS.anual.ars}
          features={FEATURES}
          badge={`Ahorro ${PRECIOS.anual.ahorro}`}
          recomendado
          habilitados={habilitados}
          plan="premium_anual"
        />
      </section>

      <p className="mt-8 text-center text-xs text-neutral-400">
        Pagos procesados por Stripe / MercadoPago / PayPal. Tus datos de tarjeta
        nunca tocan nuestros servidores.{" "}
        <Link href="/" className="underline">
          Volver
        </Link>
      </p>
    </main>
  );
}

function PlanCard({
  titulo,
  precio,
  precioAlt,
  features,
  badge,
  recomendado,
  habilitados,
  plan,
}: {
  titulo: string;
  precio: string;
  precioAlt: string;
  features: string[];
  badge?: string;
  recomendado?: boolean;
  habilitados: ReturnType<typeof planesDisponibles>;
  plan: "premium_mensual" | "premium_anual";
}) {
  return (
    <article
      className={`relative flex flex-col gap-5 rounded-2xl border bg-white p-6 shadow-sm ${
        recomendado ? "border-neutral-900" : "border-neutral-200"
      }`}
    >
      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-neutral-900 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
          {badge}
        </span>
      )}
      <header>
        <h2 className="text-xl font-medium text-neutral-800">{titulo}</h2>
        <p className="mt-1 text-2xl font-semibold text-neutral-900">{precio}</p>
        <p className="text-xs text-neutral-500">{precioAlt}</p>
      </header>

      <ul className="space-y-2 text-sm text-neutral-700">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 text-emerald-600" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <BotonesPremium plan={plan} habilitados={habilitados} />
    </article>
  );
}

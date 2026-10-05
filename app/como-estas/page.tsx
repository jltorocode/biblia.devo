import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { SelectorEstado } from "@/components/SelectorEstado";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "¿Cómo te sentís hoy?",
  description: "Elegí tu estado y recibí un versículo escogido para vos.",
};

export default async function ComoEstasPage() {
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!sesion?.user?.id) redirect("/signin?next=/como-estas");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <header className="mb-6 text-center sm:mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
          Tu estado de hoy
        </p>
        <h1 className="mt-2 font-serif text-2xl text-stone-900 sm:text-3xl">
          ¿Cómo te sentís ahora?
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
          Recibí una palabra escogida para este momento.
        </p>
      </header>

      <SelectorEstado />

      <p className="mt-8 text-center text-xs text-stone-500">
        <Link href="/inicio" className="underline-offset-4 hover:underline">
          ← Volver al dashboard
        </Link>
      </p>
    </main>
  );
}

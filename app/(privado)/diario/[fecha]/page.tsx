import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { entradasDelDia } from "@/lib/entradas";
import { planDeUsuario } from "@/lib/plan-limits";
import { EntradaCard, type EntradaDiarioInput } from "@/components/diario/EntradaCard";
import { DiarioGate } from "@/components/diario/DiarioGate";
import { BotonCompartirDiario } from "@/components/diario/BotonCompartirDiario";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ fecha: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { fecha } = await params;
  const fechaBonita = formatearFechaLarga(fecha);
  return {
    title: fechaBonita ? `${fechaBonita} — Diario` : "Diario",
    description: "Tu conversación diaria con Dios.",
    robots: { index: false, follow: false }, // privado, no indexar
  };
}

function esFechaValida(f: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(f) && !Number.isNaN(new Date(`${f}T00:00:00Z`).getTime());
}

function formatearFechaLarga(fecha: string): string | null {
  if (!esFechaValida(fecha)) return null;
  const d = new Date(`${fecha}T12:00:00Z`);
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function diaSiguiente(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function mesDe(fecha: string): string {
  return fecha.slice(0, 7);
}

export default async function DiarioFechaPage({ params }: Props) {
  const { fecha } = await params;
  if (!esFechaValida(fecha)) notFound();

  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!sesion?.user?.id) redirect("/signin?next=/diario");

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.user.id },
    select: { premiumHasta: true },
  });
  const esPremium = planDeUsuario(usuario?.premiumHasta) === "PREMIUM";

  // Free user: tiene acceso a SU dia de hoy unicamente (su propia entrada).
  // Para dias pasados o futuros muestra el upsell.
  const esHoy = fecha === hoyISO();
  if (!esPremium && !esHoy) {
    return <DiarioGate />;
  }

  const entradas = await entradasDelDia(sesion.user.id, fecha);
  const cards: EntradaDiarioInput[] = entradas.map((e) => ({
    id: e.id.toString(),
    modo: e.modo as EntradaDiarioInput["modo"],
    creadoEn: e.creadoEn,
    nota: e.nota,
    area: e.area,
    estado: e.estado,
    versiculo: e.versiculo
      ? {
          capitulo: e.versiculo.capitulo,
          versiculo: e.versiculo.versiculo,
          texto: e.versiculo.texto,
          libro: e.versiculo.libro,
        }
      : null,
    lecturaInicio: e.lecturaInicio
      ? {
          capitulo: e.lecturaInicio.capitulo,
          versiculo: e.lecturaInicio.versiculo,
          libro: e.lecturaInicio.libro,
        }
      : null,
    lecturaFin: e.lecturaFin,
  }));

  const anterior = diaSiguiente(fecha, -1);
  const siguiente = diaSiguiente(fecha, 1);
  const fechaBonita = formatearFechaLarga(fecha);

  return (
    <main
      className="mx-auto w-full max-w-2xl flex-1 px-5 py-12"
      style={{ background: "linear-gradient(180deg, transparent 0%, rgba(250,247,242,.6) 60%)" }}
    >
      {/* Header en formato carta */}
      <header className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-400 mb-2">
          <Link href={`/diario/mes/${mesDe(fecha)}`} className="hover:underline">
            {mesNombre(fecha)}
          </Link>
        </p>
        <h1
          className="font-serif text-3xl sm:text-4xl text-stone-800 capitalize"
          style={{ fontFamily: "var(--devo-font-serif)" }}
        >
          {fechaBonita}
        </h1>
        <div className="mt-4 flex items-center justify-center gap-1 text-stone-400" aria-hidden>
          <span>✦</span>
        </div>
      </header>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-8 py-12 text-center">
          <p className="text-stone-600">
            {esHoy
              ? "Todavía no hiciste tu entrada de hoy."
              : "No hubo entradas este día."}
          </p>
          {esHoy && (
            <Link
              href="/"
              className="mt-4 inline-block rounded-full bg-stone-800 px-5 py-2 text-sm font-medium text-white hover:bg-stone-900"
            >
              Empezar hoy
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {cards.map((c) => (
              <EntradaCard key={c.id} entrada={c} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <BotonCompartirDiario fecha={fecha} />
          </div>
        </>
      )}

      {/* Navegación entre días — premium puede recorrer todo, free solo hoy */}
      {esPremium && (
        <nav className="mt-10 flex items-center justify-between text-sm text-stone-500">
          <Link
            href={`/diario/${anterior}`}
            className="rounded-full px-3 py-1.5 hover:bg-white/60 hover:text-stone-700"
          >
            ← Día anterior
          </Link>
          {!esHoy && (
            <Link
              href={`/diario/${hoyISO()}`}
              className="rounded-full px-3 py-1.5 hover:bg-white/60 hover:text-stone-700"
            >
              Hoy
            </Link>
          )}
          <Link
            href={`/diario/${siguiente}`}
            className="rounded-full px-3 py-1.5 hover:bg-white/60 hover:text-stone-700"
          >
            Día siguiente →
          </Link>
        </nav>
      )}
    </main>
  );
}

function hoyISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function mesNombre(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

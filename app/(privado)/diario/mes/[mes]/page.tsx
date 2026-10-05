import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { entradasDelMes } from "@/lib/entradas";
import { planDeUsuario } from "@/lib/plan-limits";
import { DiarioGate } from "@/components/diario/DiarioGate";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ mes: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mes } = await params;
  return {
    title: `${formatearMes(mes) ?? mes} — Diario`,
    robots: { index: false, follow: false },
  };
}

function parseMes(mes: string): { anio: number; mes: number } | null {
  const m = mes.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const anio = Number(m[1]);
  const mm = Number(m[2]);
  if (mm < 1 || mm > 12) return null;
  return { anio, mes: mm };
}

function formatearMes(mes: string): string | null {
  const p = parseMes(mes);
  if (!p) return null;
  const d = new Date(Date.UTC(p.anio, p.mes - 1, 1));
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

function mesAnteriorYSiguiente(mes: string): { prev: string; next: string } | null {
  const p = parseMes(mes);
  if (!p) return null;
  const prev = new Date(Date.UTC(p.anio, p.mes - 2, 1));
  const next = new Date(Date.UTC(p.anio, p.mes, 1));
  const f = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return { prev: f(prev), next: f(next) };
}

export default async function DiarioMesPage({ params }: Props) {
  const { mes } = await params;
  const parsed = parseMes(mes);
  if (!parsed) notFound();

  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!sesion?.user?.id) redirect("/signin?next=/diario");

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.user.id },
    select: { premiumHasta: true },
  });
  const esPremium = planDeUsuario(usuario?.premiumHasta) === "PREMIUM";
  if (!esPremium) return <DiarioGate />;

  const entradas = await entradasDelMes({
    usuarioId: sesion.user.id,
    anio: parsed.anio,
    mes: parsed.mes,
  });

  // Agrupar por dia (YYYY-MM-DD). Por dia, tomamos la primera entrada como
  // "resumen visual" (emoji + un trozo del verso o referencia de lectura).
  type Resumen = {
    fecha: string;
    emoji: string | null;
    colorHex: string | null;
    pista: string;
    modo: string;
  };
  const resumenPorDia = new Map<string, Resumen>();
  for (const e of entradas) {
    const k = e.fecha.toISOString().slice(0, 10);
    if (resumenPorDia.has(k)) continue;
    let pista = "";
    if (e.modo === "lectura" && e.lecturaInicio) {
      pista = `${e.lecturaInicio.libro.nombreCorto} ${e.lecturaInicio.capitulo}`;
    } else if (e.versiculo) {
      pista = fragmento(e.versiculo.texto, 60);
    } else if (e.estado) {
      pista = e.estado.nombre;
    }
    resumenPorDia.set(k, {
      fecha: k,
      emoji: e.estado?.emoji ?? null,
      colorHex: e.estado?.colorHex ?? null,
      pista,
      modo: e.modo,
    });
  }

  const totalDias = diasDelMes(parsed.anio, parsed.mes);
  const celdas: Array<{ dia: number; fecha: string; resumen: Resumen | null }> = [];
  for (let d = 1; d <= totalDias; d++) {
    const fechaIso = `${parsed.anio}-${String(parsed.mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    celdas.push({ dia: d, fecha: fechaIso, resumen: resumenPorDia.get(fechaIso) ?? null });
  }

  const nav = mesAnteriorYSiguiente(mes)!;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
      <header className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
          <Link href={`/diario/anio/${parsed.anio}`} className="hover:underline">
            {parsed.anio}
          </Link>
        </p>
        <h1
          className="mt-2 font-serif text-3xl sm:text-4xl text-stone-800 capitalize"
          style={{ fontFamily: "var(--devo-font-serif)" }}
        >
          {formatearMes(mes)}
        </h1>
      </header>

      <nav className="mb-6 flex items-center justify-between text-sm text-stone-500">
        <Link href={`/diario/mes/${nav.prev}`} className="hover:text-stone-700">
          ← Mes anterior
        </Link>
        <Link href={`/diario/${hoyISO()}`} className="hover:text-stone-700">
          Hoy
        </Link>
        <Link href={`/diario/mes/${nav.next}`} className="hover:text-stone-700">
          Mes siguiente →
        </Link>
      </nav>

      <div className="grid grid-cols-5 gap-3 sm:grid-cols-7">
        {celdas.map((c) =>
          c.resumen ? (
            <Link
              key={c.dia}
              href={`/diario/${c.fecha}`}
              className="group aspect-[3/4] rounded-xl border border-stone-200 bg-white px-2 py-2 text-left transition hover:border-stone-400 hover:shadow"
              style={{
                background: c.resumen.colorHex
                  ? `linear-gradient(180deg, ${c.resumen.colorHex}14 0%, #fff 60%)`
                  : undefined,
              }}
            >
              <p className="text-[10px] text-stone-400">{c.dia}</p>
              <p className="mt-0.5 text-xl" aria-hidden>
                {c.resumen.emoji ?? "·"}
              </p>
              <p
                className="mt-1 line-clamp-3 text-[10px] leading-tight text-stone-600"
                style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
              >
                {c.resumen.pista}
              </p>
            </Link>
          ) : (
            <div
              key={c.dia}
              className="aspect-[3/4] rounded-xl border border-dashed border-stone-200 px-2 py-2 text-left"
            >
              <p className="text-[10px] text-stone-300">{c.dia}</p>
            </div>
          ),
        )}
      </div>
    </main>
  );
}

function fragmento(texto: string, max: number): string {
  const t = texto.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

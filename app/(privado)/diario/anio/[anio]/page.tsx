import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { planDeUsuario } from "@/lib/plan-limits";
import { DiarioGate } from "@/components/diario/DiarioGate";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ anio: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { anio } = await params;
  return {
    title: `${anio} — Tu año con Dios`,
    robots: { index: false, follow: false },
  };
}

const MESES_CORTOS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

function diaSemanaInicial(anio: number, mes: number): number {
  // 0 = domingo, 1 = lunes, ...
  return new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay();
}

export default async function DiarioAnioPage({ params }: Props) {
  const { anio: anioStr } = await params;
  const anio = Number(anioStr);
  if (!Number.isInteger(anio) || anio < 1900 || anio > 2200) notFound();

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

  // Traer todas las entradas del anio (con su color para pintar el dia)
  const inicio = new Date(Date.UTC(anio, 0, 1));
  const fin = new Date(Date.UTC(anio + 1, 0, 1));
  const entradas = await prisma.entrada.findMany({
    where: {
      usuarioId: sesion.user.id,
      fecha: { gte: inicio, lt: fin },
    },
    orderBy: [{ fecha: "asc" }, { creadoEn: "asc" }],
    select: {
      fecha: true,
      estado: { select: { colorHex: true } },
    },
  });

  // Para cada dia del año: el color del primer estado (si lo hubo).
  type Dia = { color: string | null };
  const porFecha = new Map<string, Dia>();
  for (const e of entradas) {
    const k = e.fecha.toISOString().slice(0, 10);
    if (porFecha.has(k)) continue;
    porFecha.set(k, { color: e.estado?.colorHex ?? null });
  }

  const totalEntradas = entradas.length;
  const diasActivos = porFecha.size;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <header className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-400 mb-1">
          Tu año con Dios
        </p>
        <h1
          className="font-serif text-4xl sm:text-5xl text-stone-800"
          style={{ fontFamily: "var(--devo-font-serif)" }}
        >
          {anio}
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          <strong>{totalEntradas}</strong> entrada{totalEntradas === 1 ? "" : "s"} ·{" "}
          <strong>{diasActivos}</strong> día{diasActivos === 1 ? "" : "s"} activos
        </p>
      </header>

      <nav className="mb-8 flex items-center justify-between text-sm text-stone-500">
        <Link
          href={`/diario/anio/${anio - 1}`}
          className="hover:text-stone-800"
        >
          ← {anio - 1}
        </Link>
        <Link href={`/diario`} className="hover:text-stone-800">
          Hoy
        </Link>
        <Link
          href={`/diario/anio/${anio + 1}`}
          className="hover:text-stone-800"
        >
          {anio + 1} →
        </Link>
      </nav>

      {/* 12 mini-calendarios */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {MESES_CORTOS.map((mesCorto, idx) => {
          const mes = idx + 1;
          const dias = diasDelMes(anio, mes);
          const offset = diaSemanaInicial(anio, mes);

          // Lunes-first: convertimos domingo=0 a offset=6 (queda al final)
          const offsetLun = offset === 0 ? 6 : offset - 1;

          return (
            <Link
              key={mes}
              href={`/diario/mes/${anio}-${String(mes).padStart(2, "0")}`}
              className="block rounded-xl border border-stone-200 bg-white/70 px-3 py-3 transition hover:border-stone-400 hover:shadow"
            >
              <p
                className="mb-2 text-sm font-medium text-stone-700"
                style={{ fontFamily: "var(--devo-font-serif)" }}
              >
                {MESES_LARGOS[idx]!.replace(/^./, (c) => c.toUpperCase())}
              </p>
              <div className="grid grid-cols-7 gap-[2px] text-[8px]">
                {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                  <div
                    key={d}
                    className="flex items-center justify-center text-stone-300"
                  >
                    {d}
                  </div>
                ))}
                {Array.from({ length: offsetLun }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {Array.from({ length: dias }).map((_, i) => {
                  const dia = i + 1;
                  const fechaIso = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                  const info = porFecha.get(fechaIso);
                  return (
                    <div
                      key={dia}
                      className="aspect-square flex items-center justify-center rounded-sm"
                      style={
                        info
                          ? {
                              backgroundColor: info.color
                                ? `${info.color}55`
                                : "#5b463655",
                            }
                          : undefined
                      }
                      title={info ? `${fechaIso}: con entrada` : fechaIso}
                    >
                      <span
                        className={
                          info ? "text-stone-800" : "text-stone-400"
                        }
                      >
                        {dia}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

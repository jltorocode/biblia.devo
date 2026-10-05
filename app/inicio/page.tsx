import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  Flame,
  Bookmark,
  TrendingUp,
  NotebookPen,
  ArrowRight,
  ChevronRight,
  Trophy,
  Heart,
} from "lucide-react";
import { Onboarding } from "@/components/Onboarding";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { rachaActual } from "@/lib/racha";
import { obtenerPlanActivo } from "@/lib/planes";
import { listarLogrosUsuario } from "@/lib/logros";
import { LIBROS_POR_CODIGO } from "@/lib/libros";

export const dynamic = "force-dynamic";

export default async function InicioApp() {
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!sesion?.user?.id) redirect("/signin?next=/inicio");

  const usuarioId = sesion.user.id;
  const nombre = sesion.user.name?.split(/\s+/)[0] ?? "amig@";

  const cuantasEntradas = await prisma.entrada.count({ where: { usuarioId } });
  const mostrarOnboarding = cuantasEntradas === 0;

  if (mostrarOnboarding) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-16">
        <Onboarding />
        <div className="mt-8 text-center">
          <Link
            href="/como-estas"
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
          >
            <Heart className="size-4" aria-hidden />
            Empezar — ¿cómo estás hoy?
          </Link>
        </div>
      </main>
    );
  }

  // ───── Cargar datos del dashboard en paralelo ─────
  const [racha, plan, logrosUsuario, guardados, subrayados, ultimaEntrada, diasActivos] =
    await Promise.all([
      rachaActual(usuarioId),
      obtenerPlanActivo(usuarioId),
      listarLogrosUsuario(usuarioId),
      prisma.versiculoGuardado.count({ where: { usuarioId, color: null } }),
      prisma.versiculoGuardado.count({
        where: { usuarioId, color: { not: null } },
      }),
      prisma.entrada.findFirst({
        where: { usuarioId, versiculoId: { not: null } },
        orderBy: { creadoEn: "desc" },
        include: {
          versiculo: {
            select: {
              capitulo: true,
              versiculo: true,
              libro: { select: { codigo: true } },
            },
          },
        },
      }),
      prisma.entrada.findMany({
        where: { usuarioId },
        select: { fecha: true },
        distinct: ["fecha"],
      }),
    ]);

  const ultimoLibro = ultimaEntrada?.versiculo?.libro
    ? LIBROS_POR_CODIGO.get(ultimaEntrada.versiculo.libro.codigo)
    : null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
      {/* ───── Saludo + racha ───── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            Hola{nombre !== "amig@" ? ", " + nombre : ""}
          </p>
          <h1 className="mt-1 font-serif text-2xl text-stone-900 sm:text-3xl">
            Tu camino, hoy
          </h1>
        </div>
        {racha > 0 && (
          <Link
            href="/estadisticas"
            className="inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 transition hover:from-amber-200 hover:to-orange-200 sm:self-end"
          >
            <Flame className="size-4 text-orange-600" aria-hidden />
            <span>{racha} {racha === 1 ? "día" : "días"} de racha</span>
            <ChevronRight className="size-3.5 opacity-50" aria-hidden />
          </Link>
        )}
      </header>

      {/* ───── CTA primaria: ¿Cómo estás? ───── */}
      <section className="mt-6">
        <Link
          href="/como-estas"
          className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50 p-5 ring-1 ring-rose-200 transition hover:shadow-md sm:p-8"
        >
          <div
            aria-hidden
            className="absolute -right-8 -top-8 text-[140px] opacity-10 select-none sm:text-[180px]"
          >
            💝
          </div>
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-700">
                Versículo según tu corazón
              </p>
              <h2 className="mt-2 font-serif text-2xl text-stone-900 sm:text-3xl">
                ¿Cómo te sentís ahora?
              </h2>
              <p className="mt-1.5 max-w-md text-sm text-stone-600">
                13 estados emocionales · una palabra escogida para este momento.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-stone-800">
              Empezar
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </div>
        </Link>
      </section>

      {/* ───── Stats compactas ───── */}
      <section className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatPill
          icon={<Flame className="size-4 text-orange-600" />}
          valor={diasActivos.length}
          label={diasActivos.length === 1 ? "Día leyendo" : "Días leyendo"}
        />
        <StatPill
          icon={<Bookmark className="size-4 text-amber-600" />}
          valor={guardados}
          label="Guardados"
        />
        <StatPill
          icon={<NotebookPen className="size-4 text-violet-600" />}
          valor={subrayados}
          label="Subrayados"
        />
        <StatPill
          icon={<Trophy className="size-4 text-emerald-600" />}
          valor={logrosUsuario.length}
          label="Logros"
        />
      </section>

      {/* ───── Plan en curso (si hay) ───── */}
      {plan && (
        <section className="mt-6">
          <PlanCard plan={plan} />
        </section>
      )}

      {/* ───── Última lectura (si hay) ───── */}
      {ultimoLibro && ultimaEntrada?.versiculo && (
        <section className="mt-6">
          <Link
            href={`/leer/${ultimaEntrada.versiculo.libro?.codigo}/${ultimaEntrada.versiculo.capitulo}`}
            className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-400 hover:shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Última lectura
              </p>
              <p className="mt-1 truncate font-serif text-base text-stone-900 sm:text-lg">
                {ultimoLibro.nombre} {ultimaEntrada.versiculo.capitulo}:
                {ultimaEntrada.versiculo.versiculo}
              </p>
            </div>
            <span className="ml-3 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-stone-600">
              Continuar
              <ChevronRight className="size-4" aria-hidden />
            </span>
          </Link>
        </section>
      )}

      {/* ───── Atajos rápidos ───── */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            Atajos rápidos
          </h2>
          <Link
            href="/menu"
            className="text-xs text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline"
          >
            Ver todo →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          <Atajo
            href="/leer"
            emoji="📖"
            titulo="Leer"
            desc="Los 66 libros"
            tint="from-amber-50 to-orange-50 ring-amber-200"
          />
          <Atajo
            href="/trivia"
            emoji="🎮"
            titulo="Trivia"
            desc="Contrarreloj"
            tint="from-emerald-50 to-teal-50 ring-emerald-200"
            destacado
          />
          <Atajo
            href="/timeline"
            emoji="✦"
            titulo="Timeline"
            desc="Hitos bíblicos"
            tint="from-stone-50 to-amber-50 ring-stone-200"
          />
          <Atajo
            href="/buscar"
            emoji="🔍"
            titulo="Buscar"
            desc="Libre y semántico"
            tint="from-sky-50 to-blue-50 ring-sky-200"
          />
          <Atajo
            href="/oracion"
            emoji="🙏"
            titulo="Oración"
            desc="Tus peticiones"
            tint="from-purple-50 to-fuchsia-50 ring-purple-200"
          />
          <Atajo
            href="/estadisticas"
            emoji="📊"
            titulo="Tu caminar"
            desc="Heatmap · logros"
            tint="from-violet-50 to-indigo-50 ring-violet-200"
          />
          <Atajo
            href="/planes"
            emoji="🗓"
            titulo="Planes"
            desc="Lectura guiada"
            tint="from-blue-50 to-cyan-50 ring-blue-200"
          />
          <Atajo
            href="/guardados"
            emoji="🔖"
            titulo="Guardados"
            desc="Tus favoritos"
            tint="from-rose-50 to-pink-50 ring-rose-200"
          />
        </div>
      </section>
    </main>
  );
}

function StatPill({
  icon,
  valor,
  label,
}: {
  icon: React.ReactNode;
  valor: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 sm:py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-stone-50">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-serif text-lg leading-none text-stone-900 sm:text-xl">
          {valor}
        </p>
        <p className="mt-1 truncate text-[10px] uppercase tracking-wider text-stone-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
}: {
  plan: NonNullable<Awaited<ReturnType<typeof obtenerPlanActivo>>>;
}) {
  return (
    <Link
      href={`/planes/mio/${plan.diaSiguienteParaLeer}`}
      className="group flex flex-col gap-3 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
          Plan activo {plan.atrasadoDias > 0 ? `· ${plan.atrasadoDias}d atrasado` : ""}
        </p>
        <h3 className="mt-1 font-serif text-lg text-stone-900 sm:text-xl">
          {plan.planEmoji} {plan.planNombre}
        </h3>
        <div className="mt-2.5 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
              style={{ width: `${plan.porcentaje}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-semibold text-blue-700">
            Día {plan.diaSiguienteParaLeer}/{plan.totalDias}
          </span>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition group-hover:bg-blue-700">
        Continuar
        <ArrowRight className="size-3.5" aria-hidden />
      </span>
    </Link>
  );
}

function Atajo({
  href,
  emoji,
  titulo,
  desc,
  tint,
  destacado,
}: {
  href: string;
  emoji: string;
  titulo: string;
  desc: string;
  tint: string;
  destacado?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br p-3 ring-1 transition hover:scale-[1.02] hover:shadow-md active:scale-100 sm:p-4 ${tint}`}
    >
      {destacado && (
        <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-900">
          Nuevo
        </span>
      )}
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-2 font-serif text-sm leading-tight text-stone-900 sm:text-base">
        {titulo}
      </h3>
      <p className="mt-0.5 text-[11px] leading-snug text-stone-600">{desc}</p>
    </Link>
  );
}

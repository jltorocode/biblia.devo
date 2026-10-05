import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Flame,
  BookOpen,
  Heart,
  CheckCircle2,
  Trophy,
  Activity,
  Calendar,
  Sparkles,
} from "lucide-react";
import { calcularEstadisticas } from "@/lib/estadisticas";
import { listarLogrosUsuario, LOGROS } from "@/lib/logros";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { Heatmap } from "@/components/Heatmap";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estadísticas" };

export default async function EstadisticasPage() {
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) redirect("/signin?next=/estadisticas");

  const [stats, logrosUsuario] = await Promise.all([
    calcularEstadisticas(usuarioId),
    listarLogrosUsuario(usuarioId),
  ]);

  const slugsGanados = new Set(logrosUsuario.map((l) => l.logro.slug));
  const logrosPendientes = LOGROS.filter((l) => !slugsGanados.has(l.slug));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Tu</p>
        <h1 className="mt-2 font-serif text-3xl text-stone-900">Caminar</h1>
        <p className="mt-2 text-sm text-stone-600">
          Lo que has hecho con Dios en este tiempo.
        </p>
      </header>

      {/* Cards de stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Flame className="size-5 text-orange-500" />}
          label="Racha actual"
          value={`${stats.rachaActual}d`}
          sub={`máx ${stats.mejorRacha}d`}
        />
        <StatCard
          icon={<Activity className="size-5 text-emerald-500" />}
          label="Días activos"
          value={stats.totalDiasActivos.toString()}
          sub="último año"
        />
        <StatCard
          icon={<BookOpen className="size-5 text-blue-500" />}
          label="Entradas"
          value={stats.totalEntradas.toString()}
          sub="totales"
        />
        <StatCard
          icon={<Heart className="size-5 text-pink-500" />}
          label="Guardados"
          value={(stats.versosGuardados + stats.subrayados).toString()}
          sub={`${stats.subrayados} subrayados`}
        />
        <StatCard
          icon={<CheckCircle2 className="size-5 text-violet-500" />}
          label="Planes"
          value={stats.planesCompletados.toString()}
          sub={`${stats.planesIniciados} iniciados`}
        />
        <StatCard
          icon={<Sparkles className="size-5 text-amber-500" />}
          label="Oraciones respondidas"
          value={stats.peticionesRespondidas.toString()}
          sub={`${stats.peticionesPendientes} pendientes`}
        />
        {stats.estadoTop && (
          <StatCard
            icon={<Calendar className="size-5 text-cyan-500" />}
            label="Estado más frecuente"
            value={stats.estadoTop.nombre}
            sub={`${stats.estadoTop.count} veces`}
          />
        )}
        {stats.libroTop && (
          <StatCard
            icon={<BookOpen className="size-5 text-stone-700" />}
            label="Libro más leído"
            value={stats.libroTop.nombre}
            sub={`${stats.libroTop.count} entradas`}
          />
        )}
      </section>

      {/* Heatmap */}
      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Tu último año
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Cada cuadrito es un día. Verdes = días que tuviste actividad.
        </p>
        <div className="mt-3">
          <Heatmap celdas={stats.heatmap} />
        </div>
      </section>

      {/* Logros */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
          <Trophy className="size-3.5" /> Logros
          <span className="text-stone-400">
            {logrosUsuario.length} / {LOGROS.length}
          </span>
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {logrosUsuario.map(({ logro, ganadoEn }) => (
            <div
              key={logro.slug}
              className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm"
            >
              <p className="text-3xl">{logro.emoji}</p>
              <p className="mt-2 font-semibold text-stone-900">{logro.nombre}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
                {logro.descripcion}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-amber-700">
                Ganado el {ganadoEn.toLocaleDateString("es-AR")}
              </p>
            </div>
          ))}
          {logrosPendientes.map((logro) => (
            <div
              key={logro.slug}
              className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 opacity-60"
            >
              <p className="text-3xl grayscale">{logro.emoji}</p>
              <p className="mt-2 font-semibold text-stone-700">{logro.nombre}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                {logro.descripcion}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-stone-400">
                Bloqueado
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-2">{icon}</div>
      <p className="text-xl font-bold tabular-nums text-stone-900">{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wider text-stone-500">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-stone-400">{sub}</p>}
    </div>
  );
}

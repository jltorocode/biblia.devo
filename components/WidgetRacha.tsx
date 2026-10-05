import { Flame, Sparkles } from "lucide-react";
import { calcularRacha } from "@/lib/racha";

interface Props {
  usuarioId: string;
  /** Si "compact", muestra solo el número con icono pequeño. */
  variante?: "card" | "compact";
}

function mensaje(actual: number, pendiente: boolean): string {
  if (actual === 0) return "Empezá tu racha hoy. Un solo verso cuenta.";
  if (pendiente) return `Llevás ${actual} día${actual === 1 ? "" : "s"} — mantenelo hoy.`;
  if (actual === 1) return "¡Primer día! Mañana sumás.";
  if (actual >= 100) return "Más de 100 días seguidos. Sos imparable.";
  if (actual >= 30) return `¡${actual} días! Un mes ya.`;
  if (actual >= 7) return `${actual} días — una semana entera.`;
  return `${actual} días seguidos. Vamos.`;
}

function fuegoColor(actual: number): string {
  if (actual >= 100) return "text-violet-500";
  if (actual >= 30) return "text-amber-500";
  if (actual >= 7) return "text-orange-500";
  if (actual >= 1) return "text-red-500";
  return "text-stone-400";
}

export async function WidgetRacha({ usuarioId, variante = "card" }: Props) {
  const racha = await calcularRacha(usuarioId);
  const color = fuegoColor(racha.actual);

  if (variante === "compact") {
    return (
      <div
        className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-stone-800 ring-1 ring-stone-200"
        title={mensaje(racha.actual, racha.pendienteHoy)}
      >
        <Flame className={`size-3.5 ${color}`} aria-hidden />
        <span className="tabular-nums">{racha.actual}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white/80 px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`relative ${racha.actual > 0 ? "" : "opacity-50"}`}>
            <Flame className={`size-10 ${color}`} aria-hidden />
            {racha.actual >= 7 && (
              <Sparkles
                className="absolute -right-1 -top-1 size-4 text-amber-400"
                aria-hidden
              />
            )}
          </div>
          <div>
            <p className="text-3xl font-bold tabular-nums text-stone-900">
              {racha.actual}
              <span className="ml-1 text-sm font-medium text-stone-500">
                día{racha.actual === 1 ? "" : "s"}
              </span>
            </p>
            <p className="text-xs uppercase tracking-wider text-stone-500">
              racha actual
            </p>
          </div>
        </div>
        {racha.mejor > 0 && (
          <div className="text-right">
            <p className="text-xl font-semibold tabular-nums text-stone-700">{racha.mejor}</p>
            <p className="text-[10px] uppercase tracking-wider text-stone-400">tu mejor</p>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-stone-600">{mensaje(racha.actual, racha.pendienteHoy)}</p>
    </div>
  );
}

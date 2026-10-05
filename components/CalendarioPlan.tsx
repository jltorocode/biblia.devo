import Link from "next/link";
import { Check } from "lucide-react";

interface DiaCelda {
  dia: number;
  leido: boolean;
  titulo: string | null;
}

interface Props {
  planUsuarioId: string;
  dias: DiaCelda[];
  /** Qué día le correspondería según fechaInicio (ej: día 5). */
  diaActual: number;
  /** Próximo día NO leído (1..N). */
  diaSiguiente: number;
}

export function CalendarioPlan({ dias, diaActual, diaSiguiente }: Props) {
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
      {dias.map((d) => {
        const esHoy = d.dia === diaActual;
        const esSiguiente = d.dia === diaSiguiente && !d.leido;
        const esAtrasado = !d.leido && d.dia < diaActual;
        const esFuturo = !d.leido && d.dia > diaActual;

        const baseCls =
          "relative aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition";
        let cls = "";
        if (d.leido) cls = "bg-emerald-500 text-white hover:bg-emerald-600";
        else if (esSiguiente) cls = "bg-stone-900 text-white ring-2 ring-stone-300 hover:bg-stone-800";
        else if (esAtrasado) cls = "bg-amber-100 text-amber-800 hover:bg-amber-200";
        else if (esHoy) cls = "bg-stone-200 text-stone-900";
        else if (esFuturo) cls = "bg-stone-50 text-stone-400 hover:bg-stone-100";

        return (
          <Link
            key={d.dia}
            href={`/planes/mio/${d.dia}`}
            className={`${baseCls} ${cls}`}
            title={
              d.leido
                ? `Día ${d.dia} · leído`
                : esSiguiente
                  ? `Día ${d.dia} · próximo`
                  : esAtrasado
                    ? `Día ${d.dia} · atrasado`
                    : `Día ${d.dia}`
            }
          >
            {d.leido ? <Check className="size-4" aria-hidden /> : <span>{d.dia}</span>}
          </Link>
        );
      })}
    </div>
  );
}

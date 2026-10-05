import type { CeldaHeatmap } from "@/lib/estadisticas";

interface Props {
  celdas: CeldaHeatmap[];
}

const NIVELES: Array<{ min: number; cls: string }> = [
  { min: 0, cls: "bg-stone-100" },
  { min: 1, cls: "bg-emerald-200" },
  { min: 2, cls: "bg-emerald-400" },
  { min: 4, cls: "bg-emerald-600" },
  { min: 6, cls: "bg-emerald-800" },
];

function nivel(count: number): string {
  let cls = NIVELES[0].cls;
  for (const n of NIVELES) {
    if (count >= n.min) cls = n.cls;
  }
  return cls;
}

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function Heatmap({ celdas }: Props) {
  // Agrupamos por semanas. Cada semana es columna; cada día es fila (lun..dom).
  // Calculamos primero el día de la semana de la primera fecha.
  if (celdas.length === 0) return null;

  const primeraFecha = new Date(celdas[0].fecha + "T00:00:00Z");
  const diaSemanaInicio = (primeraFecha.getUTCDay() + 6) % 7; // 0=lun..6=dom

  // Padding al inicio para alinear lunes
  const conPadding: Array<CeldaHeatmap | null> = [
    ...Array(diaSemanaInicio).fill(null),
    ...celdas,
  ];
  // Rellenar al final hasta múltiplo de 7
  while (conPadding.length % 7 !== 0) conPadding.push(null);

  const semanas: Array<Array<CeldaHeatmap | null>> = [];
  for (let i = 0; i < conPadding.length; i += 7) {
    semanas.push(conPadding.slice(i, i + 7));
  }

  // Etiquetas de mes (mostrar cuando cambia el mes en la primer fila de cada semana)
  let mesActual = -1;
  const etiquetasMes: Array<string | null> = semanas.map((sem) => {
    const primerCelda = sem.find((c) => c != null);
    if (!primerCelda) return null;
    const m = new Date(primerCelda.fecha + "T00:00:00Z").getUTCMonth();
    if (m !== mesActual) {
      mesActual = m;
      return MESES[m];
    }
    return null;
  });

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 p-2">
        {/* Etiquetas de mes */}
        <div className="ml-6 flex gap-[2px]">
          {etiquetasMes.map((m, i) => (
            <div key={i} className="w-[10px] text-[9px] font-medium uppercase text-stone-400">
              {m ?? ""}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {/* Etiquetas de día (L, M, V) */}
          <div className="flex flex-col gap-[2px] py-[1px] text-[9px] text-stone-400">
            {["L", "", "M", "", "V", "", ""].map((d, i) => (
              <div key={i} className="h-[10px] w-3 leading-[10px]">
                {d}
              </div>
            ))}
          </div>
          {/* Grid */}
          <div className="flex gap-[2px]">
            {semanas.map((sem, i) => (
              <div key={i} className="flex flex-col gap-[2px]">
                {sem.map((c, j) => (
                  <div
                    key={j}
                    className={`size-[10px] rounded-sm ${c ? nivel(c.count) : "bg-transparent"}`}
                    title={c ? `${c.fecha}: ${c.count} entrada${c.count === 1 ? "" : "s"}` : ""}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Leyenda */}
        <div className="ml-6 mt-2 flex items-center gap-1 text-[10px] text-stone-500">
          <span>Menos</span>
          {NIVELES.map((n, i) => (
            <div key={i} className={`size-[10px] rounded-sm ${n.cls}`} />
          ))}
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}

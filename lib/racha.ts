// Calcula la racha del usuario — días consecutivos con al menos una entrada
// en el diario (cualquier modo: estado, lectura, conversación, plan).
//
// La racha "actual" termina HOY o AYER (si no leyó hoy todavía).
// Si tampoco leyó ayer → racha actual = 0 (rota).
//
// La racha "mejor" es la máxima histórica.

import { prisma } from "@/lib/db/prisma";

export interface Racha {
  actual: number;
  mejor: number;
  ultimoDia: Date | null;
  /** Si tiene racha pero hoy todavía no leyó (oportunidad de mantenerla). */
  pendienteHoy: boolean;
}

function aFechaLocal(d: Date): string {
  // YYYY-MM-DD en tz local del server. Las entradas se guardan con `fecha` DATE.
  return d.toISOString().slice(0, 10);
}

function restarDias(yyyymmdd: string, dias: number): string {
  const d = new Date(yyyymmdd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

export async function calcularRacha(usuarioId: string): Promise<Racha> {
  // Traemos TODAS las fechas distintas con entrada del usuario, descendente.
  // Para diarios muy grandes (>10k entradas) podríamos paginar, pero
  // realísticamente nadie tiene más de unas centenas de días.
  const rows = await prisma.$queryRaw<Array<{ fecha: Date }>>`
    SELECT DISTINCT fecha
    FROM entradas
    WHERE usuario_id = ${usuarioId}::uuid
    ORDER BY fecha DESC
  `;
  if (rows.length === 0) {
    return { actual: 0, mejor: 0, ultimoDia: null, pendienteHoy: true };
  }

  const fechas = rows.map((r) => aFechaLocal(r.fecha));
  const setFechas = new Set(fechas);
  const hoy = aFechaLocal(new Date());
  const ayer = restarDias(hoy, 1);
  const ultimoDia = new Date(fechas[0] + "T00:00:00Z");

  // Racha actual: contar hacia atrás desde hoy o ayer (lo más nuevo que tenga)
  let actual = 0;
  let cursor = setFechas.has(hoy) ? hoy : setFechas.has(ayer) ? ayer : null;
  while (cursor && setFechas.has(cursor)) {
    actual++;
    cursor = restarDias(cursor, 1);
  }

  // Mejor racha: iteramos la lista ordenada DESC y contamos secuencias
  let mejor = 0;
  let run = 0;
  let anterior: string | null = null;
  // Iteramos ASCendente para facilidad
  const asc = [...fechas].reverse();
  for (const f of asc) {
    if (anterior && restarDias(f, 1) === anterior) {
      run++;
    } else {
      run = 1;
    }
    if (run > mejor) mejor = run;
    anterior = f;
  }
  if (actual > mejor) mejor = actual;

  const pendienteHoy = !setFechas.has(hoy);

  return { actual, mejor, ultimoDia, pendienteHoy };
}

/** Versión liviana solo para mostrar el número en el header. */
export async function rachaActual(usuarioId: string): Promise<number> {
  const r = await calcularRacha(usuarioId);
  return r.actual;
}

// Helpers transversales (formato, fechas, slugs).

/**
 * Devuelve la fecha "hoy" en zona local como `YYYY-MM-DD`.
 * Útil para la columna `fecha` de rotación diaria.
 */
export function hoyISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Serializa BigInt para respuestas JSON (Prisma usa BigInt para versículos).
 * `JSON.stringify(obj, replacerBigInt)`.
 */
export function replacerBigInt(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

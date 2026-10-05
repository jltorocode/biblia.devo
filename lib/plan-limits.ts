// Limites por plan. La regla de negocio vive aca, en un solo lugar.

export const LIMITES = {
  FREE: {
    guardados: 20,
    historialDias: 90,
    entradasPorDia: 1,
  },
  PREMIUM: {
    guardados: Number.POSITIVE_INFINITY,
    historialDias: Number.POSITIVE_INFINITY,
    entradasPorDia: Number.POSITIVE_INFINITY,
  },
} as const;

export type Plan = keyof typeof LIMITES;

export function planDeUsuario(premiumHasta: Date | null | undefined): Plan {
  if (!premiumHasta) return "FREE";
  return premiumHasta.getTime() > Date.now() ? "PREMIUM" : "FREE";
}

export function limite(plan: Plan, recurso: keyof typeof LIMITES.FREE): number {
  return LIMITES[plan][recurso];
}

export function excedeLimite(
  plan: Plan,
  recurso: keyof typeof LIMITES.FREE,
  cantidadActual: number,
): boolean {
  return cantidadActual >= limite(plan, recurso);
}

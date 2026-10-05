import { describe, it, expect } from "vitest";
import { planDeUsuario, excedeLimite, limite, LIMITES } from "@/lib/plan-limits";

describe("planDeUsuario", () => {
  it("sin premium_hasta → FREE", () => {
    expect(planDeUsuario(null)).toBe("FREE");
    expect(planDeUsuario(undefined)).toBe("FREE");
  });

  it("premium_hasta en el futuro → PREMIUM", () => {
    const futuro = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(planDeUsuario(futuro)).toBe("PREMIUM");
  });

  it("premium_hasta en el pasado → FREE", () => {
    const pasado = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(planDeUsuario(pasado)).toBe("FREE");
  });
});

describe("excedeLimite", () => {
  it("FREE + 19 guardados → no excede", () => {
    expect(excedeLimite("FREE", "guardados", 19)).toBe(false);
  });

  it("FREE + 20 guardados → excede (limite es inclusivo)", () => {
    expect(excedeLimite("FREE", "guardados", LIMITES.FREE.guardados)).toBe(true);
  });

  it("PREMIUM siempre acepta", () => {
    expect(excedeLimite("PREMIUM", "guardados", 9999)).toBe(false);
  });
});

describe("limite", () => {
  it("FREE.guardados es 20", () => {
    expect(limite("FREE", "guardados")).toBe(20);
  });
  it("PREMIUM.guardados es infinito", () => {
    expect(limite("PREMIUM", "guardados")).toBe(Number.POSITIVE_INFINITY);
  });
  it("FREE.historialDias es 90", () => {
    expect(limite("FREE", "historialDias")).toBe(90);
  });
});

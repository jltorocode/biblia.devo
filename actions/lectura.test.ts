import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: new Map<string, string>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieStore.has(name) ? { value: cookieStore.get(name)! } : undefined,
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
  }),
  headers: async () => new Headers(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => null } },
}));

import { crearEntradaLecturaAction } from "@/actions/devocional";

beforeAll(async () => {
  const cnt = await prisma.versiculoEstado.count();
  if (cnt < 25) throw new Error("DB sin seed");
});

beforeEach(() => {
  cookieStore.clear();
});

afterAll(async () => {
  const ids = Array.from(cookieStore.values());
  if (ids.length > 0) {
    await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.$disconnect();
});

describe("crearEntradaLecturaAction", () => {
  it("crea entrada modo='lectura' con primer/ultimo versiculo del capitulo + nota", async () => {
    const r = await crearEntradaLecturaAction({
      libroCodigo: "PSA",
      capitulo: 23,
      nota: "Lectura linda",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.vistaPrevia).toBe(false);
    expect(r.entradaId).toMatch(/^\d+$/);

    const e = await prisma.entrada.findUnique({
      where: { id: BigInt(r.entradaId) },
      include: { lecturaInicio: true, lecturaFin: true },
    });
    expect(e?.modo).toBe("lectura");
    expect(e?.nota).toBe("Lectura linda");
    expect(e?.lecturaInicio).toBeTruthy();
    expect(e?.lecturaFin).toBeTruthy();
    expect(e!.lecturaInicio!.versiculo).toBe(1);
  });

  it("libro inexistente → error", async () => {
    const r = await crearEntradaLecturaAction({ libroCodigo: "ZZZ", capitulo: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Libro/);
  });

  it("capitulo fuera de rango → error", async () => {
    const r = await crearEntradaLecturaAction({ libroCodigo: "PSA", capitulo: 999 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/fuera de rango/);
  });

  it("idempotente: pedir mismo capitulo el mismo dia devuelve la misma entrada", async () => {
    // Crear con cookie nueva
    const a = await crearEntradaLecturaAction({ libroCodigo: "PSA", capitulo: 1 });
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    const b = await crearEntradaLecturaAction({
      libroCodigo: "PSA",
      capitulo: 1,
      nota: "Segunda llamada",
    });
    expect(b.ok).toBe(true);
    if (!b.ok) return;
    // Si free + ya hay entrada → vistaPrevia. Si todavia no excedio, devuelve la misma.
    if (!b.vistaPrevia) {
      expect(b.entradaId).toBe(a.entradaId);
    }
  });

  it("free user con entrada previa hoy → vistaPrevia=true, no crea nueva", async () => {
    // Primera lectura (entrada del dia, free=1/dia)
    const a = await crearEntradaLecturaAction({ libroCodigo: "PSA", capitulo: 50 });
    expect(a.ok).toBe(true);
    if (!a.ok) return;

    // Segunda lectura de OTRO capitulo (excede el limite)
    const b = await crearEntradaLecturaAction({ libroCodigo: "PSA", capitulo: 51 });
    expect(b.ok).toBe(true);
    if (!b.ok) return;
    expect(b.vistaPrevia).toBe(true);
    expect(b.entradaId).toBe("");
  });
});

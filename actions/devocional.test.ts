import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";

// Mocks de next/headers + better-auth antes de importar la action.
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
  auth: {
    api: {
      getSession: async () => null,
    },
  },
}));

import { pedirVersiculoAction } from "@/actions/devocional";

beforeAll(async () => {
  const cnt = await prisma.versiculoEstado.count();
  if (cnt < 25) throw new Error("DB sin seed. Corre npm run db:seed primero.");
});

beforeEach(() => {
  cookieStore.clear();
});

afterAll(async () => {
  // Limpieza: borra todos los anonimos que esta suite haya creado via cookie.
  const ids = Array.from(cookieStore.values());
  if (ids.length > 0) {
    await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.$disconnect();
});

describe("pedirVersiculoAction", () => {
  it("retorna versiculo + datos del estado para un slug valido", async () => {
    const r = await pedirVersiculoAction({ estadoSlug: "ansioso" });

    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(r.data.estado.slug).toBe("ansioso");
    expect(r.data.estado.emoji).toBeTruthy();
    expect(r.data.fraseAliento).toContain("Dios");
    expect(r.data.libro.codigo).toBeTruthy();
    expect(r.data.versiculo.texto.length).toBeGreaterThan(10);
    expect(typeof r.data.versiculo.id).toBe("string"); // serializado
    expect(r.data.versionCodigo).toBe("rv1909");
  });

  it("guarda la cookie anonima la primera vez", async () => {
    await pedirVersiculoAction({ estadoSlug: "triste" });
    expect(cookieStore.has("devo_uid")).toBe(true);
    const uid = cookieStore.get("devo_uid")!;
    expect(uid).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("misma cookie + mismo estado + mismo dia → mismo versiculo", async () => {
    const a = await pedirVersiculoAction({ estadoSlug: "ansioso" });
    const b = await pedirVersiculoAction({ estadoSlug: "ansioso" });
    if (!a.ok || !b.ok) throw new Error("Una de las acciones fallo");
    expect(b.data.versiculo.id).toBe(a.data.versiculo.id);
  });

  it("estado invalido → ok:false", async () => {
    const r = await pedirVersiculoAction({ estadoSlug: "no_existe" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/invalido/);
  });

  it("cookie con UUID inexistente → crea usuario nuevo y sigue", async () => {
    cookieStore.set("devo_uid", "00000000-0000-0000-0000-000000000000");
    const r = await pedirVersiculoAction({ estadoSlug: "general" });
    expect(r.ok).toBe(true);
    // Debe haber reescrito la cookie con un UUID valido
    expect(cookieStore.get("devo_uid")).not.toBe("00000000-0000-0000-0000-000000000000");
  });
});

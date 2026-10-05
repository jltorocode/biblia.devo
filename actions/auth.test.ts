import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";

// Cookie + headers mock compartido.
const { cookieStore, sesionMock } = vi.hoisted(() => ({
  cookieStore: new Map<string, string>(),
  sesionMock: { actual: null as null | { user?: { id?: string } } },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieStore.has(name) ? { value: cookieStore.get(name)! } : undefined,
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  }),
  headers: async () => new Headers(),
}));

// Mock de better-auth: signUpEmail crea un usuario en DB,
// signInEmail busca por email.
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: async () => sesionMock.actual,
      signUpEmail: async ({
        body,
      }: {
        body: { email: string; password: string; name?: string };
      }) => {
        // Falla si ya existe (simula la collision real)
        const existe = await prisma.usuario.findUnique({ where: { email: body.email } });
        if (existe) throw new Error("User already exists");
        const u = await prisma.usuario.create({
          data: { email: body.email, nombre: body.name ?? null },
          select: { id: true, email: true },
        });
        return { user: { id: u.id, email: u.email } };
      },
      signInEmail: async ({ body }: { body: { email: string; password: string } }) => {
        const u = await prisma.usuario.findUnique({ where: { email: body.email } });
        if (!u) throw new Error("Invalid credentials");
        // Pretendemos credencial valida (mock — no chequea password real).
        return { user: { id: u.id, email: u.email } };
      },
      signOut: async () => ({ success: true }),
    },
  },
}));

import { signUpAction, signInAction } from "@/actions/auth";

const emailsCreados = new Set<string>();
function nuevoEmail(): string {
  const e = `auth-test-${Date.now()}-${Math.random()}@local.test`;
  emailsCreados.add(e);
  return e;
}

beforeAll(async () => {
  const cnt = await prisma.estadoAnimo.count();
  if (cnt < 1) throw new Error("DB sin seed");
});

beforeEach(() => {
  cookieStore.clear();
  sesionMock.actual = null;
});

afterAll(async () => {
  if (emailsCreados.size > 0) {
    await prisma.usuario.deleteMany({
      where: { email: { in: Array.from(emailsCreados) } },
    });
  }
  await prisma.$disconnect();
});

describe("signUpAction", () => {
  it("crea cuenta nueva con email valido", async () => {
    const email = nuevoEmail();
    const r = await signUpAction({ email, password: "minimo8caracteres", nombre: "Juan" });
    expect(r.ok).toBe(true);
    const creado = await prisma.usuario.findUnique({ where: { email } });
    expect(creado?.nombre).toBe("Juan");
  });

  it("email duplicado → mensaje claro", async () => {
    const email = nuevoEmail();
    await signUpAction({ email, password: "minimo8caracteres" });
    const r2 = await signUpAction({ email, password: "minimo8caracteres" });
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toMatch(/Ya existe/);
  });

  it("password corta → validacion fallida", async () => {
    const r = await signUpAction({ email: nuevoEmail(), password: "corta" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/8/);
  });

  it("email invalido → validacion fallida", async () => {
    const r = await signUpAction({ email: "no-es-email", password: "minimo8caracteres" });
    expect(r.ok).toBe(false);
  });
});

describe("signInAction", () => {
  it("usuario existente → ok", async () => {
    const email = nuevoEmail();
    await signUpAction({ email, password: "minimo8caracteres" });
    const r = await signInAction({ email, password: "minimo8caracteres" });
    expect(r.ok).toBe(true);
  });

  it("usuario inexistente → credenciales invalidas", async () => {
    const r = await signInAction({
      email: "no-existe@local.test",
      password: "minimo8caracteres",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/invalidas/);
  });

  it("migra datos anonimos al registrarse con cookie devo_uid presente", async () => {
    // Setup: crear un usuario anonimo (sin email) y dejar su id en la cookie.
    const anon = await prisma.usuario.create({
      data: { nombre: "anon" },
      select: { id: true },
    });
    cookieStore.set("devo_uid", anon.id);

    // Crear una entrada antes de migrar.
    const estado = await prisma.estadoAnimo.findFirst();
    const ve = await prisma.versiculoEstado.findFirst({ where: { estadoId: estado!.id } });
    await prisma.entrada.create({
      data: {
        usuarioId: anon.id,
        modo: "estado",
        fecha: new Date(),
        estadoId: estado!.id,
        versiculoId: ve!.versiculoId,
      },
    });

    const email = nuevoEmail();
    const r = await signUpAction({ email, password: "minimo8caracteres" });
    expect(r.ok).toBe(true);

    const final = await prisma.usuario.findUnique({ where: { email } });
    const entradasMigradas = await prisma.entrada.count({ where: { usuarioId: final!.id } });
    expect(entradasMigradas).toBe(1);

    const anonStill = await prisma.usuario.findUnique({ where: { id: anon.id } });
    expect(anonStill).toBeNull();
  });
});

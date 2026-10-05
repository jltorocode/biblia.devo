import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { pedirVersiculo } from "@/lib/rotacion";

// Crea un usuario anonimo de test. Cleanup via cascade al borrar el usuario.
async function crearUsuarioTest(): Promise<string> {
  const u = await prisma.usuario.create({ data: {} });
  usuariosCreados.push(u.id);
  return u.id;
}

const usuariosCreados: string[] = [];

afterAll(async () => {
  if (usuariosCreados.length > 0) {
    await prisma.usuario.deleteMany({ where: { id: { in: usuariosCreados } } });
  }
  await prisma.$disconnect();
});

beforeAll(async () => {
  // Sanity: la DB tiene que estar seedeada.
  const cnt = await prisma.versiculoEstado.count();
  if (cnt < 25) {
    throw new Error(
      `Faltan datos. Corre 'npm run db:seed' antes de los tests de rotacion (hay ${cnt} clasificaciones).`,
    );
  }
});

describe("pedirVersiculo — rotacion diaria", () => {
  it("mismo dia + mismo estado → retorna el MISMO versiculo", async () => {
    const u = await crearUsuarioTest();
    const v1 = await pedirVersiculo(u, "ansioso", { hoy: "2026-05-16" });
    const v2 = await pedirVersiculo(u, "ansioso", { hoy: "2026-05-16" });
    expect(v2.versiculo.id).toBe(v1.versiculo.id);
  });

  it("dia siguiente → avanza al siguiente versiculo", async () => {
    const u = await crearUsuarioTest();
    const dia1 = await pedirVersiculo(u, "ansioso", { hoy: "2026-05-16" });
    const dia2 = await pedirVersiculo(u, "ansioso", { hoy: "2026-05-17" });
    expect(dia2.versiculo.id).not.toBe(dia1.versiculo.id);
  });

  it("usuario nuevo → arranca en el versiculo mas relevante (indice 0)", async () => {
    const u = await crearUsuarioTest();
    const estado = await prisma.estadoAnimo.findUniqueOrThrow({ where: { slug: "ansioso" } });
    const masRelevante = await prisma.versiculoEstado.findFirstOrThrow({
      where: { estadoId: estado.id },
      orderBy: [{ relevancia: "desc" }, { id: "asc" }],
      select: { versiculoId: true },
    });
    const resp = await pedirVersiculo(u, "ansioso", { hoy: "2026-05-16" });
    expect(resp.versiculo.id).toBe(masRelevante.versiculoId);
  });

  it("estados distintos → indices independientes", async () => {
    const u = await crearUsuarioTest();
    const ansioso = await pedirVersiculo(u, "ansioso", { hoy: "2026-05-16" });
    const triste = await pedirVersiculo(u, "triste", { hoy: "2026-05-16" });
    expect(ansioso.estado.slug).toBe("ansioso");
    expect(triste.estado.slug).toBe("triste");
    // Ambos deben corresponder al indice 0 de su propia lista (sin contaminacion)
    const rot = await prisma.rotacionUsuario.findMany({
      where: { usuarioId: u },
      select: { ultimoIndice: true },
    });
    expect(rot.every((r) => r.ultimoIndice === 0)).toBe(true);
  });

  it("rotacion avanza dia a dia (no repite versiculo en dias consecutivos)", async () => {
    const u = await crearUsuarioTest();
    const dia0 = new Date("2026-01-01");
    const vistos = new Set<string>();

    // Probamos 10 dias seguidos — todos deben ser distintos
    for (let i = 0; i < 10; i++) {
      const d = new Date(dia0);
      d.setUTCDate(d.getUTCDate() + i);
      const r = await pedirVersiculo(u, "general", { hoy: d.toISOString().slice(0, 10) });
      vistos.add(r.versiculo.id.toString());
    }

    expect(vistos.size).toBe(10);
  });

  it("crea una entrada del diario por dia/estado (idempotente)", async () => {
    const u = await crearUsuarioTest();
    await pedirVersiculo(u, "ansioso", { hoy: "2026-05-16" });
    await pedirVersiculo(u, "ansioso", { hoy: "2026-05-16" }); // mismo dia → idempotente
    await pedirVersiculo(u, "ansioso", { hoy: "2026-05-17" });
    const filas = await prisma.entrada.count({
      where: { usuarioId: u, modo: "estado" },
    });
    expect(filas).toBe(2);
  });

  it("estado desconocido lanza error", async () => {
    const u = await crearUsuarioTest();
    await expect(
      pedirVersiculo(u, "estado_inexistente", { hoy: "2026-05-16" }),
    ).rejects.toThrow(/Estado desconocido/);
  });
});

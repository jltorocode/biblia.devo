import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  contarEntradasHoy,
  entradaEstadoHoy,
  entradasDelDia,
  obtenerOCrearEntradaEstado,
  actualizarNota,
} from "./entradas";

const usuariosCreados: string[] = [];

async function crearUsuario(): Promise<string> {
  const u = await prisma.usuario.create({
    data: { email: `entradas-${Date.now()}-${Math.random()}@local.test`, nombre: "T" },
    select: { id: true },
  });
  usuariosCreados.push(u.id);
  return u.id;
}

beforeAll(async () => {
  const cnt = await prisma.versiculoEstado.count();
  if (cnt < 25) throw new Error("DB sin seed");
});

afterAll(async () => {
  if (usuariosCreados.length > 0) {
    await prisma.usuario.deleteMany({ where: { id: { in: usuariosCreados } } });
  }
  await prisma.$disconnect();
});

describe("obtenerOCrearEntradaEstado", () => {
  it("crea entrada nueva la primera vez", async () => {
    const usuarioId = await crearUsuario();
    const estado = await prisma.estadoAnimo.findUnique({ where: { slug: "ansioso" } });
    const ve = await prisma.versiculoEstado.findFirst({ where: { estadoId: estado!.id } });

    const { entrada, creada } = await obtenerOCrearEntradaEstado({
      usuarioId,
      estadoId: estado!.id,
      versiculoId: ve!.versiculoId,
      hoy: "2026-05-18",
    });
    expect(creada).toBe(true);
    expect(entrada.modo).toBe("estado");
    expect(entrada.estadoId).toBe(estado!.id);
  });

  it("devuelve la misma entrada al pedir mismo dia/estado", async () => {
    const usuarioId = await crearUsuario();
    const estado = await prisma.estadoAnimo.findUnique({ where: { slug: "ansioso" } });
    const ve = await prisma.versiculoEstado.findFirst({ where: { estadoId: estado!.id } });

    const r1 = await obtenerOCrearEntradaEstado({
      usuarioId,
      estadoId: estado!.id,
      versiculoId: ve!.versiculoId,
      hoy: "2026-05-19",
    });
    const r2 = await obtenerOCrearEntradaEstado({
      usuarioId,
      estadoId: estado!.id,
      versiculoId: ve!.versiculoId,
      hoy: "2026-05-19",
    });
    expect(r1.creada).toBe(true);
    expect(r2.creada).toBe(false);
    expect(r2.entrada.id).toBe(r1.entrada.id);
  });

  it("dias distintos generan entradas distintas", async () => {
    const usuarioId = await crearUsuario();
    const estado = await prisma.estadoAnimo.findUnique({ where: { slug: "triste" } });
    const ve = await prisma.versiculoEstado.findFirst({ where: { estadoId: estado!.id } });

    const a = await obtenerOCrearEntradaEstado({
      usuarioId,
      estadoId: estado!.id,
      versiculoId: ve!.versiculoId,
      hoy: "2026-05-20",
    });
    const b = await obtenerOCrearEntradaEstado({
      usuarioId,
      estadoId: estado!.id,
      versiculoId: ve!.versiculoId,
      hoy: "2026-05-21",
    });
    expect(a.entrada.id).not.toBe(b.entrada.id);
  });
});

describe("contarEntradasHoy", () => {
  it("cuenta entradas del dia indicado, sin importar estado", async () => {
    const usuarioId = await crearUsuario();
    const ansioso = await prisma.estadoAnimo.findUnique({ where: { slug: "ansioso" } });
    const triste = await prisma.estadoAnimo.findUnique({ where: { slug: "triste" } });
    const veA = await prisma.versiculoEstado.findFirst({ where: { estadoId: ansioso!.id } });
    const veT = await prisma.versiculoEstado.findFirst({ where: { estadoId: triste!.id } });

    expect(await contarEntradasHoy(usuarioId, "2026-05-22")).toBe(0);
    await obtenerOCrearEntradaEstado({
      usuarioId,
      estadoId: ansioso!.id,
      versiculoId: veA!.versiculoId,
      hoy: "2026-05-22",
    });
    expect(await contarEntradasHoy(usuarioId, "2026-05-22")).toBe(1);
    await obtenerOCrearEntradaEstado({
      usuarioId,
      estadoId: triste!.id,
      versiculoId: veT!.versiculoId,
      hoy: "2026-05-22",
    });
    expect(await contarEntradasHoy(usuarioId, "2026-05-22")).toBe(2);
  });
});

describe("actualizarNota", () => {
  it("actualiza la nota; trim y null si vacio", async () => {
    const usuarioId = await crearUsuario();
    const estado = await prisma.estadoAnimo.findUnique({ where: { slug: "general" } });
    const ve = await prisma.versiculoEstado.findFirst({ where: { estadoId: estado!.id } });
    const { entrada } = await obtenerOCrearEntradaEstado({
      usuarioId,
      estadoId: estado!.id,
      versiculoId: ve!.versiculoId,
      hoy: "2026-05-23",
    });

    const r1 = await actualizarNota({ entradaId: entrada.id, usuarioId, nota: "  Mi reflexion  " });
    expect(r1.ok).toBe(true);
    const after1 = await prisma.entrada.findUnique({ where: { id: entrada.id } });
    expect(after1?.nota).toBe("Mi reflexion");

    await actualizarNota({ entradaId: entrada.id, usuarioId, nota: "   " });
    const after2 = await prisma.entrada.findUnique({ where: { id: entrada.id } });
    expect(after2?.nota).toBeNull();
  });

  it("no actualiza si la entrada no pertenece al usuario", async () => {
    const dueno = await crearUsuario();
    const intruso = await crearUsuario();
    const estado = await prisma.estadoAnimo.findUnique({ where: { slug: "general" } });
    const ve = await prisma.versiculoEstado.findFirst({ where: { estadoId: estado!.id } });
    const { entrada } = await obtenerOCrearEntradaEstado({
      usuarioId: dueno,
      estadoId: estado!.id,
      versiculoId: ve!.versiculoId,
      hoy: "2026-05-24",
    });

    const r = await actualizarNota({ entradaId: entrada.id, usuarioId: intruso, nota: "hack" });
    expect(r.ok).toBe(false);
    const after = await prisma.entrada.findUnique({ where: { id: entrada.id } });
    expect(after?.nota).toBeNull();
  });
});

describe("entradasDelDia", () => {
  it("trae todas las del dia con estado + versiculo + libro", async () => {
    const usuarioId = await crearUsuario();
    const estado = await prisma.estadoAnimo.findUnique({ where: { slug: "ansioso" } });
    const ve = await prisma.versiculoEstado.findFirst({ where: { estadoId: estado!.id } });
    await obtenerOCrearEntradaEstado({
      usuarioId,
      estadoId: estado!.id,
      versiculoId: ve!.versiculoId,
      hoy: "2026-05-25",
    });

    const lista = await entradasDelDia(usuarioId, "2026-05-25");
    expect(lista.length).toBe(1);
    expect(lista[0]!.estado!.slug).toBe("ansioso");
    expect(lista[0]!.versiculo!.libro.nombre).toBeTruthy();
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { aplicarSuscripcion } from "@/lib/payments/aplicar-suscripcion";

const usuariosCreados: string[] = [];

async function crearUsuarioConEmail(email: string): Promise<string> {
  const u = await prisma.usuario.create({
    data: { email, nombre: "Tester pagos" },
    select: { id: true },
  });
  usuariosCreados.push(u.id);
  return u.id;
}

afterAll(async () => {
  if (usuariosCreados.length > 0) {
    await prisma.usuario.deleteMany({ where: { id: { in: usuariosCreados } } });
  }
  await prisma.$disconnect();
});

beforeAll(async () => {
  await prisma.versiculoEstado.count(); // sanity
});

describe("aplicarSuscripcion", () => {
  it("activada → premium_hasta = periodEnd, suscripcion 'active'", async () => {
    const usuarioId = await crearUsuarioConEmail(`pago-${Date.now()}@local.test`);
    const periodStart = new Date("2026-05-01T00:00:00Z");
    const periodEnd = new Date("2026-06-01T00:00:00Z");

    await aplicarSuscripcion({
      provider: "stripe",
      externalId: `sub_test_${usuarioId}`,
      evento: "activada",
      usuarioId,
      plan: "premium_mensual",
      periodStart,
      periodEnd,
      cancelAtPeriodEnd: false,
      customerId: "cus_test",
    });

    const u = await prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: {
        premiumHasta: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        paymentProvider: true,
      },
    });
    expect(u.premiumHasta?.toISOString()).toBe(periodEnd.toISOString());
    expect(u.stripeCustomerId).toBe("cus_test");
    expect(u.stripeSubscriptionId).toBe(`sub_test_${usuarioId}`);
    expect(u.paymentProvider).toBe("stripe");

    const sub = await prisma.suscripcion.findFirstOrThrow({
      where: { usuarioId, provider: "stripe" },
    });
    expect(sub.status).toBe("active");
    expect(sub.plan).toBe("premium_mensual");
  });

  it("cancelada con cancelAtPeriodEnd → mantiene premium hasta periodEnd", async () => {
    const usuarioId = await crearUsuarioConEmail(`pago-${Date.now()}-b@local.test`);
    const periodStart = new Date("2026-05-01T00:00:00Z");
    const periodEnd = new Date("2026-06-01T00:00:00Z");
    const externalId = `sub_cancel_${usuarioId}`;

    await aplicarSuscripcion({
      provider: "stripe",
      externalId,
      evento: "activada",
      usuarioId,
      plan: "premium_mensual",
      periodStart,
      periodEnd,
      cancelAtPeriodEnd: false,
    });
    await aplicarSuscripcion({
      provider: "stripe",
      externalId,
      evento: "cancelada",
      usuarioId,
      plan: "premium_mensual",
      periodStart,
      periodEnd,
      cancelAtPeriodEnd: true,
    });

    const u = await prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: { premiumHasta: true },
    });
    expect(u.premiumHasta?.toISOString()).toBe(periodEnd.toISOString());

    const sub = await prisma.suscripcion.findFirstOrThrow({
      where: { usuarioId, externalId },
    });
    expect(sub.status).toBe("canceled");
    expect(sub.cancelAtPeriodEnd).toBe(true);
  });

  it("expirada → premium_hasta = null", async () => {
    const usuarioId = await crearUsuarioConEmail(`pago-${Date.now()}-c@local.test`);
    const periodEnd = new Date("2026-06-01T00:00:00Z");
    const externalId = `sub_exp_${usuarioId}`;

    await aplicarSuscripcion({
      provider: "stripe",
      externalId,
      evento: "activada",
      usuarioId,
      plan: "premium_mensual",
      periodEnd,
      cancelAtPeriodEnd: false,
    });
    await aplicarSuscripcion({
      provider: "stripe",
      externalId,
      evento: "expirada",
      usuarioId,
      plan: "premium_mensual",
      periodEnd,
      cancelAtPeriodEnd: false,
    });

    const u = await prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: { premiumHasta: true },
    });
    expect(u.premiumHasta).toBeNull();
  });

  it("idempotente: reprocesar mismo (provider, externalId) actualiza en vez de duplicar", async () => {
    const usuarioId = await crearUsuarioConEmail(`pago-${Date.now()}-d@local.test`);
    const externalId = `sub_idem_${usuarioId}`;
    const periodEnd = new Date("2026-06-01T00:00:00Z");

    for (let i = 0; i < 3; i++) {
      await aplicarSuscripcion({
        provider: "stripe",
        externalId,
        evento: "activada",
        usuarioId,
        plan: "premium_mensual",
        periodEnd,
        cancelAtPeriodEnd: false,
      });
    }

    const cnt = await prisma.suscripcion.count({
      where: { provider: "stripe", externalId },
    });
    expect(cnt).toBe(1);
  });

  it("sin usuarioId → no rompe (skip)", async () => {
    await expect(
      aplicarSuscripcion({
        provider: "mercadopago",
        externalId: "huerfana",
        evento: "activada",
        plan: "premium_mensual",
        periodEnd: new Date(),
      }),
    ).resolves.toBeUndefined();
  });
});

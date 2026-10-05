import { afterEach, describe, expect, it, vi } from "vitest";

// Mockeamos el SDK de mercadopago: PreApproval.get devuelve datos
// configurables por test. Asi probamos el mapping status → evento.
const { preApprovalState } = vi.hoisted(() => ({
  preApprovalState: {
    devuelve: null as null | Record<string, unknown>,
  },
}));

vi.mock("mercadopago", () => {
  class MercadoPagoConfig {
    constructor(_opts: unknown) {
      void _opts;
    }
  }
  class PreApproval {
    constructor(_client: unknown) {
      void _client;
    }
    async get({ id }: { id: string }) {
      if (!preApprovalState.devuelve) throw new Error("test sin mock seteado");
      return { id, ...preApprovalState.devuelve };
    }
    async create() {
      throw new Error("no usado en tests");
    }
    async update() {
      throw new Error("no usado en tests");
    }
  }
  return { MercadoPagoConfig, PreApproval };
});

import { mercadopagoProvider } from "@/lib/payments/mercadopago";

afterEach(() => {
  preApprovalState.devuelve = null;
});

process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";

describe("mercadopagoProvider.parseWebhook", () => {
  it("body no parseable → evento desconocido", async () => {
    const r = await mercadopagoProvider.parseWebhook("no es json", {});
    expect(r.evento).toBe("desconocido");
    expect(r.provider).toBe("mercadopago");
  });

  it("notificacion no-preapproval → desconocido", async () => {
    const r = await mercadopagoProvider.parseWebhook(
      JSON.stringify({ type: "payment", data: { id: "X" } }),
      {},
    );
    expect(r.evento).toBe("desconocido");
  });

  it("preapproval authorized → activada", async () => {
    preApprovalState.devuelve = {
      status: "authorized",
      external_reference: "user-uuid|premium_mensual",
      date_created: "2026-05-01T00:00:00Z",
      next_payment_date: "2026-06-01T00:00:00Z",
    };
    const r = await mercadopagoProvider.parseWebhook(
      JSON.stringify({ type: "preapproval", data: { id: "sub_123" } }),
      {},
    );
    expect(r.evento).toBe("activada");
    expect(r.externalId).toBe("sub_123");
    expect(r.usuarioId).toBe("user-uuid");
    expect(r.plan).toBe("premium_mensual");
    expect(r.periodEnd?.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });

  it("preapproval cancelled → cancelada + cancelAtPeriodEnd true", async () => {
    preApprovalState.devuelve = {
      status: "cancelled",
      external_reference: "user-uuid|premium_anual",
    };
    const r = await mercadopagoProvider.parseWebhook(
      JSON.stringify({ type: "preapproval", data: { id: "sub_456" } }),
      {},
    );
    expect(r.evento).toBe("cancelada");
    expect(r.cancelAtPeriodEnd).toBe(true);
    expect(r.plan).toBe("premium_anual");
  });

  it("preapproval finished → expirada", async () => {
    preApprovalState.devuelve = {
      status: "finished",
      external_reference: "user-uuid|premium_mensual",
    };
    const r = await mercadopagoProvider.parseWebhook(
      JSON.stringify({ type: "preapproval", data: { id: "sub_789" } }),
      {},
    );
    expect(r.evento).toBe("expirada");
  });

  it("external_reference malformado → plan undefined pero no rompe", async () => {
    preApprovalState.devuelve = { status: "authorized", external_reference: "solo-uuid" };
    const r = await mercadopagoProvider.parseWebhook(
      JSON.stringify({ type: "preapproval", data: { id: "sub_X" } }),
      {},
    );
    expect(r.plan).toBeUndefined();
    expect(r.usuarioId).toBe("solo-uuid");
  });
});

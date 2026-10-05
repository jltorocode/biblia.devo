import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { _resetTransporter } from "@/lib/email";

// IDs creados por la suite; se limpian al final.
const usuariosCreados: string[] = [];

async function crearUsuarioConRecordatorio(opts: {
  email: string;
  hora: number; // 0-23 UTC
  nombre?: string;
}): Promise<string> {
  // hora_recordatorio es TIME(0). Construimos un string "HH:00:00".
  const hh = String(opts.hora).padStart(2, "0");
  const u = await prisma.usuario.create({
    data: {
      email: opts.email,
      nombre: opts.nombre ?? "Cron tester",
      horaRecordatorio: new Date(`1970-01-01T${hh}:00:00Z`),
    },
    select: { id: true },
  });
  usuariosCreados.push(u.id);
  return u.id;
}

beforeAll(async () => {
  const cnt = await prisma.versiculoEstado.count();
  if (cnt < 25) throw new Error("DB sin seed. Corre npm run db:seed primero.");
});

beforeEach(() => {
  vi.resetModules();
  _resetTransporter();
  // Forzamos jsonTransport ausente de SMTP_* y reseteamos.
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  process.env.CRON_SECRET = "test-secret";
});

afterAll(async () => {
  if (usuariosCreados.length > 0) {
    await prisma.usuario.deleteMany({ where: { id: { in: usuariosCreados } } });
  }
  await prisma.$disconnect();
});

async function importRoute() {
  // Importar tras setear env vars de cada test.
  return await import("./route");
}

describe("GET /api/cron/recordatorios", () => {
  it("rechaza sin auth", async () => {
    const { GET } = await importRoute();
    const res = await GET(new Request("http://x/api/cron/recordatorios?hora=10"));
    expect(res.status).toBe(401);
  });

  it("rechaza si CRON_SECRET no esta configurado", async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await importRoute();
    const res = await GET(
      new Request("http://x/api/cron/recordatorios?hora=10", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    expect(res.status).toBe(500);
  });

  it("envia recordatorio solo a usuarios con la hora coincidente", async () => {
    const hora = 7;
    const stamp = Date.now();
    const idMatch = await crearUsuarioConRecordatorio({
      email: `cron-match-${stamp}@local.test`,
      hora,
      nombre: "Match",
    });
    await crearUsuarioConRecordatorio({
      email: `cron-otro-${stamp}@local.test`,
      hora: (hora + 1) % 24,
      nombre: "Otro",
    });

    const { GET } = await importRoute();
    const res = await GET(
      new Request(`http://x/api/cron/recordatorios?hora=${hora}`, {
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      total: number;
      enviados: number;
      fallidos: number;
      resultados: Array<{ usuarioId: string; email: string; ok: boolean }>;
    };

    const incluido = body.resultados.find((r) => r.usuarioId === idMatch);
    expect(incluido, "el usuario match deberia estar en resultados").toBeTruthy();
    expect(incluido!.ok).toBe(true);
    // Ningun usuario de "otra hora" deberia aparecer.
    const tieneOtraHora = body.resultados.some((r) => r.email.startsWith("cron-otro-"));
    expect(tieneOtraHora).toBe(false);
  });

  it("hora invalida → 400", async () => {
    const { GET } = await importRoute();
    const res = await GET(
      new Request("http://x/api/cron/recordatorios?hora=99", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    expect(res.status).toBe(400);
  });
});

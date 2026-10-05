import { describe, it, expect } from "vitest";
import { validarEnv } from "./env";

const baseValida = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  BETTER_AUTH_SECRET: "0123456789abcdef0123456789abcdef",
  BETTER_AUTH_URL: "https://devocional.app",
  NEXT_PUBLIC_APP_URL: "https://devocional.app",
  CRON_SECRET: "0123456789abcdef",
  SMTP_HOST: "smtp.test",
  SMTP_PORT: "587",
  SMTP_USER: "devo",
  SMTP_PASS: "secret",
  SMTP_FROM: "Devocional <devo@test>",
} as unknown as NodeJS.ProcessEnv;

describe("validarEnv (production)", () => {
  it("acepta env completo", () => {
    const r = validarEnv(baseValida);
    expect(r.ok).toBe(true);
  });

  it("rechaza si falta CRON_SECRET", () => {
    const { CRON_SECRET: _drop, ...env } = baseValida;
    void _drop;
    const r = validarEnv(env as NodeJS.ProcessEnv);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join("\n")).toMatch(/CRON_SECRET/);
  });

  it("rechaza BETTER_AUTH_SECRET corto", () => {
    const r = validarEnv({ ...baseValida, BETTER_AUTH_SECRET: "corto" } as NodeJS.ProcessEnv);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join("\n")).toMatch(/BETTER_AUTH_SECRET/);
  });

  it("rechaza DATABASE_URL invalida", () => {
    const r = validarEnv({ ...baseValida, DATABASE_URL: "no-es-url" } as NodeJS.ProcessEnv);
    expect(r.ok).toBe(false);
  });
});

describe("validarEnv (desarrollo)", () => {
  it("acepta sin SMTP_* y sin CRON_SECRET", () => {
    const r = validarEnv({
      NODE_ENV: "development",
      DATABASE_URL: baseValida.DATABASE_URL,
      BETTER_AUTH_SECRET: baseValida.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: baseValida.BETTER_AUTH_URL,
      NEXT_PUBLIC_APP_URL: baseValida.NEXT_PUBLIC_APP_URL,
    } as NodeJS.ProcessEnv);
    expect(r.ok).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock de ioredis ANTES de importar el modulo bajo prueba.
const set = vi.fn(async () => "OK");
const get = vi.fn(async () => null as string | null);
const del = vi.fn(async () => 1);

vi.mock("ioredis", () => {
  // vi.fn con arrow no es construible; usamos una `function` real.
  function FakeRedis() {
    return { get, set, del, on: vi.fn() };
  }
  return { default: FakeRedis };
});

import { _resetRedis, buildSecondaryStorage, getRedis } from "./redis";

beforeEach(() => {
  _resetRedis();
  set.mockClear();
  get.mockClear();
  del.mockClear();
});

describe("getRedis", () => {
  it("devuelve null si no hay REDIS_URL", () => {
    delete process.env.REDIS_URL;
    expect(getRedis()).toBeNull();
  });

  it("crea cliente cuando REDIS_URL esta presente", () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    const r = getRedis();
    expect(r).not.toBeNull();
  });
});

describe("buildSecondaryStorage", () => {
  it("undefined si no hay REDIS_URL — better-auth no usa cache", () => {
    delete process.env.REDIS_URL;
    expect(buildSecondaryStorage()).toBeUndefined();
  });

  it("set con TTL usa EX", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    const ss = buildSecondaryStorage()!;
    await ss.set("session_abc", "payload", 3600);
    expect(set).toHaveBeenCalledWith("session_abc", "payload", "EX", 3600);
  });

  it("set sin TTL no usa EX", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    const ss = buildSecondaryStorage()!;
    await ss.set("k", "v");
    expect(set).toHaveBeenCalledWith("k", "v");
  });

  it("delete delega a del", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    const ss = buildSecondaryStorage()!;
    await ss.delete("k");
    expect(del).toHaveBeenCalledWith("k");
  });

  it("get propaga errores como null (no rompe la request)", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    get.mockRejectedValueOnce(new Error("conexion caida"));
    const ss = buildSecondaryStorage()!;
    const result = await ss.get("k");
    expect(result).toBeNull();
  });
});

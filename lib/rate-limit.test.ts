import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock de ioredis con un store en memoria que soporta multi/incr/expire/ttl.
const store = new Map<string, { val: number; expiresAt: number | null }>();
const now = 1_700_000_000_000; // ms

function nowSec() {
  return Math.floor(now / 1000);
}

function get(k: string) {
  const e = store.get(k);
  if (!e) return null;
  if (e.expiresAt && nowSec() > e.expiresAt) {
    store.delete(k);
    return null;
  }
  return e;
}

vi.mock("ioredis", () => {
  function FakeRedis() {
    const api = {
      on: vi.fn(),
      ttl: vi.fn(async (k: string) => {
        const e = get(k);
        if (!e) return -2;
        return e.expiresAt ? Math.max(0, e.expiresAt - nowSec()) : -1;
      }),
      multi: vi.fn(() => {
        const ops: Array<() => unknown> = [];
        const pipeline = {
          incr(k: string) {
            ops.push(() => {
              const e = get(k) ?? { val: 0, expiresAt: null };
              e.val += 1;
              store.set(k, e);
              return e.val;
            });
            return pipeline;
          },
          expire(k: string, sec: number, _mode: "NX") {
            void _mode;
            ops.push(() => {
              const e = store.get(k);
              if (!e) return 0;
              if (e.expiresAt !== null) return 0;
              e.expiresAt = nowSec() + sec;
              return 1;
            });
            return pipeline;
          },
          exec: async () => ops.map((fn) => [null, fn()] as [null, unknown]),
        };
        return pipeline;
      }),
    };
    return api;
  }
  return { default: FakeRedis };
});

import { _resetRedis } from "./redis";
import { rateLimit } from "./rate-limit";

beforeEach(() => {
  _resetRedis();
  store.clear();
  process.env.REDIS_URL = "redis://localhost:6379";
});

describe("rateLimit", () => {
  it("sin REDIS_URL deja pasar siempre", async () => {
    delete process.env.REDIS_URL;
    _resetRedis();
    const r = await rateLimit({ key: "k", limit: 3, windowSeconds: 60 });
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(3);
  });

  it("permite hasta `limit`, bloquea el siguiente", async () => {
    const opts = { key: "kuser", limit: 3, windowSeconds: 60 };
    const r1 = await rateLimit(opts);
    const r2 = await rateLimit(opts);
    const r3 = await rateLimit(opts);
    const r4 = await rateLimit(opts);
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r3.ok).toBe(true);
    expect(r3.remaining).toBe(0);
    expect(r4.ok).toBe(false);
  });

  it("keys distintas tienen contadores independientes", async () => {
    const optsA = { key: "a", limit: 2, windowSeconds: 60 };
    const optsB = { key: "b", limit: 2, windowSeconds: 60 };
    await rateLimit(optsA);
    await rateLimit(optsA);
    const blocked = await rateLimit(optsA);
    const fresh = await rateLimit(optsB);
    expect(blocked.ok).toBe(false);
    expect(fresh.ok).toBe(true);
  });
});

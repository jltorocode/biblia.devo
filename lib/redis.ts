import Redis from "ioredis";

/**
 * Cliente Redis singleton. Solo se inicializa si `REDIS_URL` esta definida.
 * Si no, `getRedis()` devuelve `null` y los consumidores deben tener fallback.
 */
let _redis: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    _redis = null;
    return null;
  }
  _redis = new Redis(url, {
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    // Si Redis se cae, no queremos colgar al usuario — fallar rapido.
    enableOfflineQueue: false,
  });
  _redis.on("error", (err) => {
    console.error("[redis] error", err.message);
  });
  return _redis;
}

/** Solo tests. */
export function _resetRedis() {
  _redis = undefined;
}

export type SecondaryStorageLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
};

/**
 * Adapter para `better-auth.secondaryStorage`. Cachea sesiones en Redis
 * con TTL en segundos. Si Redis no esta configurado o falla, no rompemos:
 * better-auth solo lo usa como cache, la fuente sigue siendo Postgres.
 */
export function buildSecondaryStorage(): SecondaryStorageLike | undefined {
  const r = getRedis();
  if (!r) return undefined;
  return {
    async get(key) {
      try {
        return await r.get(key);
      } catch (err) {
        console.error("[redis] get fallo", err);
        return null;
      }
    },
    async set(key, value, ttl) {
      try {
        if (ttl && ttl > 0) await r.set(key, value, "EX", ttl);
        else await r.set(key, value);
      } catch (err) {
        console.error("[redis] set fallo", err);
      }
    },
    async delete(key) {
      try {
        await r.del(key);
      } catch (err) {
        console.error("[redis] delete fallo", err);
      }
    },
  };
}

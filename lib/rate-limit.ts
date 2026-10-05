import { getRedis } from "@/lib/redis";

type Result = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
};

/**
 * Rate limit por ventana fija con Redis. Atomico vee INCR + EXPIRE.
 * Si Redis no esta configurado o falla, deja pasar (`ok: true, remaining: limit`)
 * — better-auth ya trae su propio rate limit como segunda linea de defensa.
 */
export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<Result> {
  const r = getRedis();
  if (!r) {
    return { ok: true, limit: opts.limit, remaining: opts.limit, resetSeconds: opts.windowSeconds };
  }
  try {
    const k = `rl:${opts.key}`;
    const [count] = (await r.multi().incr(k).expire(k, opts.windowSeconds, "NX").exec()) as Array<
      [Error | null, number]
    >;
    const current = (count?.[1] as number) ?? 0;
    const remaining = Math.max(0, opts.limit - current);
    const ttl = await r.ttl(k);
    return {
      ok: current <= opts.limit,
      limit: opts.limit,
      remaining,
      resetSeconds: ttl > 0 ? ttl : opts.windowSeconds,
    };
  } catch (err) {
    console.error("[rate-limit] redis fallo, dejando pasar", err);
    return { ok: true, limit: opts.limit, remaining: opts.limit, resetSeconds: opts.windowSeconds };
  }
}

/** Cabeceras estandar de rate limit. */
export function rateLimitHeaders(res: Result): HeadersInit {
  return {
    "X-RateLimit-Limit": String(res.limit),
    "X-RateLimit-Remaining": String(res.remaining),
    "X-RateLimit-Reset": String(res.resetSeconds),
  };
}

/**
 * Identificador del cliente para limitar. Prioriza Cloudflare → X-Forwarded-For
 * → fallback "anon" (cubre el caso degradado en que el proxy no llene headers).
 */
export function clientKey(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "anon"
  );
}

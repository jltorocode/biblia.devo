import { z } from "zod";

/**
 * Validacion de variables de entorno.
 *
 * En produccion la app cae con un error claro si falta algo critico.
 * En desarrollo y tests los valores opcionales se quedan sin definir y
 * los modulos que los usan tienen fallbacks (jsonTransport, etc).
 */
const baseSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET debe tener al menos 16 caracteres"),
  BETTER_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  // Opcional: si esta presente debe ser una URL valida.
  REDIS_URL: z.string().url().optional(),
});

// SMTP en prod es opcional — sin él los emails caen en jsonTransport (logueados,
// no enviados). `optionalStr` trata "" como undefined (.env puede tener vacíos).
// CRON_SECRET es obligatorio: el endpoint de cron devuelve 500 sin él.
const optionalStr = z.string().optional().transform((v) => (v && v.length > 0 ? v : undefined));
const prodSchema = baseSchema.extend({
  CRON_SECRET: z.string().min(16, "CRON_SECRET debe tener al menos 16 caracteres"),
  SMTP_HOST: optionalStr,
  SMTP_PORT: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  SMTP_USER: optionalStr,
  SMTP_PASS: optionalStr,
  SMTP_FROM: optionalStr,
});

export type Env = z.infer<typeof prodSchema>;

/**
 * Valida las env vars contra el schema correcto segun NODE_ENV.
 * Devuelve `{ ok, issues }`. No lanza — el caller decide si abortar.
 */
export function validarEnv(env: NodeJS.ProcessEnv = process.env) {
  const schema = env.NODE_ENV === "production" ? prodSchema : baseSchema;
  const parsed = schema.safeParse(env);
  if (parsed.success) return { ok: true as const, issues: [] as string[] };
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  return { ok: false as const, issues };
}

/**
 * Llamado en boot. En produccion, aborta el proceso con codigo 1 si algo falla.
 * Fuera de produccion solo emite un warning.
 */
export function assertEnvOrExit() {
  const { ok, issues } = validarEnv();
  if (ok) return;
  const header = "Configuracion invalida — revisa tu .env (o .env.production):";
  const body = issues.map((i) => `  • ${i}`).join("\n");
  if (process.env.NODE_ENV === "production") {
    // Lanzar en lugar de process.exit() — proceso muere igual y evita el
    // warning de Edge Runtime al bundlear instrumentation.ts.
    throw new Error(`${header}\n${body}`);
  }
  console.warn(`[env] ${header}\n${body}`);
}

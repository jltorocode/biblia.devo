@AGENTS.md

# Devocional App — estado del proyecto

App de versículos bíblicos según el estado de ánimo. Stack 100% open source / self-hostable.

## Stack

- Next.js 16.2.6 (App Router) · React 19 · TypeScript estricto · Tailwind CSS 4
- PostgreSQL 16 vía Docker (puerto **5433**, no 5432 — `contigo_postgres` ocupa el 5432)
- Prisma 6.19 + `@prisma/client`
- **better-auth** 1.6 (NO Clerk — el usuario quiere todo libre y tiene servidores propios)
- Stripe / MercadoPago / PayPal SDKs (sin keys configuradas aún)
- Vitest 4.x — 14 archivos / 97 tests verdes
- Biblia: Reina-Valera 1909 (dominio público, `scrollmapper/bible_databases`)

## Comandos

```bash
npm run db:up         # docker-compose up postgres (puerto 5433)
npm run db:migrate    # prisma migrate dev
npm run db:seed       # libros + Biblia + estados + clasificación
npm test              # vitest run
npm run dev           # NOTA: puerto 3000 está ocupado por otros proyectos del user
                      #       usar `npx next dev --port 3010`
npm run build         # next build
```

## Estado por fase

| Fase | Qué quedó | Estado |
|---|---|---|
| 1 — Cimientos | Schema · /api/health · estructura · 2 migraciones | ✓ |
| 2 — Biblia adentro | 66 libros · 31.102 versículos RV1909 · GIN tsvector | ✓ |
| 3 — Núcleo | 13 estados · clasificación (344 filas) · parser · rotación · action | ✓ |
| 4 — Frontend | Home · SelectorEstado · PantallaVersiculo · Compartir | ✓ |
| 5 — Cuenta | **better-auth** (sustituyó Clerk) · signup/signin · guardados · historial · ajustes · migración anónimo→registrado | ✓ |
| 6 — PWA + emails SMTP | `app/manifest.ts` · `public/sw.js` · `lib/email.ts` (Nodemailer) · plantillas bienvenida + recordatorio · cron `/api/cron/recordatorios` · hook `databaseHooks.user.create.after` para email de bienvenida | ✓ |
| 7 — Pagos | 3 providers · /premium · 3 webhooks · cancel desde /ajustes | ✓ |
| 8 — Lanzamiento (código/config) | `Dockerfile` standalone · `docker-compose.prod.yml` · `.dockerignore` · `next.config.ts` con `output:"standalone"` · `/privacidad` y `/terminos` · `FooterGlobal` · `lib/env.ts` + `instrumentation.ts` validan env vars en boot prod · `deploy/` con systemd timer + crontab + `README.md` de pasos | ✓ código |

## Decisiones que vale recordar

1. **better-auth en lugar de Clerk**: el usuario pidió 100% open source. Mapeamos modelos a snake_case en español (`usuarios`/`sesiones`/`cuentas`/`verificaciones`).
2. **UUIDs en DB (no cuids de better-auth)**: `advanced.database.generateId: false` deja que Postgres haga `gen_random_uuid()`.
3. **Cookie anónima `devo_uid`**: para usar la app sin cuenta. Se migra a usuario registrado en sign-up/sign-in (transacción que mueve historial+guardados+rotación y borra el row anónimo).
4. **`pedirVersiculo` acepta `{ hoy }`**: para que los tests congelen la fecha sin tocar el reloj global.
5. **`Versiculo.id` es BigInt** — se serializa a string en las fronteras Server→Client.
6. **`texto_busqueda` es `Unsupported(tsvector)`**: el GIN se crea en migración SQL raw y se puebla con `UPDATE … to_tsvector('spanish', texto)` desde el seed.
7. **`aplicarSuscripcion` es idempotente** vía `UNIQUE(provider, external_id)` en `suscripciones`. Reprocesar el mismo webhook no duplica.
8. **`Premium hasta`**: solo se mantiene si `status='active'` o `(status='canceled' && cancelAtPeriodEnd)`. Expirada/pago fallido → `null`.
9. **Email transaccional**: el usuario va a usar **SMTP propio** (Nodemailer). Placeholders en `.env`. Nada de Resend.
10. **PayPal SDK v2**: el controller de subscriptions no está estable, así que el provider habla directo a la REST API.
11. **Repo público → cero secretos/IPs/datos personales en git**: placeholders `<ip-…>`, `<pass>`, `tu-email@ejemplo.com`. Errores internos (Prisma trae host/IP de la DB) se loguean y al cliente va un mensaje genérico. `.dockerignore` excluye todos los `.env*`: ninguna imagen lleva secretos. Todo documentado en README → Seguridad.
12. **Docker build sin DB**: ninguna página se prerenderiza contra la DB (el layout raíz consulta la DB vía `HeaderUsuario`, así que `/timeline` y `/trivia` son `force-dynamic`). El build solo recibe `NEXT_PUBLIC_APP_URL` como build arg (compose lo interpola desde el symlink `.env → .env.production`). Imagen en `node:24-alpine` (el lockfile es de npm 11). El CLI `prisma` va instalado global en el runner (standalone no trae su bin). Seeds en prod: servicio `seed` del compose (etapa `builder`).

## Estado de servicios al cerrar la sesión

- `devocional_postgres` (Docker) → **arriba**, healthy, puerto 5433.
- Dev server → **apagado** (3010 libre).
- Sin commits pendientes — el repo tiene el commit inicial del scaffold y trabajo sin commitear desde ahí.

## Para retomar mañana

1. Levantar Postgres si bajó: `npm run db:up`
2. Arrancar dev: `npx next dev --port 3010`
3. Verificar verde: `npm test` (espera 97 verdes, 14 archivos) + `npm run build`

### Topología de deploy (la real del usuario)

```
Internet → Cloudflare Tunnel → CT-app (Docker, :3000)
                                    │
                                    ├── CT-postgres (:5432) — DB
                                    ├── CT-redis (opcional, no consumido aún)
                                    └── CT-bucket (S3-like, opcional)
```

- Postgres vive en su propio CT — `docker-compose.prod.yml` ya NO incluye postgres, solo la app.
- Cloudflare Tunnel hace TLS + DNS — nada de Caddy/Nginx.
- Redis disponible para futuro: `better-auth secondaryStorage`, rate limit, cache.
- Bucket disponible para futuro: avatares, OG pre-generadas, audios.

### Próximo paso natural

**Deploy real**. Seguir `deploy/README.md`:
1. CT-postgres: crear user+DB `devocional`, abrir `pg_hba.conf` al CT-app
2. CT-app: instalar Docker (asegurar `nesting=1` + `keyctl=1` en el CT)
3. `git clone` en `/opt/devocional`, llenar `.env.production` (incluye `DATABASE_URL` apuntando al CT-postgres) y `ln -s .env.production .env`
4. `docker compose -f docker-compose.prod.yml up -d --build` (migra solo, también sobre DB vacía)
5. Seed: `docker compose -f docker-compose.prod.yml run --rm seed` (+ `… run --rm seed npx tsx prisma/seed/seed-planes.ts`)
6. Cloudflare Tunnel → public hostname `devocional.app` → `http://<ip-app-ct>:3000`
7. systemd timer (`deploy/recordatorios.timer`) para cron horario
8. Smoke: `curl https://devocional.app/api/health`
9. Reemplazar iconos PNG placeholder (`public/icons/`)
10. Sustituir email `hola@biblia.devo` en `/privacidad` y `/terminos`

## Lugares de la verdad

- 66 libros: `lib/libros.ts`
- 13 estados: `lib/estados.ts`
- Clasificación: `datos/clasificacion.csv` (~150 refs, 344 filas en DB)
- Auth: `lib/auth.ts` (server) + `lib/auth-client.ts` (browser)
- Pagos: `lib/payments/` (types, index, stripe, mercadopago, paypal, aplicar-suscripcion)
- Resolver usuario: `lib/usuario-actual.ts` (Clerk-free; usa better-auth + cookie)

## Sin tests todavía

- Server Actions de auth (`signUpAction`, `signInAction`)
- Server Actions de guardados (`guardarVersiculoAction`)
- Server Actions de pagos (`iniciarCheckoutAction`)
- Webhooks de payments (parsing por provider)

Cubrir esto puede entrar en Fase 6 si queda tiempo.

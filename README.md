# biblia.devo — Devocional

App web (PWA) que entrega versículos bíblicos según tu estado de ánimo. Además tiene diario personal, planes de lectura, peticiones de oración, trivia, línea de tiempo bíblica, estadísticas y una suscripción premium.

Proyecto **open source (MIT)** y **self-hostable**: no depende de servicios propietarios de auth ni de email. Cualquiera puede clonarlo, desplegarlo y adaptarlo.

> ⚠️ **Seguridad**: este README no lleva credenciales reales, API keys, contraseñas ni IPs. Todo lo que aparece entre `<...>` es un placeholder. Los secretos van **solo** en `.env` / `.env.production`, que están en `.gitignore`.

---

## Índice

1. [Stack](#stack)
2. [Funcionalidades](#funcionalidades)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Requisitos](#requisitos)
5. [Puesta en marcha local](#puesta-en-marcha-local)
6. [Variables de entorno](#variables-de-entorno)
7. [Base de datos y seeds](#base-de-datos-y-seeds)
8. [Scripts npm](#scripts-npm)
9. [Tests](#tests)
10. [Autenticación](#autenticación)
11. [Pagos y premium](#pagos-y-premium)
12. [Emails y tareas programadas](#emails-y-tareas-programadas)
13. [Versiones de la Biblia](#versiones-de-la-biblia)
14. [Búsqueda semántica (embeddings)](#búsqueda-semántica-embeddings)
15. [Redis (opcional)](#redis-opcional)
16. [API / endpoints](#api--endpoints)
17. [Deploy en producción](#deploy-en-producción)
18. [Decisiones de diseño](#decisiones-de-diseño)
19. [Licencia](#licencia)

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, `output: "standalone"`) · React 19 |
| Lenguaje | TypeScript estricto |
| Estilos | Tailwind CSS 4 · framer-motion · lucide-react |
| Base de datos | PostgreSQL 16 + **pgvector** |
| ORM | Prisma 6 |
| Auth | **better-auth** (open source, sesiones en Postgres y opcionalmente en Redis) |
| Email | Nodemailer sobre **SMTP propio** |
| Pagos | Stripe · MercadoPago · PayPal (REST API) |
| Cache / rate limit | Redis (ioredis), opcional |
| Embeddings | Transformers.js (`multilingual-e5-small`), solo en los seeds |
| Validación | Zod |
| Tests | Vitest |
| Contenedores | Docker (imagen standalone) |

> **Ojo:** Next.js 16 trae cambios incompatibles con versiones anteriores. Antes de tocar APIs del framework, revisa `node_modules/next/dist/docs/` (ver `AGENTS.md`).

---

## Funcionalidades

**Núcleo**
- **13 estados de ánimo** (ansioso, triste, solo, con miedo, enojado, culpable, cansado, desesperanzado, buscando dirección, necesitando fe, en prueba, feliz/agradecido, general). Su fuente única está en `lib/estados.ts`.
- Clasificación versículo↔estado curada a mano (`datos/clasificacion.csv`).
- **Rotación** por usuario para no repetir versículos (`lib/rotacion.ts`).
- Parser de referencias bíblicas (`"Juan 3:16"`, rangos, etc.) en `lib/parsear-referencia.ts`.
- Compartir versículo con una imagen OG generada al vuelo (`/api/og/versiculo`).
- Modo anónimo: la app se usa sin cuenta gracias a la cookie `devo_uid`.

**Cuenta (registrado)**
- Guardados, historial, ajustes, tema visual y versión de la Biblia preferida.
- **Diario** con vistas por día, mes y año, notas y subrayados de colores.
- **Planes de lectura**: catálogo, plan activo, días marcados y calendario.
- **Peticiones de oración** con seguimiento.
- **Logros (badges)** y **racha** de días.
- **Estadísticas** con heatmap.
- Búsqueda full-text (tsvector en español).

**Público**
- Lector de la Biblia completa: `/leer/[libro]/[capitulo]` (66 libros, 1189 capítulos con subtítulos).
- **Timeline bíblica** (`/timeline`).
- **Trivia** (`/trivia`).
- Dashboard `/inicio`, flujo conversacional `/como-estas` y `/menu`.

**Admin** (`/admin`, solo usuarios con `rol = 'admin'`)
- Gestión de usuarios, versiones de la Biblia y temas.

**PWA**
- `app/manifest.ts`, service worker `public/sw.js` y página `/offline`.

**Legal**
- `/privacidad` y `/terminos`.

### Límites por plan

Definidos en `lib/plan-limits.ts`:

| Recurso | Free | Premium |
|---|---|---|
| Versículos guardados | 20 | ilimitado |
| Historial visible | 90 días | ilimitado |
| Entradas de diario por día | 1 | ilimitado |

---

## Estructura del proyecto

```
app/
  (auth)/          signin, signup
  (publico)/       leer, timeline, trivia, versiculo
  (privado)/       ajustes, guardados, historial, diario, planes, oracion,
                   estadisticas, buscar, admin
  api/             auth, health, cron, webhooks, og
  inicio/ como-estas/ menu/ premium/ privacidad/ terminos/ offline/
actions/           Server Actions (auth, devocional, guardados, pagos, planes,
                   peticiones, tema, version, comparar, admin)
components/        Componentes React (UI, diario, admin…)
lib/
  auth.ts          better-auth (servidor)
  auth-client.ts   better-auth (navegador)
  usuario-actual.ts  resuelve el usuario (sesión o cookie anónima)
  env.ts           validación de env vars con Zod
  email.ts         Nodemailer + email-plantillas.ts
  payments/        stripe, mercadopago, paypal, aplicar-suscripcion
  embeddings/      modelo + intents + candidatos
  db/prisma.ts     cliente Prisma singleton
  redis.ts         cliente Redis opcional
  rate-limit.ts    rate limit de ventana fija
  bible-api.ts     cliente de scripture.api.bible
  libros.ts        66 libros (fuente de verdad)
  estados.ts       13 estados (fuente de verdad)
prisma/
  schema.prisma
  migrations/
  seed/            scripts de seed
datos/             Biblia RV1909 (JSON), clasificación CSV, intent-embeddings
deploy/            unidades systemd, crontab y guía de deploy
public/            iconos PWA, service worker
instrumentation.ts valida las env vars al arrancar
Dockerfile · docker-compose.yml (dev) · docker-compose.prod.yml (prod)
```

---

## Requisitos

- Node.js 20+
- Docker + Docker Compose
- (Opcional) Redis
- (Opcional) Cuenta en scripture.api.bible para versiones extra
- (Opcional) Credenciales de Stripe / MercadoPago / PayPal

---

## Puesta en marcha local

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
#    → rellena BETTER_AUTH_SECRET (openssl rand -base64 32) y lo demás que necesites

# 3. Postgres (con pgvector) en Docker
npm run db:up

# 4. Migraciones
npm run db:migrate

# 5. Datos: libros + Biblia RV1909 + estados + clasificación
npm run db:seed

# 6. Dev server
npx next dev --port 3010
```

Abre `http://localhost:3010`.

> **Puertos:** el Postgres de desarrollo se publica en el **5433** del host, no en el 5432, para no chocar con otros Postgres locales. Si el 3000 está libre en tu máquina, `npm run dev` también funciona. En ese caso ajusta `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` al puerto que uses.

> **Tras `prisma migrate`**: Turbopack no recarga el cliente Prisma generado. Reinicia el dev server.

---

## Variables de entorno

La plantilla es `.env.example`. **Nunca commitees `.env` ni `.env.production`.**

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://<usuario>:<password>@<host>:<puerto>/<db>?schema=public` |
| `BETTER_AUTH_SECRET` | ✅ | Mínimo 16 caracteres. Generar con `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | URL pública de la app |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL pública de la app (se usa en emails, OG y redirects) |
| `CRON_SECRET` | ✅ en prod | Token Bearer de los endpoints `/api/cron/*` (mínimo 16 caracteres) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | opcional | Sin SMTP los emails solo se loguean (`jsonTransport`) |
| `REDIS_URL` | opcional | Activa el cache de sesiones, el rate limit y el cache de api.bible |
| `BIBLE_API_KEY` | opcional | Habilita versiones de scripture.api.bible |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PREMIUM_MENSUAL`, `STRIPE_PRICE_PREMIUM_ANUAL` | opcional | Stripe |
| `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_CURRENCY`, `MERCADOPAGO_PRECIO_MENSUAL`, `MERCADOPAGO_PRECIO_ANUAL` | opcional | MercadoPago |
| `PAYPAL_ENV` (`sandbox`/`live`), `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_PLAN_PREMIUM_MENSUAL`, `PAYPAL_PLAN_PREMIUM_ANUAL` | opcional | PayPal |

`instrumentation.ts` llama a `lib/env.ts` al arrancar. **En producción la app no arranca** si falta una variable crítica, y el error dice cuál. En desarrollo solo muestra un warning.

---

## Base de datos y seeds

- Imagen de Postgres: `pgvector/pgvector:pg16`.
- Las tablas usan nombres en español y snake_case (`usuarios`, `sesiones`, `versiculos`, `entradas`, `suscripciones`, …).
- Los IDs de usuario son UUID generados por Postgres (`gen_random_uuid()`).
- `versiculos.texto_busqueda` es un `tsvector` con índice GIN (creado en una migración SQL raw).
- `versiculos.embedding` es un `vector(384)` de pgvector.

### Scripts de seed

| Comando | Qué hace |
|---|---|
| `npm run db:seed` | Libros + Biblia RV1909 + estados + clasificación (lo mínimo para funcionar) |
| `npm run db:seed:biblia` | Solo la Biblia RV1909 |
| `npx tsx prisma/seed/seed-planes.ts` | Catálogo de planes de lectura (idempotente) |
| `npx tsx prisma/seed/seed-biblias-extra.ts [codigos…]` | Biblias libres extra: `vbl`, `bes`, `pddpt`, `rv1865`, `rvg`, `blm`, `v2p` |
| `npx tsx prisma/seed/seed-versiones-api.ts` | Sincroniza las versiones de scripture.api.bible (requiere `BIBLE_API_KEY`) |
| `npx tsx prisma/seed/seed-embeddings.ts [--force] [--batch=64]` | Embeddings de todos los versículos (descarga el modelo, ~110 MB) |
| `npx tsx prisma/seed/seed-intent-embeddings.ts` | Regenera `datos/intent-embeddings.json` |
| `npx tsx prisma/seed/seed-usuarios-demo.ts [--reset]` | Usuarios demo con diario poblado (**solo dev**) |
| `npx tsx prisma/seed/promover-admin.ts <email>` | Da `rol = 'admin'` a un usuario ya registrado |

---

## Scripts npm

```bash
npm run dev          # next dev
npm run build        # next build (standalone)
npm run start        # next start
npm run lint         # eslint
npm test             # vitest run
npm run test:watch   # vitest en modo watch
npm run db:up        # levanta Postgres de desarrollo
npm run db:down      # baja Postgres de desarrollo
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio
npm run db:seed      # seed base
```

---

## Tests

```bash
npm run db:up && npm run db:seed   # los tests de integración necesitan la DB sembrada
npm test
```

- **Unitarios** (sin DB): env, email, rate limit, redis, límites de plan, parser de referencias, mercadopago, etc.
- **De integración** (con DB): Server Actions de auth, devocional y lectura, rotación, `aplicarSuscripcion`, cron de recordatorios.

Si Postgres está apagado, los tests de integración fallan con `PrismaClientInitializationError`. Es lo esperado: levanta la DB y vuelve a correrlos.

---

## Autenticación

- **better-auth** con email + contraseña (`lib/auth.ts`, endpoint `/api/auth/[...all]`).
- Modelos mapeados a `usuarios` / `sesiones` / `cuentas` / `verificaciones`.
- `advanced.database.generateId: false` deja que Postgres genere los UUID.
- **Usuario anónimo**: la cookie `devo_uid` permite usar la app sin cuenta. Al registrarse o iniciar sesión, una transacción migra el historial, los guardados y la rotación al usuario real, y borra el registro anónimo.
- Al crear un usuario, el hook `databaseHooks.user.create.after` envía el email de bienvenida.
- Con `REDIS_URL` presente, las sesiones se cachean en Redis (`secondaryStorage`).

---

## Pagos y premium

- Tres providers detrás de una interfaz común (`lib/payments/types.ts`, `lib/payments/index.ts`).
- Checkout en `/premium`; la cancelación se hace desde `/ajustes`.
- Webhooks:
  - `POST /api/webhooks/stripe`
  - `POST /api/webhooks/mercadopago`
  - `POST /api/webhooks/paypal`
- `aplicarSuscripcion` es **idempotente** gracias a `UNIQUE(provider, external_id)`: reprocesar un webhook no crea duplicados.
- `premiumHasta` solo se mantiene si `status = 'active'` o si está `canceled` con `cancelAtPeriodEnd`. Si la suscripción expira o falla el pago, queda en `null`.
- PayPal se integra contra la REST API directamente, porque el controller de subscriptions del SDK v2 no es estable.

En cada dashboard, configura la URL del webhook como `https://<tu-dominio>/api/webhooks/<provider>`.

---

## Emails y tareas programadas

- `lib/email.ts` usa Nodemailer contra tu servidor SMTP. Sin SMTP configurado, los emails se loguean y no se envían.
- Plantillas (`lib/email-plantillas.ts`): bienvenida, recordatorio diario y resumen mensual del diario.

| Endpoint | Frecuencia sugerida | Unidades en `deploy/` |
|---|---|---|
| `/api/cron/recordatorios` | cada hora | `recordatorios.service` + `recordatorios.timer` (o `recordatorios.cron`) |
| `/api/cron/diario-mensual` | día 1 de cada mes | `diario-mensual.service` + `diario-mensual.timer` |

Ambos piden `Authorization: Bearer $CRON_SECRET` y tienen rate limit.

---

## Versiones de la Biblia

- **RV1909** (Reina-Valera 1909): local, de dominio público, siempre disponible.
- **Biblias libres extra** (VBL, BES, PDDPT, RV1865, RVG, BLM, V2P): se ingestan con `seed-biblias-extra.ts`.
- **scripture.api.bible**: con `BIBLE_API_KEY` se habilitan NVI, RVR1960, LBLA, NBLA, DHH, etc. (según lo que apruebe tu cuenta). Las respuestas se cachean para siempre en Redis. Sin key, la app vuelve a RV1909.
- Cada usuario elige su versión. Las versiones pueden marcarse como premium o desactivarse desde `/admin/biblias`.

---

## Búsqueda semántica (embeddings)

- Modelo: `Xenova/multilingual-e5-small` (384 dimensiones).
- Los embeddings de los versículos se precalculan con `seed-embeddings.ts` y se guardan en pgvector.
- Los embeddings de los "intents" (estado y estado×área) están en `datos/intent-embeddings.json`, que se commitea.
- **El runtime no carga el modelo**: solo compara vectores precalculados en Postgres. El modelo se usa únicamente en los scripts de seed.

---

## Redis (opcional)

Con `REDIS_URL` definida:
- cache de sesiones de better-auth,
- rate limit (`lib/rate-limit.ts`, ventana fija con `INCR` + `EXPIRE`),
- cache permanente de pasajes de api.bible.

Sin Redis todo sigue funcionando contra Postgres. Si Redis falla, el rate limit deja pasar las peticiones y better-auth aplica su propio límite como segunda defensa.

---

## API / endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Healthcheck: `{"ok":true,"db":"ok"}` |
| `*` | `/api/auth/*` | better-auth |
| `GET`/`POST` | `/api/cron/recordatorios` | Envía recordatorios (Bearer `CRON_SECRET`) |
| `GET`/`POST` | `/api/cron/diario-mensual` | Envía el resumen mensual (Bearer `CRON_SECRET`) |
| `POST` | `/api/webhooks/{stripe,mercadopago,paypal}` | Webhooks de pago |
| `GET` | `/api/og/versiculo` | Imagen OG de un versículo |
| `GET` | `/api/og/diario/[fecha]` | Imagen OG de una entrada del diario |

Lo demás (guardar, pedir versículo, planes, peticiones…) son **Server Actions** en `actions/`.

---

## Deploy en producción

La guía completa, paso a paso, está en **[`deploy/README.md`](deploy/README.md)**.

Topología de referencia, con contenedores separados:

```
Internet → Cloudflare Tunnel (TLS + DNS) → contenedor app (Docker, :3000)
                                               ├── Postgres (contenedor/host propio)
                                               ├── Redis (opcional)
                                               └── Bucket S3-compatible (opcional, futuro)
```

Resumen:

```bash
# En el host de la app
git clone <repo-url> /opt/devocional && cd /opt/devocional
cp .env.example .env.production && chmod 600 .env.production
#   → rellenar con valores reales (DATABASE_URL apunta a tu Postgres)

docker compose -f docker-compose.prod.yml up -d --build
#   El contenedor corre `prisma migrate deploy` antes de `node server.js`

# Seed inicial (solo la primera vez)
docker compose -f docker-compose.prod.yml exec app sh -c "npx tsx prisma/seed/index.ts"

# Smoke test
curl -fsS https://<tu-dominio>/api/health
```

- `docker-compose.prod.yml` **no incluye Postgres**: la DB vive aparte.
- No hace falta Nginx ni Caddy, porque Cloudflare Tunnel termina el TLS.
- Si `cloudflared` corre en el mismo host, publica el puerto solo en `127.0.0.1`.
- Actualizar: `git pull && docker compose -f docker-compose.prod.yml up -d --build`.
- Backups: `pg_dump` programado en el host de Postgres.

### Checklist antes de lanzar

- [ ] Reemplazar los iconos PNG placeholder de `public/icons/`
- [ ] Poner el email de contacto real en `/privacidad` y `/terminos`
- [ ] Configurar SMTP y probar el email de bienvenida
- [ ] Registrar las URLs de webhook en cada provider de pago
- [ ] Activar los timers de systemd de los crons
- [ ] Promover tu usuario a admin con `promover-admin.ts`

---

## Decisiones de diseño

1. **better-auth en vez de Clerk**: todo open source y self-hosted.
2. **UUIDs de Postgres** en vez de los IDs propios de better-auth.
3. **Cookie anónima `devo_uid`**, que se migra al registrarse.
4. **`pedirVersiculo({ hoy })`**: la fecha se puede inyectar para tests deterministas.
5. **`Versiculo.id` es `BigInt`**: se serializa a string al pasar de Server a Client.
6. **`texto_busqueda` es `Unsupported("tsvector")`** en Prisma; el GIN se crea por SQL.
7. **Suscripciones idempotentes** vía `UNIQUE(provider, external_id)`.
8. **SMTP propio** (Nodemailer); nada de servicios de email propietarios.
9. **PayPal vía REST** directo.
10. **Embeddings precalculados**: el runtime no carga modelos de ML.

---

## Licencia

El **código** de este proyecto se publica bajo licencia **[MIT](LICENSE)**. Puedes usarlo, copiarlo, modificarlo, distribuirlo y usarlo comercialmente, siempre que conserves el aviso de copyright y la licencia.

### Contribuir

Issues y merge requests son bienvenidos. Antes de enviar un cambio:

```bash
npm run lint && npm test && npm run build
```

No incluyas secretos en commits. Usa `.env` (ignorado por git) y documenta las variables nuevas en `.env.example` sin valores reales.

### Licencias del contenido bíblico

La licencia MIT cubre **solo el código**. Cada texto bíblico conserva su propia licencia:

| Versión | Licencia | Cómo llega a la app |
|---|---|---|
| Reina-Valera 1909 | Dominio público | Incluida en el repo (`datos/biblia-rv1909.json`, de `scrollmapper/bible_databases`) |
| Reina-Valera 1865 | Dominio público | `seed-biblias-extra.ts` |
| VBL, BES, PDDPT, BLM, RVG, V2P | Libres según cada fuente (CC / libre uso / dominio público) | `seed-biblias-extra.ts`. **Verifica la licencia vigente de cada fuente antes de publicarlas.** |
| NVI, RVR1960, LBLA, NBLA, DHH, etc. | **Con copyright** de sus editoriales | **Solo** vía scripture.api.bible con tu propia `BIBLE_API_KEY`. No se incluyen ni se descargan en el repo |

> No agregues al repo ni a los scripts de seed traducciones con copyright. Si necesitas una, consúmela a través de una API que tenga licencia (scripture.api.bible) y respeta sus términos de uso.

Las clasificaciones (`datos/clasificacion.csv`), las preguntas de trivia, la timeline y los textos propios de la app forman parte del proyecto y se distribuyen bajo MIT.
# biblia.devo

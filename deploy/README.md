# Deploy — Devocional

Topología asumida (Proxmox):

```
                Internet
                   │
        ┌──────────┴──────────┐
        │   Cloudflare Tunnel │   (cert TLS + DNS)
        └──────────┬──────────┘
                   │  http
       ┌───────────┴───────────┐
       │     CT: app           │   ← este repo, Docker, puerto 3000
       │   biblia.devo         │
       └─────┬────────┬────────┘
             │        │
   ┌─────────┴─┐    ┌─┴────────┐    ┌──────────────┐
   │ CT: pg    │    │ CT: redis│    │ CT: bucket   │
   │ postgres  │    │ (opcional│    │ (opcional —  │
   │ :5432     │    │  futuro) │    │  imagenes)   │
   └───────────┘    └──────────┘    └──────────────┘
```

Reemplaza `devocional.app` por tu dominio real.

> **Seguridad:** el repo es público. Las IPs, contraseñas y tokens reales van **solo** en
> `.env.production` y `/etc/devocional/cron.env` (ambos `chmod 600`, fuera de git). Nunca los
> escribas en este archivo, en comentarios ni en commits. Qué protege el proyecto, el chequeo antes
> de cada push y cómo rotar un secreto filtrado: [README → Seguridad](../README.md#seguridad).

## 1. Postgres CT — preparar la DB (una sola vez)

Conectado al CT de Postgres:

```bash
# Crear usuario + DB para la app
sudo -u postgres psql <<EOF
CREATE USER devocional WITH PASSWORD '<pass-fuerte>';
CREATE DATABASE devocional OWNER devocional;
GRANT ALL PRIVILEGES ON DATABASE devocional TO devocional;
EOF
```

Asegúrate que `postgresql.conf` escuche en la IP del CT (o `0.0.0.0`) y que `pg_hba.conf` permita conexión **solo** desde la IP del CT de la app (una línea `host devocional devocional <ip-app-ct>/32 scram-sha-256`, no `0.0.0.0/0`). Reiniciar el servicio. El 5432 no debe ser accesible desde internet.

## 2. CT de la app — Docker + clonar repo

```bash
# Dentro del CT de la app
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER  # cerrar sesion + abrir

git clone <repo-url> /opt/devocional
cd /opt/devocional
```

> Si el CT es LXC sin nesting habilitado, Docker no levantará. En Proxmox: edita
> el CT → Options → Features → marca `keyctl=1` y `nesting=1`, reinicia.

## 3. Variables de entorno

```bash
cp .env.example .env.production
chmod 600 .env.production
ln -s .env.production .env   # compose lo lee para el build arg NEXT_PUBLIC_APP_URL
```

Completa todo:

```ini
DATABASE_URL=postgresql://devocional:<pass>@<ip-postgres-ct>:5432/devocional?schema=public

BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=https://devocional.app
NEXT_PUBLIC_APP_URL=https://devocional.app

CRON_SECRET=<openssl rand -base64 32>

SMTP_HOST=smtp.tu-servidor.com
SMTP_PORT=587
SMTP_USER=devo@tu-dominio
SMTP_PASS=...
SMTP_FROM="Devocional <devo@tu-dominio>"

# Si ya tienes claves de pagos reales o de sandbox:
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_PREMIUM_MENSUAL=...
STRIPE_PRICE_PREMIUM_ANUAL=...

MERCADOPAGO_ACCESS_TOKEN=...
PAYPAL_ENV=live
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
PAYPAL_PLAN_PREMIUM_MENSUAL=...
PAYPAL_PLAN_PREMIUM_ANUAL=...
```

`instrumentation.ts` valida estas vars en boot — si falta algo crítico la app se cae con un error claro.

> Ningún `.env` entra a las imágenes: `.dockerignore` los excluye. El build no toca la DB y solo
> recibe `NEXT_PUBLIC_APP_URL` como build arg (por eso el symlink `.env`). Todo lo demás entra en
> runtime por `env_file`. Si falta el symlink, compose aborta con
> `falta NEXT_PUBLIC_APP_URL (ejecuta ln -s .env.production .env)`.

## 4. Build + start

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f app
```

El contenedor corre `prisma migrate deploy` antes de levantar el server. Funciona contra una DB vacía, así que no hace falta preparar el esquema a mano.

Cuando esté arriba, sembrar la Biblia + estados + clasificación y los planes de lectura (solo la primera vez):

```bash
docker compose -f docker-compose.prod.yml run --rm seed
docker compose -f docker-compose.prod.yml run --rm seed npx tsx prisma/seed/seed-planes.ts
```

El servicio `seed` usa la etapa `builder` del Dockerfile (código + `tsx`), porque la imagen final no trae los scripts de seed. No arranca con `up`. `seed-usuarios-demo.ts` está bloqueado en producción.

Para promover tu usuario a admin, después de registrarte en `/signup`:

```bash
docker compose -f docker-compose.prod.yml run --rm seed npx tsx prisma/seed/promover-admin.ts tu-email@ejemplo.com
```

## 5. Cloudflare Tunnel

En tu dashboard de Cloudflare Zero Trust → Tunnels:

- Public hostname: `devocional.app`
- Service: `http://<ip-app-ct>:3000`

(O si `cloudflared` corre dentro del propio CT de la app: `http://localhost:3000` y dejas el puerto sin exponer al exterior. Más seguro.)

Cloudflare hace el TLS automáticamente, no necesitas Caddy/Nginx.

> Webhooks de pagos: Stripe/PayPal/MercadoPago apuntan a `https://devocional.app/api/webhooks/*`.
> El tunnel los enruta sin configuración extra.

## 6. Recordatorios diarios — systemd timer

Puedes correrlo en el CT de la app o en cualquier CT que tenga `curl`.

```bash
sudo mkdir -p /etc/devocional
sudo tee /etc/devocional/cron.env > /dev/null <<EOF
CRON_SECRET=<el-mismo-CRON_SECRET-de-.env.production>
APP_URL=https://devocional.app
EOF
sudo chmod 600 /etc/devocional/cron.env

sudo cp deploy/recordatorios.service /etc/systemd/system/
sudo cp deploy/recordatorios.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now recordatorios.timer

systemctl list-timers recordatorios.timer
```

(Alternativa con crontab clásico: ver `deploy/recordatorios.cron`.)

> El cron golpea el endpoint público vía Cloudflare. Si prefieres saltarte el
> tunnel para tráfico interno, cambia `APP_URL` a `http://<ip-app-ct>:3000`.

## 7. Backups (Postgres CT)

```bash
# En el CT de Postgres
pg_dump -U devocional devocional | gzip > /backup/devo-$(date +%F).sql.gz
```

Programar con cron o systemd timer.

## 8. Updates

```bash
cd /opt/devocional
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

(El healthcheck retrasa el "running" hasta que `/api/health` responde 200.)

## 9. Smoke test post-deploy

```bash
curl -fsS https://devocional.app/api/health
# {"ok":true,"db":"ok"}  ← confirma que la app habla con Postgres
# Si responde 503 {"ok":false,"db":"down"}, el motivo real (sin exponerlo al público) está en:
#   docker compose -f docker-compose.prod.yml logs app | grep '\[health\]'

curl -fsS -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://devocional.app/api/cron/recordatorios?hora=99"
# 400  ← auth pasa, hora invalida
```

## Próximos pasos opcionales (Redis, bucket)

### Redis

El CT de Redis se puede aprovechar para:

- **`secondaryStorage` de better-auth** → cachea sesiones, evita un hit a Postgres por request autenticado.
- **Rate limiting** de `/api/auth/*` y `/api/cron/*`.
- **Cache** del versículo del día por usuario (TTL 5–10 min).

Cableado mínimo (futuro):

```bash
npm install ioredis
```

`lib/redis.ts` con un cliente único + integrarlo en `lib/auth.ts` (`secondaryStorage`).

### Bucket (imágenes)

Si en algún momento agregamos:

- Avatares de usuario
- Imágenes OG pre-generadas para compartir (en lugar de `/api/og` runtime)
- Audios de versículos

Usar el CT-bucket vía SDK S3-compatible (`@aws-sdk/client-s3` apuntando a tu endpoint interno).

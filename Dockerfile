# syntax=docker/dockerfile:1

# ─── deps ───
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ─── builder ───
FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Genera el client de Prisma (lo necesita el build de Next).
RUN npx prisma generate

# Los .env* no entran al contexto (.dockerignore): ninguna etapa lleva secretos.
# El build no toca la DB; solo necesita la URL publica, que Next incrusta en
# robots.txt, sitemap.xml y metadata. Llega como build arg desde el compose.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Defensa extra: Next standalone copia `.env` y `.env.production` a
# .next/standalone si existen. Nunca deben llegar a la imagen final; en runtime
# las vars entran por `env_file` del compose.
RUN rm -f .next/standalone/.env .next/standalone/.env.*

# ─── runner ───
FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario no-root.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Public + standalone build + estaticos.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma: schema + migraciones + cliente generado.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# CLI de Prisma para `prisma migrate deploy` al arrancar. Copiar el paquete no
# alcanza: standalone no trae su bin ni sus deps (@prisma/engines,
# @prisma/config). Se instala global con la version exacta del lockfile.
COPY --from=builder /app/node_modules/prisma/package.json /tmp/prisma-package.json
RUN npm install -g "prisma@$(node -p "require('/tmp/prisma-package.json').version")" \
  && rm /tmp/prisma-package.json \
  && npm cache clean --force

USER nextjs
EXPOSE 3000

# `server.js` lo genera next standalone.
CMD ["node", "server.js"]

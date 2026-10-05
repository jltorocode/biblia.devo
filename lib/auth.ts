import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db/prisma";
import { enviarEmail } from "@/lib/email";
import { plantillaBienvenida } from "@/lib/email-plantillas";
import { buildSecondaryStorage } from "@/lib/redis";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // Plugin obligatorio para Server Actions de Next: auto-aplica las cookies
  // que devuelve better-auth (set-cookie de sesion al hacer login).
  // Sin esto, signInAction retorna ok:true pero no queda sesion.
  plugins: [nextCookies()],

  // Si REDIS_URL esta configurada, better-auth cachea sesiones aqui
  // (evita un hit a Postgres por cada request autenticada). Si no, undefined.
  secondaryStorage: buildSecondaryStorage(),

  // Rate limit nativo de better-auth. Si hay secondaryStorage lo usa
  // (cuenta por IP); si no, cae a memoria del proceso.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/forget-password": { window: 60, max: 3 },
    },
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  databaseHooks: {
    user: {
      create: {
        async after(user) {
          // Email de bienvenida — no bloqueamos el alta si falla el SMTP.
          if (!user?.email) return;
          const { subject, html, text } = plantillaBienvenida({
            nombre: (user as { name?: string | null }).name ?? null,
            appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          });
          enviarEmail({ to: user.email, subject, html, text }).catch((err) => {
            console.error("[bienvenida] fallo al enviar email", err);
          });
        },
      },
    },
  },

  // ─── Mapear modelos y campos a nuestro snake_case en espanol ───
  user: {
    modelName: "usuario",
    fields: {
      name: "nombre",
      emailVerified: "emailVerificado",
      image: "imagen",
      createdAt: "creadoEn",
      updatedAt: "actualizadoEn",
    },
  },
  session: {
    modelName: "sesion",
    fields: {
      userId: "usuarioId",
      expiresAt: "expiraEn",
      ipAddress: "ip",
      userAgent: "userAgent",
      createdAt: "creadoEn",
      updatedAt: "actualizadoEn",
    },
  },
  account: {
    modelName: "cuenta",
    fields: {
      userId: "usuarioId",
      accountId: "accountId",
      providerId: "providerId",
      password: "passwordHash",
      accessToken: "accessToken",
      refreshToken: "refreshToken",
      idToken: "idToken",
      accessTokenExpiresAt: "accessTokenExpiraEn",
      refreshTokenExpiresAt: "refreshTokenExpiraEn",
      scope: "scope",
      createdAt: "creadoEn",
      updatedAt: "actualizadoEn",
    },
  },
  verification: {
    modelName: "verificacion",
    fields: {
      identifier: "identifier",
      value: "value",
      expiresAt: "expiraEn",
      createdAt: "creadoEn",
      updatedAt: "actualizadoEn",
    },
  },

  // Que la DB genere el UUID (gen_random_uuid). Better-auth respeta la columna.
  advanced: {
    database: {
      generateId: false,
    },
  },
});

export type Auth = typeof auth;

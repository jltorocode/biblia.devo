import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const ANON_COOKIE = "devo_uid";
export const ANON_COOKIE_DIAS = 30;

interface ResolverOpts {
  /**
   * Si es true crea un usuario anonimo nuevo cuando no hay sesion ni cookie
   * (y setea la cookie). SOLO permitido en Server Actions / Route Handlers /
   * Middleware. Desde Server Components plain dejarlo en false.
   */
  crearSiNoExiste: boolean;
}

/**
 * Devuelve el `usuario.id` del solicitante actual, resolviendo:
 *  1. Sesion de better-auth (usuario registrado).
 *  2. Cookie anonima previa.
 *  3. Crear uno nuevo y guardar cookie (solo si `crearSiNoExiste`).
 *
 * Devuelve `null` si no hay usuario y no se permite crearlo.
 */
export async function resolverUsuarioId(
  opts: ResolverOpts = { crearSiNoExiste: false },
): Promise<string | null> {
  // 1) Sesion autenticada
  try {
    const sesion = await auth.api.getSession({ headers: await headers() });
    if (sesion?.user?.id) return sesion.user.id;
  } catch {
    // auth no configurado o fuera de contexto — caemos a anonimo.
  }

  // 2) Cookie anonima
  const store = await cookies();
  const existente = store.get(ANON_COOKIE)?.value;
  if (existente) {
    const found = await prisma.usuario.findUnique({
      where: { id: existente },
      select: { id: true },
    });
    if (found) return found.id;
  }

  // 3) Crear si esta permitido
  if (!opts.crearSiNoExiste) return null;

  const nuevo = await prisma.usuario.create({ data: {}, select: { id: true } });
  store.set(ANON_COOKIE, nuevo.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ANON_COOKIE_DIAS * 24 * 60 * 60,
    path: "/",
  });
  return nuevo.id;
}

export function borrarCookieAnonima(store: Awaited<ReturnType<typeof cookies>>): void {
  store.set(ANON_COOKIE, "", { maxAge: 0, path: "/" });
}

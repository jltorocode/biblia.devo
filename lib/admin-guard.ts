// Guard server-side para rutas /admin/*. Redirige si el usuario no es admin.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export interface AdminSesion {
  usuarioId: string;
  email: string;
  nombre: string | null;
}

export async function requerirAdmin(): Promise<AdminSesion> {
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!sesion?.user?.id) redirect("/signin?next=/admin");

  const u = await prisma.usuario.findUnique({
    where: { id: sesion.user.id },
    select: { id: true, rol: true, email: true, nombre: true },
  });
  if (!u || u.rol !== "admin") redirect("/");

  return { usuarioId: u.id, email: u.email ?? "", nombre: u.nombre };
}

export async function esAdmin(): Promise<boolean> {
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!sesion?.user?.id) return false;
  const u = await prisma.usuario.findUnique({
    where: { id: sesion.user.id },
    select: { rol: true },
  });
  return u?.rol === "admin";
}

import { prisma } from "@/lib/db/prisma";
import { TablaUsuarios } from "@/components/admin/TablaUsuarios";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Usuarios" };

export default async function AdminUsuariosPage() {
  const usuarios = await prisma.usuario.findMany({
    where: { email: { not: null } },
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      premiumHasta: true,
      creadoEn: true,
      versionesPermitidas: {
        select: {
          version: { select: { id: true, codigo: true, nombre: true, esGlobal: true } },
        },
      },
    },
  });

  const versionesPrivadas = await prisma.versionBiblia.findMany({
    where: { esGlobal: false, activa: true },
    orderBy: { nombre: "asc" },
    select: { id: true, codigo: true, nombre: true },
  });

  const filas = usuarios.map((u) => ({
    id: u.id,
    email: u.email!,
    nombre: u.nombre,
    rol: u.rol,
    premium: !!(u.premiumHasta && u.premiumHasta > new Date()),
    creadoEn: u.creadoEn.toISOString(),
    versionesPermitidas: u.versionesPermitidas.map((p) => p.version),
  }));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">Usuarios</h1>
        <p className="mt-1 text-sm text-stone-500">
          Promové admins · asigná versiones privadas a usuarios específicos.
        </p>
      </header>
      <TablaUsuarios usuarios={filas} versionesPrivadas={versionesPrivadas} />
    </div>
  );
}

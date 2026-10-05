import { prisma } from "@/lib/db/prisma";
import { listarVersionesTodas } from "@/lib/versiones-biblia";
import { TablaBiblias } from "@/components/admin/TablaBiblias";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Biblias" };

export default async function AdminBibliasPage() {
  const [versiones, conteos, usuarios] = await Promise.all([
    listarVersionesTodas(),
    prisma.versiculo.groupBy({
      by: ["versionId"],
      _count: { _all: true },
    }),
    prisma.usuario.findMany({
      where: { email: { not: null } },
      orderBy: { creadoEn: "desc" },
      select: { id: true, email: true, nombre: true, rol: true },
      take: 100,
    }),
  ]);

  const permisos = await prisma.versionUsuario.findMany({
    select: { versionId: true, usuarioId: true },
  });
  const permisosPorVersion = new Map<number, Set<string>>();
  for (const p of permisos) {
    if (!permisosPorVersion.has(p.versionId)) permisosPorVersion.set(p.versionId, new Set());
    permisosPorVersion.get(p.versionId)!.add(p.usuarioId);
  }

  const versionesConDatos = versiones.map((v) => ({
    id: v.id,
    codigo: v.codigo,
    nombre: v.nombre,
    activa: v.activa,
    esGlobal: v.esGlobal,
    esApi: v.esApi,
    esPremium: v.esPremium,
    versiculos: conteos.find((c) => c.versionId === v.id)?._count._all ?? 0,
    usuariosPermitidos: Array.from(permisosPorVersion.get(v.id) ?? []),
  }));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">Versiones de la Biblia</h1>
        <p className="mt-1 text-sm text-stone-500">
          Activá/desactivá versiones. Las globales se muestran a todos los usuarios;
          las privadas solo a quienes asignes.
        </p>
      </header>
      <TablaBiblias versiones={versionesConDatos} usuarios={usuarios} />
    </div>
  );
}

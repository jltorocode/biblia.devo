import { prisma } from "@/lib/db/prisma";
import { TablaTemas } from "@/components/admin/TablaTemas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Temas" };

export default async function AdminTemasPage() {
  const temas = await prisma.tema.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { versiculos: true } } },
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">Temas</h1>
        <p className="mt-1 text-sm text-stone-500">
          Las etiquetas temáticas que se usan para enriquecer la clasificación de versículos.
        </p>
      </header>
      <TablaTemas
        temas={temas.map((t) => ({
          id: t.id,
          slug: t.slug,
          nombre: t.nombre,
          conteo: t._count.versiculos,
        }))}
      />
    </div>
  );
}

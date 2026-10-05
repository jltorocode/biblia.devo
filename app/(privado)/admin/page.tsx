import Link from "next/link";
import { BookMarked, Users, Tags, Database } from "lucide-react";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [versionesCount, usuariosCount, temasCount, versiculosCount] = await Promise.all([
    prisma.versionBiblia.count(),
    prisma.usuario.count(),
    prisma.tema.count(),
    prisma.versiculo.count(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">Panel Admin</h1>
        <p className="mt-1 text-sm text-stone-500">
          Gestión de versiones bíblicas, usuarios y temas.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          href="/admin/biblias"
          label="Versiones"
          value={String(versionesCount)}
          icon={<BookMarked className="size-5" />}
        />
        <Card
          href="/admin/usuarios"
          label="Usuarios"
          value={String(usuariosCount)}
          icon={<Users className="size-5" />}
        />
        <Card
          href="/admin/temas"
          label="Temas"
          value={String(temasCount)}
          icon={<Tags className="size-5" />}
        />
        <Card
          label="Versículos en DB"
          value={versiculosCount.toLocaleString("es-AR")}
          icon={<Database className="size-5" />}
        />
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-base font-medium text-stone-800">Accesos rápidos</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/admin/biblias" className="text-stone-700 underline hover:text-stone-900">
              Activar/desactivar versiones · asignar a usuarios
            </Link>
          </li>
          <li>
            <Link href="/admin/usuarios" className="text-stone-700 underline hover:text-stone-900">
              Promover admins · permisos de versiones privadas
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-medium">Cargar más biblias</p>
        <pre className="mt-2 overflow-x-auto rounded-md bg-amber-100 px-3 py-2 text-xs">
{`# Dominio público / CC (todas globales):
npx tsx prisma/seed/seed-biblias-extra.ts vbl bes rv1865

# Privadas (solo aparecen a usuarios con permiso):
npx tsx prisma/seed/seed-biblias-extra.ts pddpt

# NVI / RVR1960 / PDT (api.bible — cacheado en Redis):
# 1. BIBLE_API_KEY en .env
# 2. npx tsx prisma/seed/seed-versiones-api.ts`}
        </pre>
      </section>
    </div>
  );
}

function Card({
  href,
  label,
  value,
  icon,
}: {
  href?: string;
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  const inner = (
    <div className="rounded-xl border border-stone-200 bg-white p-4 transition hover:border-stone-400 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">{value}</p>
        </div>
        <div className="text-stone-400">{icon}</div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

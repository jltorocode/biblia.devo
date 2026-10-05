import Link from "next/link";
import { ShieldCheck, BookMarked, Users, Tags, ArrowLeft } from "lucide-react";
import { requerirAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requerirAdmin();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-8 space-y-1">
          <div className="mb-4 rounded-xl bg-stone-100 px-3 py-2.5 text-xs">
            <p className="flex items-center gap-1.5 font-medium text-stone-700">
              <ShieldCheck className="size-4" /> Admin
            </p>
            <p className="mt-0.5 truncate text-stone-500">{admin.email}</p>
          </div>
          <SidebarLink href="/admin" label="Dashboard" />
          <SidebarLink href="/admin/biblias" label="Biblias" icon={<BookMarked className="size-4" />} />
          <SidebarLink href="/admin/usuarios" label="Usuarios" icon={<Users className="size-4" />} />
          <SidebarLink href="/admin/temas" label="Temas" icon={<Tags className="size-4" />} />
          <div className="mt-6 border-t border-stone-200 pt-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-stone-500 hover:bg-stone-100"
            >
              <ArrowLeft className="size-4" /> Volver a la app
            </Link>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

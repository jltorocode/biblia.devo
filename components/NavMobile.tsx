"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Gamepad2, Calendar, Menu } from "lucide-react";

interface Props {
  autenticado: boolean;
}

/**
 * Tab bar inferior fija — UX estándar de app movil. Solo se muestra en
 * mobile (< sm). Desktop usa el HeaderUsuario tradicional.
 *
 * 5 tabs:
 *  - Inicio: selector de estados (atajo más usado)
 *  - Leer:   Biblia directa
 *  - Trivia: juego
 *  - Planes: planes de lectura
 *  - Más:    directorio completo (/menu)
 */
export function NavMobile({ autenticado }: Props) {
  const pathname = usePathname() ?? "/";

  const tabs: Array<{
    href: string;
    label: string;
    icon: typeof Home;
    activa: (p: string) => boolean;
  }> = [
    {
      href: autenticado ? "/inicio" : "/",
      label: "Inicio",
      icon: Home,
      activa: (p) =>
        p === "/inicio" || p === "/" || p.startsWith("/versiculo"),
    },
    {
      href: "/leer",
      label: "Leer",
      icon: BookOpen,
      activa: (p) => p.startsWith("/leer"),
    },
    {
      href: "/trivia",
      label: "Trivia",
      icon: Gamepad2,
      activa: (p) => p.startsWith("/trivia"),
    },
    {
      href: autenticado ? "/planes" : "/signin?next=/planes",
      label: "Planes",
      icon: Calendar,
      activa: (p) =>
        p.startsWith("/planes") ||
        p.startsWith("/diario") ||
        p.startsWith("/historial") ||
        p.startsWith("/guardados"),
    },
    {
      href: "/menu",
      label: "Más",
      icon: Menu,
      activa: (p) =>
        p === "/menu" ||
        p.startsWith("/ajustes") ||
        p.startsWith("/buscar") ||
        p.startsWith("/oracion") ||
        p.startsWith("/estadisticas") ||
        p.startsWith("/timeline") ||
        p.startsWith("/premium") ||
        p === "/signin" ||
        p === "/signup",
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 sm:hidden border-t border-stone-200 bg-white/95 backdrop-blur"
      aria-label="Navegación principal"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex">
        {tabs.map((t) => {
          const Icon = t.icon;
          const activa = t.activa(pathname);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={activa ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                  activa ? "text-stone-900" : "text-stone-500"
                }`}
              >
                {activa && (
                  <span
                    aria-hidden
                    className="absolute top-0 h-0.5 w-10 rounded-b bg-stone-700"
                  />
                )}
                <Icon
                  className={`size-5 transition-transform ${activa ? "scale-110" : ""}`}
                  strokeWidth={activa ? 2.25 : 1.75}
                  aria-hidden
                />
                <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

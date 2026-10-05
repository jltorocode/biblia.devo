import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import {
  BookOpen,
  Search,
  Gamepad2,
  Heart,
  Calendar,
  Bookmark,
  History,
  Sparkles,
  Settings,
  TrendingUp,
  NotebookPen,
  Crown,
  LogIn,
  UserPlus,
} from "lucide-react";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menú · Todas las secciones",
  description: "Atajos rápidos a todo lo que la app puede hacer por vos.",
};

interface Seccion {
  titulo: string;
  items: Item[];
}

interface Item {
  href: string;
  emoji: string;
  icon: typeof BookOpen;
  titulo: string;
  desc: string;
  /** Si requiere sesión real. */
  auth?: boolean;
  /** Si es feature premium. */
  premium?: boolean;
  /** Color de fondo del card (tailwind). */
  tint: string;
}

export default async function MenuPage() {
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  const autenticado = !!sesion?.user?.id;

  const secciones: Seccion[] = [
    {
      titulo: "📖 Leer y estudiar",
      items: [
        {
          href: "/leer",
          emoji: "📖",
          icon: BookOpen,
          titulo: "Leer la Biblia",
          desc: "Los 66 libros · capítulo por capítulo",
          tint: "from-amber-50 to-orange-50 ring-amber-200",
        },
        {
          href: "/buscar",
          emoji: "🔍",
          icon: Search,
          titulo: "Buscar",
          desc: "Búsqueda libre, semántica y en tus notas",
          tint: "from-sky-50 to-blue-50 ring-sky-200",
        },
        {
          href: "/timeline",
          emoji: "✦",
          icon: Sparkles,
          titulo: "Línea de tiempo",
          desc: "41 hitos · de Génesis a Apocalipsis",
          tint: "from-stone-50 to-amber-50 ring-stone-200",
        },
        {
          href: "/trivia",
          emoji: "🎮",
          icon: Gamepad2,
          titulo: "Trivia bíblica",
          desc: "Juego contrarreloj · 152 preguntas",
          tint: "from-emerald-50 to-teal-50 ring-emerald-200",
        },
      ],
    },
    {
      titulo: "🌱 Tu camino",
      items: [
        {
          href: "/inicio",
          emoji: "🏠",
          icon: BookOpen,
          titulo: "Versículo según tu estado",
          desc: "13 emociones · una palabra para hoy",
          auth: true,
          tint: "from-rose-50 to-pink-50 ring-rose-200",
        },
        {
          href: "/estadisticas",
          emoji: "📊",
          icon: TrendingUp,
          titulo: "Tu caminar",
          desc: "Racha · heatmap · logros · stats",
          auth: true,
          tint: "from-violet-50 to-indigo-50 ring-violet-200",
        },
        {
          href: "/planes",
          emoji: "🗓",
          icon: Calendar,
          titulo: "Planes de lectura",
          desc: "Recorridos guiados por días",
          auth: true,
          tint: "from-blue-50 to-cyan-50 ring-blue-200",
        },
        {
          href: "/diario",
          emoji: "📓",
          icon: NotebookPen,
          titulo: "Diario espiritual",
          desc: "Notas, oraciones y reflexiones",
          auth: true,
          premium: true,
          tint: "from-yellow-50 to-amber-50 ring-yellow-200",
        },
      ],
    },
    {
      titulo: "💝 Personal",
      items: [
        {
          href: "/oracion",
          emoji: "🙏",
          icon: Heart,
          titulo: "Oración",
          desc: "Tu lista de peticiones",
          auth: true,
          tint: "from-purple-50 to-fuchsia-50 ring-purple-200",
        },
        {
          href: "/guardados",
          emoji: "🔖",
          icon: Bookmark,
          titulo: "Guardados",
          desc: "Versículos marcados como favoritos",
          auth: true,
          tint: "from-amber-50 to-yellow-50 ring-amber-200",
        },
        {
          href: "/historial",
          emoji: "📜",
          icon: History,
          titulo: "Historial",
          desc: "Versículos que ya viste",
          auth: true,
          tint: "from-stone-50 to-neutral-50 ring-stone-200",
        },
      ],
    },
    {
      titulo: "⚙️ Cuenta",
      items: autenticado
        ? [
            {
              href: "/ajustes",
              emoji: "⚙️",
              icon: Settings,
              titulo: "Ajustes",
              desc: "Perfil, versión, recordatorios, tema",
              auth: true,
              tint: "from-stone-50 to-neutral-50 ring-stone-200",
            },
            {
              href: "/premium",
              emoji: "👑",
              icon: Crown,
              titulo: "Premium",
              desc: "Más funciones sin anuncios",
              tint: "from-amber-100 to-yellow-100 ring-amber-300",
            },
          ]
        : [
            {
              href: "/signin",
              emoji: "🔓",
              icon: LogIn,
              titulo: "Iniciar sesión",
              desc: "Entrá con tu cuenta",
              tint: "from-stone-50 to-neutral-50 ring-stone-200",
            },
            {
              href: "/signup",
              emoji: "✨",
              icon: UserPlus,
              titulo: "Crear cuenta",
              desc: "Empezá tu camino — es gratis",
              tint: "from-emerald-50 to-teal-50 ring-emerald-200",
            },
            {
              href: "/premium",
              emoji: "👑",
              icon: Crown,
              titulo: "Premium",
              desc: "Más funciones sin anuncios",
              tint: "from-amber-100 to-yellow-100 ring-amber-300",
            },
          ],
    },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:py-14">
      <header className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
          Todas las secciones
        </p>
        <h1 className="mt-2 font-serif text-3xl text-stone-900 sm:text-4xl">
          ¿Qué querés hacer hoy?
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
          Atajo a cada parte de la app, sin perderse.
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {secciones.map((s) => (
          <section key={s.titulo}>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              {s.titulo}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {s.items.map((item) => {
                const necesitaLogin = item.auth && !autenticado;
                const href = necesitaLogin
                  ? `/signin?next=${encodeURIComponent(item.href)}`
                  : item.href;

                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 ring-1 transition hover:scale-[1.02] hover:shadow-md active:scale-100 ${item.tint}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{item.emoji}</span>
                      {item.premium && (
                        <span className="inline-flex items-center rounded-full bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-900">
                          Pro
                        </span>
                      )}
                      {necesitaLogin && (
                        <span className="inline-flex items-center rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-600">
                          Login
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 font-serif text-base leading-tight text-stone-900">
                      {item.titulo}
                    </h3>
                    <p className="mt-1 text-[11px] leading-snug text-stone-600">
                      {item.desc}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Footer mini con credit/info */}
      <footer className="mt-16 border-t border-stone-200 pt-6 text-center text-xs text-stone-500">
        <p>
          ¿No encontrás algo? Escribime un mail desde{" "}
          <Link href="/ajustes" className="underline-offset-2 hover:underline">
            Ajustes
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { Home } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { listarVersionesParaUsuario, CODIGO_RV1909 } from "@/lib/versiones-biblia";
import { SelectorVersionHeader } from "@/components/SelectorVersionHeader";
import { WidgetRacha } from "@/components/WidgetRacha";

// Solo visible en desktop (sm en adelante). Mobile usa NavMobile (tab bar).
const navIzquierda =
  "fixed left-3 top-3 z-50 hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm border border-neutral-200/70 hover:text-stone-900 transition";

const navDerecha =
  "fixed right-3 top-3 z-50 hidden sm:flex items-center gap-3 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 text-sm text-neutral-600 shadow-sm border border-neutral-200/70";

export async function HeaderUsuario() {
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);

  // Resolver versión preferida (no creamos anónimo aquí — la creación
  // ocurre cuando el usuario elige una versión vía la action).
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  let preferidaId: number | null = null;
  if (usuarioId) {
    const u = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { versionPrefId: true },
    });
    preferidaId = u?.versionPrefId ?? null;
  }
  const versiones = await listarVersionesParaUsuario(usuarioId);

  return (
    <>
      {/* Botón Inicio — solo va a /inicio si hay sesión real. Sin sesión va a landing. */}
      <Link
        href={sesion?.user?.id ? "/inicio" : "/"}
        className={navIzquierda}
        aria-label="Inicio"
      >
        <Home className="size-4" aria-hidden />
        <span>Inicio</span>
      </Link>

      {/* Mobile: chip racha + selector de versión, top-right */}
      <div className="fixed right-3 top-3 z-50 flex items-center gap-1.5 sm:hidden">
        {sesion?.user && usuarioId && (
          <Link href="/estadisticas" aria-label="Tu caminar">
            <WidgetRacha usuarioId={usuarioId} variante="compact" />
          </Link>
        )}
        <SelectorVersionHeader
          versiones={versiones.map((v) => ({
            id: v.id,
            codigo: v.codigo,
            nombre: v.nombre,
            esApi: v.esApi,
          }))}
          preferidaId={preferidaId}
          defaultCodigo={CODIGO_RV1909}
        />
      </div>

      {/* Selector + Menu derecho (desktop) */}
      <nav className={navDerecha}>
        <SelectorVersionHeader
          versiones={versiones.map((v) => ({
            id: v.id,
            codigo: v.codigo,
            nombre: v.nombre,
            esApi: v.esApi,
          }))}
          preferidaId={preferidaId}
          defaultCodigo={CODIGO_RV1909}
        />
        {sesion?.user && usuarioId && (
          <Link href="/estadisticas" className="inline-flex" title="Tu caminar">
            <WidgetRacha usuarioId={usuarioId} variante="compact" />
          </Link>
        )}
        <span aria-hidden="true" className="text-neutral-300">·</span>
        {!sesion?.user ? (
          <>
            <Link href="/menu" className="hover:text-neutral-900">
              Menú
            </Link>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <Link href="/signin" className="hover:text-neutral-900">
              Entrar
            </Link>
          </>
        ) : (
          <>
            <Link href="/buscar" className="hover:text-neutral-900" title="Buscar">
              🔍
            </Link>
            {/* Trivia + Oración solo en md+ para no atropellar en tablet pequeño */}
            <span aria-hidden="true" className="hidden text-neutral-300 md:inline">·</span>
            <Link
              href="/trivia"
              className="hidden hover:text-neutral-900 md:inline"
              title="Trivia bíblica"
            >
              🎮
            </Link>
            <span aria-hidden="true" className="hidden text-neutral-300 md:inline">·</span>
            <Link href="/oracion" className="hidden hover:text-neutral-900 md:inline">
              Oración
            </Link>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <Link href="/menu" className="hover:text-neutral-900">
              Menú
            </Link>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <Link
              href="/ajustes"
              className="font-medium text-neutral-800 hover:text-neutral-900"
            >
              {nombreCorto(sesion.user.name, sesion.user.email)}
            </Link>
          </>
        )}
      </nav>
    </>
  );
}

function nombreCorto(name: string | null | undefined, email: string | null | undefined) {
  if (name) {
    const primero = name.split(/\s+/)[0];
    return primero ?? "Mi cuenta";
  }
  if (email) return email.split("@")[0];
  return "Mi cuenta";
}

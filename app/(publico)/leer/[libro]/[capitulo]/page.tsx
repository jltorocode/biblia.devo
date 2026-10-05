import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { LIBROS_POR_CODIGO } from "@/lib/libros";
import { LectorCapitulo } from "@/components/LectorCapitulo";
import { planDeUsuario } from "@/lib/plan-limits";
import { esColorValido, type ColorSubrayado } from "@/lib/subrayados";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { capituloEnVersion } from "@/lib/versiculo-en-version";
import { tituloCapitulo as tituloDeCapitulo } from "@/lib/capitulos-titulos";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ libro: string; capitulo: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { libro, capitulo } = await params;
  const info = LIBROS_POR_CODIGO.get(libro);
  if (!info) return { title: "Capítulo no encontrado" };
  return {
    title: `${info.nombre} ${capitulo}`,
    description: `${info.nombre} capítulo ${capitulo} — Reina-Valera 1909.`,
  };
}

export default async function CapituloPage({ params }: Props) {
  const { libro, capitulo: capParam } = await params;
  const info = LIBROS_POR_CODIGO.get(libro);
  if (!info) notFound();
  const capitulo = Number(capParam);
  if (!Number.isInteger(capitulo) || capitulo < 1 || capitulo > info.numCapitulos) {
    notFound();
  }

  const libroRow = await prisma.libro.findUnique({
    where: { codigo: libro },
    select: { id: true },
  });
  if (!libroRow) notFound();

  // SIEMPRE leemos la base RV1909 (es donde viven embeddings/subrayados).
  // El helper `capituloEnVersion` swappea texto a la versión preferida.
  const rv1909 = await prisma.versionBiblia.findUnique({
    where: { codigo: "rv1909" },
    select: { id: true },
  });
  if (!rv1909) notFound();

  const versiculos = await prisma.versiculo.findMany({
    where: { versionId: rv1909.id, libroId: libroRow.id, capitulo },
    orderBy: { versiculo: "asc" },
    select: { id: true, versiculo: true, texto: true },
  });

  // Subrayados existentes para esos versiculos (solo si esta logueado).
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  const autenticado = !!sesion?.user?.id;

  let subrayadosPorId = new Map<string, ColorSubrayado>();
  let esPremium = false;
  if (autenticado) {
    const ids = versiculos.map((v) => v.id);
    const guardados = await prisma.versiculoGuardado.findMany({
      where: {
        usuarioId: sesion!.user!.id,
        versiculoId: { in: ids },
        color: { not: null },
      },
      select: { versiculoId: true, color: true },
    });
    subrayadosPorId = new Map(
      guardados
        .filter((g) => esColorValido(g.color))
        .map((g) => [g.versiculoId.toString(), g.color as ColorSubrayado]),
    );

    const usuario = await prisma.usuario.findUnique({
      where: { id: sesion!.user!.id },
      select: { premiumHasta: true },
    });
    esPremium = planDeUsuario(usuario?.premiumHasta) === "PREMIUM";
  }

  // Resolver version preferida del usuario (incluye anonimos via cookie).
  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  const versionPrefId = usuarioId
    ? (
        await prisma.usuario.findUnique({
          where: { id: usuarioId },
          select: { versionPrefId: true },
        })
      )?.versionPrefId ?? null
    : null;

  // Buscamos el codigo de la version local de los versos (todos son misma version).
  const versionLocalCodigo =
    versiculos.length > 0
      ? (
          await prisma.versiculo.findUnique({
            where: { id: versiculos[0].id },
            select: { version: { select: { codigo: true } } },
          })
        )?.version.codigo ?? "rv1909"
      : "rv1909";

  const versosLocales = versiculos.map((v) => ({ versiculo: v.versiculo, texto: v.texto }));
  const display = await capituloEnVersion({
    versionPrefId,
    libroCodigo: info.codigo,
    capitulo,
    versosLocales,
    versionLocalCodigo,
  });

  // Mapear los textos del display de vuelta sobre los ids locales (para
  // que los subrayados sigan funcionando). Si la API devuelve mas/menos
  // versos, usamos el join por numero — si no matchea, caemos al local.
  const displayPorNumero = new Map(display.versos.map((v) => [v.versiculo, v.texto]));
  const versiculosConSubrayado = versiculos.map((v) => ({
    id: v.id.toString(),
    versiculo: v.versiculo,
    texto: displayPorNumero.get(v.versiculo) ?? v.texto,
    colorInicial: subrayadosPorId.get(v.id.toString()) ?? null,
  }));

  const capAnterior = capitulo > 1 ? capitulo - 1 : null;
  const capSiguiente = capitulo < info.numCapitulos ? capitulo + 1 : null;

  return (
    <LectorCapitulo
      libroNombre={info.nombre}
      libroCodigo={info.codigo}
      capitulo={capitulo}
      tituloCapitulo={tituloDeCapitulo(info.codigo, capitulo)}
      versiculos={versiculosConSubrayado}
      capAnterior={capAnterior}
      capSiguiente={capSiguiente}
      autenticado={autenticado}
      esPremium={esPremium}
      versionNombre={display.version?.nombre ?? "Reina-Valera 1909"}
      fallbackVersion={display.fallback}
    />
  );
}

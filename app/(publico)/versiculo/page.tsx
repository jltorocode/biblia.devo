import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { pedirVersiculo } from "@/lib/rotacion";
import { resolverUsuarioId } from "@/lib/usuario-actual";
import { ESTADOS_POR_SLUG } from "@/lib/estados";
import { PantallaVersiculo } from "@/components/PantallaVersiculo";
import { debeSerVistaPrevia } from "@/lib/entradas";
import { planDeUsuario } from "@/lib/plan-limits";
import { AREAS_POR_SLUG, esAreaValida } from "@/lib/areas";
import { textoEnVersion } from "@/lib/versiculo-en-version";
import { getTemaActual } from "@/lib/tema-actual";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface Props {
  searchParams: Promise<{ estado?: string; area?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { estado } = await searchParams;
  const info = estado ? ESTADOS_POR_SLUG.get(estado) : undefined;
  if (!info) {
    return { title: "Versiculo" };
  }
  const titulo = `Para cuando te sientes ${info.nombre.toLowerCase()}`;
  const descripcion = info.fraseAliento;
  const url = `${APP_URL}/versiculo?estado=${encodeURIComponent(estado!)}`;
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: url },
    openGraph: {
      title: titulo,
      description: descripcion,
      url,
      siteName: "Devocional",
      locale: "es",
      type: "article",
      images: [{ url: `${APP_URL}/icons/icon-512.png`, width: 512, height: 512 }],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      images: [`${APP_URL}/icons/icon-512.png`],
    },
  };
}

export default async function VersiculoPage({ searchParams }: Props) {
  const { estado, area: areaParam } = await searchParams;
  if (!estado || !ESTADOS_POR_SLUG.has(estado)) {
    redirect("/");
  }
  const area = esAreaValida(areaParam) ? areaParam : null;
  const areaInfo = area ? AREAS_POR_SLUG.get(area) : null;

  const usuarioId = await resolverUsuarioId({ crearSiNoExiste: false });
  if (!usuarioId) {
    // El SelectorEstado redirige vía Server Action (que sí setea cookie).
    // Si alguien aterriza acá directo sin cookie, lo volvemos al inicio.
    redirect("/");
  }

  // Determinar plan para aplicar el limite "1 entrada/dia" en free.
  const usuarioRow = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { premiumHasta: true, versionPrefId: true },
  });
  const esPremium = planDeUsuario(usuarioRow?.premiumHasta) === "PREMIUM";

  const vistaPrevia = await debeSerVistaPrevia({
    usuarioId,
    estadoSlug: estado,
    esPremium,
  });

  let resultado;
  try {
    resultado = await pedirVersiculo(usuarioId, estado, {
      sinEntrada: vistaPrevia,
      area,
    });
  } catch {
    redirect("/");
  }

  // Sesion autenticada? (define si el BotonGuardar funciona)
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  const autenticado = !!sesion?.user?.id;

  // Estado actual del guardado para precargar el heart
  let guardadoInicial = false;
  if (autenticado) {
    const yaGuardado = await prisma.versiculoGuardado.findUnique({
      where: {
        usuarioId_versiculoId: {
          usuarioId: sesion!.user!.id,
          versiculoId: resultado.versiculo.id,
        },
      },
      select: { id: true },
    });
    guardadoInicial = !!yaGuardado;
  }

  // Buscamos el nombre humano de la version local (RV1909) para fallback.
  const versionLocalNombre =
    (await prisma.versionBiblia.findUnique({
      where: { codigo: resultado.versionCodigo },
      select: { nombre: true },
    }))?.nombre ?? resultado.versionCodigo.toUpperCase();

  // Si el usuario tiene una version preferida (api.bible), traducimos.
  // Si no, devuelve el texto local intacto.
  const tema = await getTemaActual();

  const display = await textoEnVersion(
    {
      libroCodigo: resultado.libro.codigo,
      capitulo: resultado.versiculo.capitulo,
      versiculo: resultado.versiculo.versiculo,
      textoLocal: resultado.versiculo.texto,
      versionLocalNombre,
      versionLocalCodigo: resultado.versionCodigo,
    },
    usuarioRow?.versionPrefId ?? null,
  );

  const referencia = `${resultado.libro.nombre} ${resultado.versiculo.capitulo}:${resultado.versiculo.versiculo}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quotation",
    text: display.texto,
    spokenByCharacter: `Biblia ${display.versionNombre}`,
    citation: referencia,
    inLanguage: "es",
    isFamilyFriendly: true,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PantallaVersiculo
        versiculoId={resultado.versiculo.id.toString()}
        texto={display.texto}
        capitulo={resultado.versiculo.capitulo}
        versiculo={resultado.versiculo.versiculo}
        libro={resultado.libro}
        estado={resultado.estado}
        fraseAliento={resultado.fraseAliento}
        versionCodigo={display.versionCodigo}
        versionNombre={display.versionNombre}
        copyright={display.copyright}
        fallbackVersion={display.fallback}
        autenticado={autenticado}
        guardadoInicial={guardadoInicial}
        entradaId={resultado.entrada.id ? resultado.entrada.id.toString() : null}
        notaInicial={resultado.entrada.nota ?? ""}
        vistaPrevia={vistaPrevia}
        area={areaInfo ? { nombre: areaInfo.nombre, emoji: areaInfo.emoji } : null}
        temaSlug={tema.slug}
      />
    </>
  );
}

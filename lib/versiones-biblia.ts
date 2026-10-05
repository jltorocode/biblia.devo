// Helpers para resolver versiones de Biblia, sea local (RV1909, embebida en
// nuestra DB) o remota (vía api.bible).

import { prisma } from "@/lib/db/prisma";

export const CODIGO_RV1909 = "rv1909";

export interface VersionResuelta {
  id: number;
  codigo: string;
  nombre: string;
  esApi: boolean;
  apiId: string | null;
  esPremium: boolean;
  activa: boolean;
  esGlobal: boolean;
}

/**
 * Para mapear "esto es local vs api.bible" usamos el campo `codigo`:
 *  - `rv1909` → local (texto en DB)
 *  - cualquier otro → api.bible, donde `licencia` lleva el bibleId
 *
 * Es pragmatico (no tocamos el schema). Si se quiere mas tipado, agregar
 * columna `source` + `api_id`.
 */
function parseLicencia(lic: string | null): { source: string; apiId?: string } {
  if (!lic) return { source: "local" };
  if (lic.startsWith("api.bible:")) {
    return { source: "api.bible", apiId: lic.split(":")[1] };
  }
  return { source: lic };
}

function mapear(r: {
  id: number;
  codigo: string;
  nombre: string;
  esPremium: boolean;
  activa: boolean;
  esGlobal: boolean;
  licencia: string | null;
}): VersionResuelta {
  const parsed = parseLicencia(r.licencia);
  return {
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    esApi: parsed.source === "api.bible",
    apiId: parsed.apiId ?? null,
    esPremium: r.esPremium,
    activa: r.activa,
    esGlobal: r.esGlobal,
  };
}

/**
 * Versiones que un usuario puede VER y SELECCIONAR:
 *  - activa = true
 *  - (esGlobal = true)  OR
 *  - (esGlobal = false  AND  usuario tiene permiso explicito en version_usuario)
 *
 * Si `usuarioId` es null → solo las globales activas.
 */
export async function listarVersionesParaUsuario(
  usuarioId: string | null,
): Promise<VersionResuelta[]> {
  const rows = await prisma.versionBiblia.findMany({
    where: {
      activa: true,
      OR: usuarioId
        ? [
            { esGlobal: true },
            { esGlobal: false, permisos: { some: { usuarioId } } },
          ]
        : [{ esGlobal: true }],
    },
    orderBy: [{ esDefault: "desc" }, { nombre: "asc" }],
  });
  return rows.map(mapear);
}

/**
 * TODAS las versiones (incluso inactivas/privadas). Solo para /admin.
 */
export async function listarVersionesTodas(): Promise<VersionResuelta[]> {
  const rows = await prisma.versionBiblia.findMany({
    orderBy: [{ esDefault: "desc" }, { nombre: "asc" }],
  });
  return rows.map(mapear);
}

/**
 * @deprecated Usar `listarVersionesParaUsuario` o `listarVersionesTodas`.
 * Devuelve solo las globales activas (compat con call sites viejos).
 */
export async function listarVersiones(): Promise<VersionResuelta[]> {
  return listarVersionesParaUsuario(null);
}

export async function resolverVersion(id: number | null): Promise<VersionResuelta | null> {
  if (!id) return null;
  const r = await prisma.versionBiblia.findUnique({ where: { id } });
  if (!r) return null;
  return mapear(r);
}

export async function versionPorCodigo(codigo: string): Promise<VersionResuelta | null> {
  const r = await prisma.versionBiblia.findUnique({ where: { codigo } });
  if (!r) return null;
  return mapear(r);
}

/**
 * Chequea si el usuario PUEDE usar esta version (activa + global o permiso).
 * Importante para validar en cambiarVersionPrefAction.
 */
export async function usuarioPuedeUsarVersion(
  usuarioId: string,
  versionId: number,
): Promise<boolean> {
  const v = await prisma.versionBiblia.findUnique({
    where: { id: versionId },
    select: { activa: true, esGlobal: true },
  });
  if (!v || !v.activa) return false;
  if (v.esGlobal) return true;
  const permiso = await prisma.versionUsuario.findUnique({
    where: { versionId_usuarioId: { versionId, usuarioId } },
  });
  return !!permiso;
}

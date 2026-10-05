// Helpers para la lista de peticiones de oración del usuario.

import { prisma } from "@/lib/db/prisma";

export type EstadoPeticion = "pendiente" | "respondida" | "archivada";
export type CategoriaPeticion =
  | "familia"
  | "salud"
  | "trabajo"
  | "finanzas"
  | "espiritual"
  | "otro";

export const CATEGORIAS: Array<{ slug: CategoriaPeticion; nombre: string; emoji: string }> = [
  { slug: "familia", nombre: "Familia", emoji: "👨‍👩‍👧" },
  { slug: "salud", nombre: "Salud", emoji: "🩺" },
  { slug: "trabajo", nombre: "Trabajo", emoji: "💼" },
  { slug: "finanzas", nombre: "Finanzas", emoji: "💰" },
  { slug: "espiritual", nombre: "Espiritual", emoji: "🙏" },
  { slug: "otro", nombre: "Otro", emoji: "✨" },
];

export const CATEGORIAS_POR_SLUG = new Map(CATEGORIAS.map((c) => [c.slug, c] as const));

export interface PeticionDTO {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: CategoriaPeticion;
  estado: EstadoPeticion;
  respuesta: string | null;
  fechaPedida: string;
  fechaRespondida: string | null;
}

function aDTO(p: {
  id: bigint;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  estado: string;
  respuesta: string | null;
  fechaPedida: Date;
  fechaRespondida: Date | null;
}): PeticionDTO {
  return {
    id: p.id.toString(),
    titulo: p.titulo,
    descripcion: p.descripcion,
    categoria: p.categoria as CategoriaPeticion,
    estado: p.estado as EstadoPeticion,
    respuesta: p.respuesta,
    fechaPedida: p.fechaPedida.toISOString(),
    fechaRespondida: p.fechaRespondida?.toISOString() ?? null,
  };
}

export async function listarPeticiones(
  usuarioId: string,
  opts: { estado?: EstadoPeticion; categoria?: CategoriaPeticion } = {},
): Promise<PeticionDTO[]> {
  const filas = await prisma.peticion.findMany({
    where: {
      usuarioId,
      estado: opts.estado ?? undefined,
      categoria: opts.categoria ?? undefined,
    },
    orderBy: [{ estado: "asc" }, { fechaPedida: "desc" }],
  });
  return filas.map(aDTO);
}

export async function obtenerPeticion(id: string, usuarioId: string): Promise<PeticionDTO | null> {
  const p = await prisma.peticion.findUnique({ where: { id: BigInt(id) } });
  if (!p || p.usuarioId !== usuarioId) return null;
  return aDTO(p);
}

export async function contarPorEstado(usuarioId: string) {
  const filas = await prisma.peticion.groupBy({
    by: ["estado"],
    where: { usuarioId },
    _count: { _all: true },
  });
  const out: Record<EstadoPeticion, number> = { pendiente: 0, respondida: 0, archivada: 0 };
  for (const f of filas) out[f.estado as EstadoPeticion] = f._count._all;
  return out;
}

// Colores de subrayado — pensados como marcador real (tonos 200 de tailwind,
// semi-transparentes para que el texto encima siga legible).

export type ColorSubrayado = "amarillo" | "rosa" | "azul" | "verde";

export interface ColorInfo {
  slug: ColorSubrayado;
  nombre: string;
  hex: string;     // color base
  bg: string;      // bg semi-transparente para pintar el verso
}

export const COLORES: readonly ColorInfo[] = [
  { slug: "amarillo", nombre: "Amarillo", hex: "#fde047", bg: "rgba(254, 240, 138, 0.55)" },
  { slug: "rosa",     nombre: "Rosa",     hex: "#f9a8d4", bg: "rgba(251, 207, 232, 0.55)" },
  { slug: "azul",     nombre: "Azul",     hex: "#93c5fd", bg: "rgba(191, 219, 254, 0.55)" },
  { slug: "verde",    nombre: "Verde",    hex: "#86efac", bg: "rgba(187, 247, 208, 0.55)" },
] as const;

export const COLORES_POR_SLUG = new Map(COLORES.map((c) => [c.slug, c]));

export function esColorValido(c: string | undefined | null): c is ColorSubrayado {
  return !!c && COLORES_POR_SLUG.has(c as ColorSubrayado);
}

/** Color por defecto (gratis solo este). */
export const COLOR_DEFAULT: ColorSubrayado = "amarillo";

/** Colores que un plan puede usar. */
export function coloresPermitidos(esPremium: boolean): ColorSubrayado[] {
  return esPremium ? COLORES.map((c) => c.slug) : [COLOR_DEFAULT];
}

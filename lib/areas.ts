// Las "áreas" del Modo 3 (conversación). El usuario eligio un estado y se le
// pregunta por que — la respuesta entra como `area` en la entrada.
//
// No filtran versiculos por ahora (no hay clasificacion area×estado curada);
// solo se guardan como contexto del diario para el premium "historia diaria".

export const AREAS = [
  { slug: "trabajo", nombre: "Trabajo", emoji: "💼" },
  { slug: "pareja", nombre: "Pareja", emoji: "💕" },
  { slug: "familia", nombre: "Familia", emoji: "🏠" },
  { slug: "amistad", nombre: "Amistad", emoji: "🤝" },
  { slug: "salud", nombre: "Salud", emoji: "🌱" },
  { slug: "dinero", nombre: "Dinero", emoji: "💰" },
  { slug: "fe", nombre: "Mi fe", emoji: "✝️" },
  { slug: "otra", nombre: "Otra cosa", emoji: "✨" },
] as const;

export type AreaSlug = (typeof AREAS)[number]["slug"];

export const AREAS_POR_SLUG = new Map(AREAS.map((a) => [a.slug, a]));

export function esAreaValida(slug: string | undefined | null): slug is AreaSlug {
  return !!slug && AREAS_POR_SLUG.has(slug as AreaSlug);
}

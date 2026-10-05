// Temas visuales — pensados para una estetica de devocional cristiano /
// catolico. Sin colores chillones, sin "modo gamer". Tipografias serif
// clasicas que evocan la imprenta del libro biblico.

export type FontKey = "lora" | "garamond" | "cardo";

export interface Tema {
  slug: string;
  nombre: string;
  descripcion: string;
  /** Paleta — colores en hex */
  bg: string;
  bgCard: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  ornament: string;
  font: FontKey;
}

export const TEMAS: readonly Tema[] = [
  {
    slug: "pergamino",
    nombre: "Pergamino",
    descripcion: "Papel envejecido y tinta sepia. El clasico.",
    bg: "#faf7f2",
    bgCard: "#ffffff",
    text: "#2b2b2b",
    textMuted: "#888888",
    accent: "#5b4636",
    accentSoft: "#e8dccd",
    ornament: "#c8a87a",
    font: "lora",
  },
  {
    slug: "capilla",
    nombre: "Capilla",
    descripcion: "Luz de vela. Calida, contemplativa.",
    bg: "#f5ede0",
    bgCard: "#fffaf0",
    text: "#3a2a1a",
    textMuted: "#8c7556",
    accent: "#8b6f47",
    accentSoft: "#e7d8be",
    ornament: "#b8945f",
    font: "garamond",
  },
  {
    slug: "cielo",
    nombre: "Cielo",
    descripcion: "Mañana clara. Sereno, esperanzado.",
    bg: "#eef3f8",
    bgCard: "#ffffff",
    text: "#1f2a3a",
    textMuted: "#6a7689",
    accent: "#3a5a7a",
    accentSoft: "#d4dde8",
    ornament: "#85a5c4",
    font: "garamond",
  },
  {
    slug: "monasterio",
    nombre: "Monasterio",
    descripcion: "Piedra y silencio. Sobrio, monastico.",
    bg: "#ebe6dc",
    bgCard: "#f7f3eb",
    text: "#2c2820",
    textMuted: "#7a7264",
    accent: "#4a4035",
    accentSoft: "#d8d0bf",
    ornament: "#9a8e75",
    font: "cardo",
  },
  {
    slug: "olivo",
    nombre: "Olivo",
    descripcion: "Tierra santa. Verde olivo y arena.",
    bg: "#f4eee0",
    bgCard: "#fff9ec",
    text: "#2d2b1b",
    textMuted: "#7e7858",
    accent: "#6b7a3a",
    accentSoft: "#dbdebc",
    ornament: "#a3b06b",
    font: "garamond",
  },
] as const;

export const TEMAS_POR_SLUG = new Map(TEMAS.map((t) => [t.slug, t]));

export const TEMA_POR_DEFECTO = TEMAS[0]!;

export function temaPorSlug(slug: string | undefined | null): Tema {
  if (!slug) return TEMA_POR_DEFECTO;
  return TEMAS_POR_SLUG.get(slug) ?? TEMA_POR_DEFECTO;
}

/** Genera el bloque de CSS variables para inyectar en el <html data-theme="x">. */
export function temaACss(t: Tema): React.CSSProperties {
  return {
    "--devo-bg": t.bg,
    "--devo-bg-card": t.bgCard,
    "--devo-text": t.text,
    "--devo-text-muted": t.textMuted,
    "--devo-accent": t.accent,
    "--devo-accent-soft": t.accentSoft,
    "--devo-ornament": t.ornament,
    "--devo-font-serif": `var(--font-${t.font === "lora" ? "lora" : t.font === "garamond" ? "eb-garamond" : "cardo"}), Georgia, serif`,
  } as React.CSSProperties;
}

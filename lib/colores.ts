// Utilidades para los tonos suaves derivados de cada estado de animo.

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  if (h.length !== 6) return { r: 200, g: 200, b: 200 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Devuelve una variante muy desaturada (mezclada con blanco) del color
 * del estado, lista para usar como background-color. Conserva el matiz
 * pero queda casi blanco.
 */
export function tintFondo(hex: string | null | undefined, alpha = 0.16): string {
  if (!hex) return "rgba(255,255,255,1)";
  const { r, g, b } = hexToRgb(hex);
  // Mezcla con blanco al `1 - alpha` para evitar saturar la pantalla.
  const mix = (c: number) => Math.round(c * alpha + 255 * (1 - alpha));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/**
 * Variante mas marcada — para acentos (bordes finos, separadores, emoji bg).
 */
export function tintAccent(hex: string | null | undefined, alpha = 0.35): string {
  if (!hex) return "rgba(0,0,0,0.06)";
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

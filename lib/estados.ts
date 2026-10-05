// Los 13 estados de animo. Fuente unica de verdad — consumida por seed-estados
// y, mas adelante, por el SelectorEstado y el SEO de /versiculo.

export type Categoria = "dificil" | "neutral" | "positivo";

export interface EstadoInfo {
  slug: string;
  nombre: string;
  descripcion?: string;
  emoji: string;
  colorHex: string;
  fraseAliento: string;
  categoria: Categoria;
  orden: number;
}

export const ESTADOS: readonly EstadoInfo[] = [
  // ─── Dificiles ───
  {
    slug: "ansioso",
    nombre: "Ansioso o preocupado",
    descripcion: "Cuando la mente no para y el pecho aprieta.",
    emoji: "😰",
    colorHex: "#74b9ff",
    fraseAliento: "Dios está contigo en este momento. Puedes soltar esa carga.",
    categoria: "dificil",
    orden: 1,
  },
  {
    slug: "triste",
    nombre: "Triste o desanimado",
    descripcion: "El día se siente gris y el alma cansada.",
    emoji: "😢",
    colorHex: "#a29bfe",
    fraseAliento: "Tu dolor importa. Dios no te abandona en el valle.",
    categoria: "dificil",
    orden: 2,
  },
  {
    slug: "solo",
    nombre: "Solo o abandonado",
    descripcion: "Cuando parece que nadie escucha.",
    emoji: "😔",
    colorHex: "#fd79a8",
    fraseAliento: "Nunca estás solo. Su presencia es real y constante.",
    categoria: "dificil",
    orden: 3,
  },
  {
    slug: "con_miedo",
    nombre: "Con miedo o temor",
    descripcion: "Frente a algo más grande que tú.",
    emoji: "😨",
    colorHex: "#fdcb6e",
    fraseAliento: "El miedo no tiene la última palabra. Él sí.",
    categoria: "dificil",
    orden: 4,
  },
  {
    slug: "enojado",
    nombre: "Enojado o frustrado",
    descripcion: "Algo te dolió, algo no salió.",
    emoji: "😤",
    colorHex: "#ff7675",
    fraseAliento: "Es válido lo que sentís. Dios puede con esa frustración también.",
    categoria: "dificil",
    orden: 5,
  },
  {
    slug: "culpable",
    nombre: "Con culpa o vergüenza",
    descripcion: "Algo pesa adentro y no te suelta.",
    emoji: "😓",
    colorHex: "#00b894",
    fraseAliento: "No hay culpa que su gracia no cubra. Sos perdonado/a.",
    categoria: "dificil",
    orden: 6,
  },
  {
    slug: "cansado",
    nombre: "Cansado o agotado",
    descripcion: "Ya no podés más, y está bien decirlo.",
    emoji: "😮‍💨",
    colorHex: "#636e72",
    fraseAliento: "Podés descansar. Él carga lo que ya no podés.",
    categoria: "dificil",
    orden: 7,
  },
  {
    slug: "desesperanzado",
    nombre: "Sin esperanza",
    descripcion: "Cuando el horizonte se ve cerrado.",
    emoji: "🌑",
    colorHex: "#6c5ce7",
    fraseAliento: "La esperanza no terminó. Él tiene un plan que aún no ves.",
    categoria: "dificil",
    orden: 8,
  },

  // ─── Neutrales ───
  {
    slug: "buscando_direccion",
    nombre: "Buscando dirección",
    descripcion: "Una decisión, un camino por elegir.",
    emoji: "🧭",
    colorHex: "#0984e3",
    fraseAliento: "Él guía a los que le piden. Pedile.",
    categoria: "neutral",
    orden: 9,
  },
  {
    slug: "necesitando_fe",
    nombre: "Necesitando fe",
    descripcion: "Necesitás creer de nuevo.",
    emoji: "💪",
    colorHex: "#e17055",
    fraseAliento: "La fe del tamaño de una semilla mueve montañas.",
    categoria: "neutral",
    orden: 10,
  },
  {
    slug: "en_prueba",
    nombre: "Atravesando una prueba",
    descripcion: "Estás en medio de algo difícil.",
    emoji: "⛰️",
    colorHex: "#b2bec3",
    fraseAliento: "Esta prueba no te define, te forma.",
    categoria: "neutral",
    orden: 11,
  },

  // ─── Positivos ───
  {
    slug: "feliz_agradecido",
    nombre: "Feliz y agradecido",
    descripcion: "Hoy hay algo para celebrar.",
    emoji: "😊",
    colorHex: "#fdcb6e",
    fraseAliento: "¡Celebrá! Dios se alegra con vos.",
    categoria: "positivo",
    orden: 12,
  },
  {
    slug: "general",
    nombre: "Solo busco una palabra",
    descripcion: "Sin etiqueta hoy, pero queres leer.",
    emoji: "📖",
    colorHex: "#c9b8f0",
    fraseAliento: "La Palabra de Dios es viva. Recibila hoy.",
    categoria: "positivo",
    orden: 13,
  },
];

export const ESTADOS_POR_SLUG: ReadonlyMap<string, EstadoInfo> = new Map(
  ESTADOS.map((e) => [e.slug, e]),
);

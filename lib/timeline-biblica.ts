// Línea de tiempo bíblica — catálogo de hitos y eras.
// Datos curados, descripciones originales (sin reproducir texto bíblico).

export interface VersoClave {
  libro: string; // OSIS
  capInicio: number;
  capFin?: number;
  vInicio?: number;
  vFin?: number;
  ref: string; // texto humano
}

export type TipoHito =
  | "creacion"
  | "pacto"
  | "promesa"
  | "milagro"
  | "profecia"
  | "cumplimiento"
  | "juicio"
  | "redencion"
  | "fundacion"
  | "transicion";

export interface Hito {
  slug: string;
  era: EraSlug;
  emoji: string;
  titulo: string;
  anio: string;
  anioOrden: number; // negativo = a.C., positivo = d.C.
  tipo?: TipoHito;
  descripcion: string;
  significado?: string; // una línea — la "noticia" del hito
  versosClaves: VersoClave[];
  librosDelPeriodo: string[]; // codigos OSIS
}

export type EraSlug =
  | "origen"
  | "patriarcas"
  | "exodo"
  | "jueces-reyes"
  | "exilio"
  | "retorno"
  | "jesus"
  | "iglesia";

export interface EraColores {
  bg: string;
  border: string;
  text: string;
  ring: string;
  /** gradient para el hero/banner de la era */
  gradient: string;
  /** color sólido para acentos */
  accent: string;
}

export interface Era {
  slug: EraSlug;
  nombre: string;
  emoji: string;
  /** Lema corto. */
  subtitulo: string;
  /** Resumen 1-2 párrafos sobre el contexto histórico-redentor. */
  resumen: string;
  /** Marco temporal aproximado humano. */
  rangoAprox: string;
  /** Figuras protagonistas. */
  personajes: string[];
  /** Cómo Cristo aparece prefigurado o central en esta era. */
  temaCristo: string;
  cls: EraColores;
}

const colorEra = {
  origen: {
    bg: "bg-amber-50/60",
    border: "border-amber-200",
    text: "text-amber-800",
    ring: "ring-amber-200",
    gradient: "from-amber-100 via-amber-50 to-orange-50",
    accent: "bg-amber-500",
  },
  patriarcas: {
    bg: "bg-orange-50/60",
    border: "border-orange-200",
    text: "text-orange-800",
    ring: "ring-orange-200",
    gradient: "from-orange-100 via-orange-50 to-amber-50",
    accent: "bg-orange-500",
  },
  exodo: {
    bg: "bg-yellow-50/60",
    border: "border-yellow-200",
    text: "text-yellow-800",
    ring: "ring-yellow-200",
    gradient: "from-yellow-100 via-yellow-50 to-amber-50",
    accent: "bg-yellow-500",
  },
  "jueces-reyes": {
    bg: "bg-rose-50/60",
    border: "border-rose-200",
    text: "text-rose-800",
    ring: "ring-rose-200",
    gradient: "from-rose-100 via-rose-50 to-pink-50",
    accent: "bg-rose-500",
  },
  exilio: {
    bg: "bg-slate-100/70",
    border: "border-slate-300",
    text: "text-slate-700",
    ring: "ring-slate-300",
    gradient: "from-slate-200 via-slate-100 to-zinc-100",
    accent: "bg-slate-500",
  },
  retorno: {
    bg: "bg-stone-100/70",
    border: "border-stone-300",
    text: "text-stone-700",
    ring: "ring-stone-300",
    gradient: "from-stone-200 via-stone-100 to-amber-50",
    accent: "bg-stone-500",
  },
  jesus: {
    bg: "bg-emerald-50/60",
    border: "border-emerald-200",
    text: "text-emerald-800",
    ring: "ring-emerald-200",
    gradient: "from-emerald-100 via-emerald-50 to-teal-50",
    accent: "bg-emerald-500",
  },
  iglesia: {
    bg: "bg-red-50/60",
    border: "border-red-200",
    text: "text-red-800",
    ring: "ring-red-200",
    gradient: "from-red-100 via-orange-50 to-amber-50",
    accent: "bg-red-500",
  },
} satisfies Record<EraSlug, EraColores>;

export const ERAS: Era[] = [
  {
    slug: "origen",
    nombre: "Origen",
    emoji: "🌅",
    subtitulo: "Antes de todo, Dios",
    rangoAprox: "Principio – ~2100 a.C.",
    resumen:
      "Todo empieza con Dios creando un mundo bueno. La humanidad se rebela y el pecado entra a la historia, pero ya en el primer juicio aparece la primera promesa: un descendiente que aplastará al enemigo. La caída no es la última palabra.",
    personajes: ["Adán y Eva", "Caín y Abel", "Noé", "Sem, Cam, Jafet"],
    temaCristo:
      "La promesa del descendiente que aplastará la cabeza de la serpiente apunta al Mesías que vencerá al pecado en la cruz.",
    cls: colorEra.origen,
  },
  {
    slug: "patriarcas",
    nombre: "Patriarcas",
    emoji: "🏜",
    subtitulo: "Un pueblo desde una promesa",
    rangoAprox: "~2100 – ~1500 a.C.",
    resumen:
      "Dios elige a un hombre, Abraham, y le promete tierra, descendencia y bendición para todas las naciones. La promesa pasa a Isaac, a Jacob (Israel) y a sus doce hijos. Termina la era con Israel asentado en Egipto, listo para crecer como pueblo.",
    personajes: ["Abraham", "Sara", "Isaac", "Jacob/Israel", "José"],
    temaCristo:
      "Cristo es la simiente de Abraham por la cual todas las naciones serían bendecidas, y el verdadero Cordero que reemplaza a Isaac en el monte.",
    cls: colorEra.patriarcas,
  },
  {
    slug: "exodo",
    nombre: "Éxodo y Ley",
    emoji: "📜",
    subtitulo: "De esclavos a pueblo de Dios",
    rangoAprox: "~1500 – ~1400 a.C.",
    resumen:
      "Dios libera a Israel de Egipto con plagas, una Pascua y un mar abierto. En el Sinaí entrega la Ley y construye con ellos una nación-sacerdocio. Tras 40 años de desierto, entran a la tierra prometida bajo Josué.",
    personajes: ["Moisés", "Aarón", "Josué", "Caleb", "María"],
    temaCristo:
      "El Cordero de Pascua, el maná, la roca herida, el tabernáculo: cada elemento de la liberación apunta a Jesús, el verdadero Cordero y el verdadero Templo.",
    cls: colorEra.exodo,
  },
  {
    slug: "jueces-reyes",
    nombre: "Jueces y Reyes",
    emoji: "👑",
    subtitulo: "El pueblo busca un rey",
    rangoAprox: "~1400 – 930 a.C.",
    resumen:
      "Tras la conquista, Israel oscila entre fidelidad y apostasía bajo los jueces. Dios concede un rey: Saúl falla, David consolida el reino, Salomón construye el Templo. Es la cumbre de Israel — pero también el comienzo de su división.",
    personajes: ["Débora", "Gedeón", "Sansón", "Samuel", "Saúl", "David", "Salomón"],
    temaCristo:
      "David, el rey conforme al corazón de Dios, es figura del Hijo de David: Jesús, el Rey eterno que reinará sin caer.",
    cls: colorEra["jueces-reyes"],
  },
  {
    slug: "exilio",
    nombre: "Caída y Exilio",
    emoji: "📉",
    subtitulo: "Cuando todo parece perdido",
    rangoAprox: "930 – 538 a.C.",
    resumen:
      "El reino se parte. El norte (Israel) cae ante Asiria en 722 a.C. El sur (Judá) cae ante Babilonia en 586 a.C., con el Templo destruido y el pueblo deportado. Pero los profetas anuncian: Dios no ha terminado. Vendrá un nuevo pacto, un nuevo David, un nuevo corazón.",
    personajes: ["Isaías", "Jeremías", "Ezequiel", "Daniel", "Habacuc"],
    temaCristo:
      "Las profecías del Siervo Sufriente (Isaías 53), del Nuevo Pacto (Jeremías 31) y del Hijo del Hombre (Daniel 7) preparan el escenario para Jesús.",
    cls: colorEra.exilio,
  },
  {
    slug: "retorno",
    nombre: "Retorno y Silencio",
    emoji: "🕊",
    subtitulo: "Esperando al Mesías",
    rangoAprox: "538 – 4 a.C.",
    resumen:
      "Persia permite el regreso. Se reconstruye el Templo (modesto) y las murallas de Jerusalén. Pasan persas, griegos, romanos. Tras Malaquías, los profetas callan por 400 años. El pueblo espera al Prometido en silencio.",
    personajes: ["Zorobabel", "Esdras", "Nehemías", "Ester", "Malaquías"],
    temaCristo:
      "El silencio profético prepara la plenitud del tiempo: cuando llegó el momento justo, Dios envió a su Hijo.",
    cls: colorEra.retorno,
  },
  {
    slug: "jesus",
    nombre: "Jesús",
    emoji: "✝️",
    subtitulo: "Dios entre nosotros",
    rangoAprox: "~4 a.C. – ~30 d.C.",
    resumen:
      "El Verbo se hace carne. Jesús nace en Belén, vive como nosotros, anuncia el Reino, sana, enseña en parábolas, muere en una cruz y resucita al tercer día. La promesa hecha en Génesis se cumple en una colina de Jerusalén.",
    personajes: ["Jesús", "María", "Juan el Bautista", "los Doce", "María Magdalena"],
    temaCristo:
      "Aquí no se prefigura — aquí Cristo está. Toda la Escritura previa apunta a estos años; toda la que sigue mira hacia atrás a ellos.",
    cls: colorEra.jesus,
  },
  {
    slug: "iglesia",
    nombre: "Iglesia Primitiva",
    emoji: "🔥",
    subtitulo: "El Reino se expande",
    rangoAprox: "~30 – ~95 d.C.",
    resumen:
      "El Espíritu desciende en Pentecostés. La Iglesia nace en Jerusalén, sufre persecución y se esparce por el imperio. Pablo lleva el evangelio a las naciones. Los apóstoles escriben las cartas y evangelios. Juan cierra el canon con una visión del fin.",
    personajes: ["Pedro", "Esteban", "Pablo", "Bernabé", "Juan", "Lucas"],
    temaCristo:
      "Cristo, ahora resucitado y ascendido, sigue actuando por su Espíritu en los suyos. La Iglesia es su cuerpo en la tierra hasta que vuelva.",
    cls: colorEra.iglesia,
  },
];

export const ERAS_POR_SLUG = new Map(ERAS.map((e) => [e.slug, e] as const));

export const HITOS: Hito[] = [
  // ─── Origen ───
  {
    slug: "creacion",
    era: "origen",
    emoji: "🌅",
    titulo: "La Creación",
    anio: "Principio",
    anioOrden: -10000,
    tipo: "creacion",
    descripcion:
      "Dios crea los cielos, la tierra y todo lo que existe. Hombre y mujer hechos a Su imagen reciben dominio sobre la creación.",
    significado: "Toda la realidad tiene un autor — y es bueno.",
    versosClaves: [{ libro: "GEN", capInicio: 1, capFin: 2, ref: "Génesis 1-2" }],
    librosDelPeriodo: ["GEN"],
  },
  {
    slug: "caida",
    era: "origen",
    emoji: "🍎",
    titulo: "La Caída",
    anio: "Edén",
    anioOrden: -9999,
    tipo: "juicio",
    descripcion:
      "Adán y Eva desobedecen. El pecado entra al mundo y rompe la comunión con Dios. Primera promesa del Redentor que vencerá a la serpiente.",
    significado: "El primer evangelio: ya en Génesis 3:15 Dios promete al Vencedor.",
    versosClaves: [{ libro: "GEN", capInicio: 3, ref: "Génesis 3" }],
    librosDelPeriodo: ["GEN"],
  },
  {
    slug: "diluvio",
    era: "origen",
    emoji: "🌊",
    titulo: "El Diluvio · Noé",
    anio: "~2500 a.C.",
    anioOrden: -2500,
    tipo: "juicio",
    descripcion:
      "Dios juzga la maldad humana con un diluvio. Noé y su familia se salvan en el arca. Pacto del arcoíris: nunca más destrucción por agua.",
    significado: "Juicio y misericordia conviven: hay arca antes del diluvio.",
    versosClaves: [{ libro: "GEN", capInicio: 6, capFin: 9, ref: "Génesis 6-9" }],
    librosDelPeriodo: ["GEN"],
  },
  {
    slug: "babel",
    era: "origen",
    emoji: "🏗",
    titulo: "Torre de Babel",
    anio: "~2300 a.C.",
    anioOrden: -2300,
    tipo: "juicio",
    descripcion:
      "La humanidad pretende alcanzar el cielo por sus propias fuerzas. Dios confunde las lenguas y los dispersa por la tierra.",
    significado: "Las naciones nacen aquí — y a las naciones irá el evangelio en Pentecostés.",
    versosClaves: [{ libro: "GEN", capInicio: 11, ref: "Génesis 11" }],
    librosDelPeriodo: ["GEN"],
  },

  // ─── Patriarcas ───
  {
    slug: "abraham",
    era: "patriarcas",
    emoji: "🌟",
    titulo: "Abraham · La Promesa",
    anio: "~2000 a.C.",
    anioOrden: -2000,
    tipo: "promesa",
    descripcion:
      "Dios llama a Abram desde Ur, lo lleva a Canaán y le promete descendencia como las estrellas. Nace el pueblo de Israel y la bendición a todas las naciones.",
    significado: "Empieza la historia de un pueblo elegido para bendecir al mundo.",
    versosClaves: [
      { libro: "GEN", capInicio: 12, ref: "Génesis 12" },
      { libro: "GEN", capInicio: 15, ref: "Génesis 15" },
    ],
    librosDelPeriodo: ["GEN"],
  },
  {
    slug: "sodoma",
    era: "patriarcas",
    emoji: "🔥",
    titulo: "Sodoma y Gomorra",
    anio: "~1950 a.C.",
    anioOrden: -1950,
    tipo: "juicio",
    descripcion:
      "Abraham intercede por las ciudades corruptas. Dios las destruye pero rescata a Lot. Una advertencia sobre el juicio y la misericordia que escucha al justo que ruega.",
    significado: "La oración del justo cambia historias.",
    versosClaves: [{ libro: "GEN", capInicio: 18, capFin: 19, ref: "Génesis 18-19" }],
    librosDelPeriodo: ["GEN"],
  },
  {
    slug: "isaac-sacrificio",
    era: "patriarcas",
    emoji: "🐏",
    titulo: "El Sacrificio en Moriah",
    anio: "~1900 a.C.",
    anioOrden: -1925,
    tipo: "profecia",
    descripcion:
      "Dios pide a Abraham ofrecer a Isaac, su hijo amado. En el último momento provee un carnero. Sombra anticipada del Padre que sí entrega a Su Hijo en el mismo monte.",
    significado: "‘Jehová proveerá’ — y mil años después proveyó al Cordero definitivo.",
    versosClaves: [{ libro: "GEN", capInicio: 22, ref: "Génesis 22" }],
    librosDelPeriodo: ["GEN"],
  },
  {
    slug: "isaac-jacob",
    era: "patriarcas",
    emoji: "👨‍👦",
    titulo: "Isaac y Jacob",
    anio: "~1900 a.C.",
    anioOrden: -1900,
    tipo: "transicion",
    descripcion:
      "La promesa pasa a Isaac, luego a Jacob (renombrado Israel tras luchar con el ángel) y a sus 12 hijos — padres de las 12 tribus.",
    significado: "Dios no escoge a los fuertes, sino a los suyos. Aun a un suplantador.",
    versosClaves: [
      { libro: "GEN", capInicio: 25, capFin: 28, ref: "Génesis 25-28" },
      { libro: "GEN", capInicio: 32, ref: "Génesis 32 — Lucha con el Ángel" },
    ],
    librosDelPeriodo: ["GEN"],
  },
  {
    slug: "jose-egipto",
    era: "patriarcas",
    emoji: "🇪🇬",
    titulo: "José en Egipto",
    anio: "~1700 a.C.",
    anioOrden: -1700,
    tipo: "redencion",
    descripcion:
      "José, vendido por sus hermanos, termina como segundo del faraón. Salva a su familia del hambre y los lleva a Egipto, donde Israel crecerá hasta ser nación.",
    significado: "‘Lo que ustedes pensaron para mal, Dios lo encaminó para bien.’",
    versosClaves: [
      { libro: "GEN", capInicio: 37, ref: "Génesis 37" },
      { libro: "GEN", capInicio: 50, ref: "Génesis 50" },
    ],
    librosDelPeriodo: ["GEN"],
  },

  // ─── Éxodo ───
  {
    slug: "moises",
    era: "exodo",
    emoji: "🔥",
    titulo: "Moisés · La Zarza Ardiente",
    anio: "~1500 a.C.",
    anioOrden: -1500,
    tipo: "transicion",
    descripcion:
      "Dios llama a Moisés desde una zarza ardiente y lo envía a liberar a Israel de la esclavitud en Egipto. ‘YO SOY el que SOY’ — el Nombre revelado.",
    significado: "Dios escucha el clamor de los oprimidos y baja a libertar.",
    versosClaves: [{ libro: "EXO", capInicio: 3, ref: "Éxodo 3" }],
    librosDelPeriodo: ["EXO"],
  },
  {
    slug: "exodo",
    era: "exodo",
    emoji: "🚪",
    titulo: "El Éxodo · La Pascua",
    anio: "~1450 a.C.",
    anioOrden: -1450,
    tipo: "redencion",
    descripcion:
      "Diez plagas. La Pascua: cordero, sangre en los dinteles, libertad. El mar Rojo se abre. Israel sale de la esclavitud rumbo a la Tierra Prometida.",
    significado: "La salvación pasa siempre por sangre de cordero.",
    versosClaves: [
      { libro: "EXO", capInicio: 12, ref: "Éxodo 12 — La Pascua" },
      { libro: "EXO", capInicio: 14, ref: "Éxodo 14 — Mar Rojo" },
    ],
    librosDelPeriodo: ["EXO"],
  },
  {
    slug: "sinai",
    era: "exodo",
    emoji: "🏔",
    titulo: "Sinaí · La Ley",
    anio: "~1450 a.C.",
    anioOrden: -1449,
    tipo: "pacto",
    descripcion:
      "En el monte Sinaí, Dios entrega los Diez Mandamientos y el pacto. Israel se constituye como pueblo-nación bajo la ley de su Rey.",
    significado: "Dios no nos da reglas para someternos: nos da identidad para vivir.",
    versosClaves: [{ libro: "EXO", capInicio: 19, capFin: 20, ref: "Éxodo 19-20" }],
    librosDelPeriodo: ["EXO", "LEV", "NUM", "DEU"],
  },
  {
    slug: "tabernaculo",
    era: "exodo",
    emoji: "⛺",
    titulo: "Tabernáculo y Sacerdocio",
    anio: "~1449 a.C.",
    anioOrden: -1448,
    tipo: "fundacion",
    descripcion:
      "Se construye el Tabernáculo: santuario móvil donde habita la gloria de Dios. Aarón y sus hijos son consagrados sacerdotes. Se establecen los sacrificios diarios.",
    significado: "Dios quiere habitar en medio de los suyos — y un día lo hará en carne.",
    versosClaves: [{ libro: "EXO", capInicio: 40, ref: "Éxodo 40" }],
    librosDelPeriodo: ["EXO", "LEV"],
  },
  {
    slug: "desierto",
    era: "exodo",
    emoji: "🏕",
    titulo: "40 años en el Desierto",
    anio: "~1450-1410 a.C.",
    anioOrden: -1430,
    tipo: "transicion",
    descripcion:
      "Por incredulidad, Israel da vueltas 40 años antes de entrar a Canaán. Maná, codornices, roca que da agua, columna de fuego. Generación que vio plagas muere sin entrar; sus hijos sí.",
    significado: "Dios sostiene a su pueblo aun cuando lo disciplina.",
    versosClaves: [
      { libro: "NUM", capInicio: 13, capFin: 14, ref: "Números 13-14" },
      { libro: "DEU", capInicio: 6, ref: "Deuteronomio 6 — Shemá" },
    ],
    librosDelPeriodo: ["NUM", "DEU"],
  },
  {
    slug: "josue",
    era: "exodo",
    emoji: "⚔️",
    titulo: "Josué · Conquista de Canaán",
    anio: "~1400 a.C.",
    anioOrden: -1400,
    tipo: "cumplimiento",
    descripcion:
      "Tras la muerte de Moisés, Josué guía a Israel a cruzar el Jordán seco. Caen las murallas de Jericó. Se reparte la tierra entre las 12 tribus.",
    significado: "La promesa hecha a Abraham se cumple en cada surco de tierra.",
    versosClaves: [
      { libro: "JOS", capInicio: 1, ref: "Josué 1" },
      { libro: "JOS", capInicio: 6, ref: "Josué 6 — Jericó" },
    ],
    librosDelPeriodo: ["JOS"],
  },

  // ─── Jueces y Reyes ───
  {
    slug: "jueces",
    era: "jueces-reyes",
    emoji: "⚖️",
    titulo: "Los Jueces",
    anio: "~1400-1050 a.C.",
    anioOrden: -1200,
    tipo: "transicion",
    descripcion:
      "Ciclo doloroso: apostasía, opresión, clamor, libertador. Débora, Gedeón, Sansón, Samuel guían a Israel sin un rey terrenal. ‘Cada cual hacía lo recto a sus ojos’.",
    significado: "Sin un rey eterno, hasta los héroes fracasan.",
    versosClaves: [
      { libro: "JDG", capInicio: 2, ref: "Jueces 2" },
      { libro: "RUT", capInicio: 1, ref: "Rut — fidelidad en tiempos oscuros" },
    ],
    librosDelPeriodo: ["JDG", "RUT", "1SA"],
  },
  {
    slug: "saul-david",
    era: "jueces-reyes",
    emoji: "👑",
    titulo: "Saúl y David",
    anio: "~1050-970 a.C.",
    anioOrden: -1050,
    tipo: "transicion",
    descripcion:
      "Israel pide un rey: Saúl es ungido pero falla. David, joven pastor, derriba a Goliat y sucede a Saúl. Reinará 40 años, escribirá salmos para todos los corazones.",
    significado: "Dios ve el corazón, no la estatura.",
    versosClaves: [
      { libro: "1SA", capInicio: 16, ref: "1 Samuel 16 — Unción de David" },
      { libro: "1SA", capInicio: 17, ref: "1 Samuel 17 — David y Goliat" },
    ],
    librosDelPeriodo: ["1SA", "2SA", "PSA"],
  },
  {
    slug: "salomon-templo",
    era: "jueces-reyes",
    emoji: "🏛",
    titulo: "Salomón · El Templo",
    anio: "~970-930 a.C.",
    anioOrden: -970,
    tipo: "fundacion",
    descripcion:
      "Salomón, hijo de David, construye el Templo en Jerusalén. Reino unido en su máxima gloria. Libros de sabiduría: Proverbios, Eclesiastés, Cantares.",
    significado: "La gloria de Dios habita un edificio — pero Él prepara algo más grande.",
    versosClaves: [{ libro: "1KI", capInicio: 6, capFin: 8, ref: "1 Reyes 6-8" }],
    librosDelPeriodo: ["1KI", "PRO", "ECC", "SNG"],
  },
  {
    slug: "division",
    era: "jueces-reyes",
    emoji: "💔",
    titulo: "División del Reino",
    anio: "930 a.C.",
    anioOrden: -930,
    tipo: "juicio",
    descripcion:
      "Tras Salomón, el reino se parte: Israel (10 tribus, norte) y Judá (sur). Cada uno con sus propios reyes. La idolatría se enraíza, especialmente en el norte.",
    significado: "Un reino dividido no se sostiene — ni siquiera el de Dios cuando se aparta de Él.",
    versosClaves: [{ libro: "1KI", capInicio: 12, ref: "1 Reyes 12" }],
    librosDelPeriodo: ["1KI", "2KI", "ISA", "JER", "AMO", "HOS"],
  },
  {
    slug: "elias",
    era: "jueces-reyes",
    emoji: "🌪",
    titulo: "Elías en el Monte Carmelo",
    anio: "~860 a.C.",
    anioOrden: -860,
    tipo: "milagro",
    descripcion:
      "Bajo el reinado idolátrico de Acab y Jezabel, el profeta Elías desafía a 450 profetas de Baal en el monte Carmelo. Fuego cae del cielo; el pueblo se vuelve a Jehová.",
    significado: "Un solo profeta con Dios es mayoría.",
    versosClaves: [{ libro: "1KI", capInicio: 18, ref: "1 Reyes 18" }],
    librosDelPeriodo: ["1KI", "2KI"],
  },

  // ─── Caída y Exilio ───
  {
    slug: "caida-israel",
    era: "exilio",
    emoji: "📉",
    titulo: "Caída de Israel · Asiria",
    anio: "722 a.C.",
    anioOrden: -722,
    tipo: "juicio",
    descripcion:
      "Asiria conquista el reino del norte. Las 10 tribus son deportadas y se dispersan. Solo queda Judá en el sur. Los profetas Oseas y Amós habían advertido.",
    significado: "Dios es paciente, pero su paciencia no es indiferencia.",
    versosClaves: [
      { libro: "2KI", capInicio: 17, ref: "2 Reyes 17" },
      { libro: "HOS", capInicio: 1, ref: "Oseas" },
    ],
    librosDelPeriodo: ["2KI", "ISA", "HOS", "AMO"],
  },
  {
    slug: "jeremias",
    era: "exilio",
    emoji: "😢",
    titulo: "Jeremías llora por Jerusalén",
    anio: "~620-587 a.C.",
    anioOrden: -610,
    tipo: "profecia",
    descripcion:
      "Durante los últimos años de Judá, Jeremías profetiza el juicio inminente y un Nuevo Pacto donde Dios escribirá su ley en el corazón. Es ignorado, perseguido y testigo de la caída.",
    significado: "Vendrá un día en que conocer a Dios no será leer una ley sino vivirla.",
    versosClaves: [
      { libro: "JER", capInicio: 29, ref: "Jeremías 29" },
      { libro: "JER", capInicio: 31, ref: "Jeremías 31 — Nuevo Pacto" },
    ],
    librosDelPeriodo: ["JER", "LAM"],
  },
  {
    slug: "caida-juda",
    era: "exilio",
    emoji: "🔥",
    titulo: "Caída de Judá · Babilonia",
    anio: "586 a.C.",
    anioOrden: -586,
    tipo: "juicio",
    descripcion:
      "Nabucodonosor destruye Jerusalén y el Templo. Judá es exiliada a Babilonia. Lamentaciones llora la ciudad caída. El pueblo se pregunta: ¿se acabó la promesa?",
    significado: "Cuando todo se quema, Dios sigue siendo fiel a su palabra.",
    versosClaves: [
      { libro: "2KI", capInicio: 25, ref: "2 Reyes 25" },
      { libro: "LAM", capInicio: 1, ref: "Lamentaciones" },
    ],
    librosDelPeriodo: ["2KI", "JER", "LAM"],
  },
  {
    slug: "daniel",
    era: "exilio",
    emoji: "🦁",
    titulo: "Daniel y Ezequiel en el Exilio",
    anio: "605-538 a.C.",
    anioOrden: -570,
    tipo: "profecia",
    descripcion:
      "Daniel sirve en cortes paganas sin doblegarse: el horno, los leones, las visiones del Reino que no tendrá fin. Ezequiel ve un valle de huesos secos que vuelven a la vida.",
    significado: "Dios reina sobre imperios — aun cuando su pueblo está en ruinas.",
    versosClaves: [
      { libro: "DAN", capInicio: 3, ref: "Daniel 3 — el horno" },
      { libro: "DAN", capInicio: 7, ref: "Daniel 7 — Hijo del Hombre" },
      { libro: "EZK", capInicio: 37, ref: "Ezequiel 37 — Huesos secos" },
    ],
    librosDelPeriodo: ["DAN", "EZK"],
  },

  // ─── Retorno y Silencio ───
  {
    slug: "retorno",
    era: "retorno",
    emoji: "🕊",
    titulo: "Regreso · Reconstrucción",
    anio: "538-432 a.C.",
    anioOrden: -538,
    tipo: "cumplimiento",
    descripcion:
      "Ciro de Persia permite el regreso. Zorobabel reconstruye el Templo. Esdras enseña la Ley. Nehemías reconstruye las murallas. Hageo, Zacarías y Malaquías profetizan los últimos mensajes del AT.",
    significado: "Dios trae a su pueblo de vuelta — más humilde, pero más enfocado.",
    versosClaves: [
      { libro: "EZR", capInicio: 1, ref: "Esdras 1 — Decreto de Ciro" },
      { libro: "NEH", capInicio: 6, ref: "Nehemías 6 — Murallas" },
    ],
    librosDelPeriodo: ["EZR", "NEH", "HAG", "ZEC", "MAL"],
  },
  {
    slug: "ester",
    era: "retorno",
    emoji: "👸",
    titulo: "Ester · Para tal momento",
    anio: "~478 a.C.",
    anioOrden: -478,
    tipo: "redencion",
    descripcion:
      "En la corte persa, una joven judía llega a ser reina justo cuando Amán trama exterminar a su pueblo. Ester arriesga su vida; el pueblo se salva.",
    significado: "Dios obra entre bastidores — aun cuando su nombre no aparece.",
    versosClaves: [{ libro: "EST", capInicio: 4, ref: "Ester 4" }],
    librosDelPeriodo: ["EST"],
  },
  {
    slug: "silencio",
    era: "retorno",
    emoji: "🌑",
    titulo: "400 Años de Silencio",
    anio: "~432 a.C. – 4 a.C.",
    anioOrden: -400,
    tipo: "transicion",
    descripcion:
      "Tras Malaquías, los profetas callan. Imperios pasan: persas, griegos (Alejandro), macabeos, romanos. El pueblo espera al Mesías prometido en silencio.",
    significado: "El silencio también es parte del plan. Lo mejor está por venir.",
    versosClaves: [{ libro: "MAL", capInicio: 4, ref: "Malaquías 4" }],
    librosDelPeriodo: [],
  },

  // ─── Jesús ───
  {
    slug: "anunciacion",
    era: "jesus",
    emoji: "👼",
    titulo: "La Anunciación",
    anio: "~5 a.C.",
    anioOrden: -5,
    tipo: "cumplimiento",
    descripcion:
      "El ángel Gabriel anuncia a María que dará a luz al Hijo del Altísimo, concebido por el Espíritu Santo. Ella responde: ‘Hágase conmigo conforme a tu palabra’.",
    significado: "El sí más importante de la historia lo dijo una adolescente de Nazaret.",
    versosClaves: [{ libro: "LUK", capInicio: 1, ref: "Lucas 1" }],
    librosDelPeriodo: ["LUK"],
  },
  {
    slug: "nacimiento",
    era: "jesus",
    emoji: "👶",
    titulo: "Nacimiento de Jesús",
    anio: "~4 a.C.",
    anioOrden: -4,
    tipo: "cumplimiento",
    descripcion:
      "El Verbo se hace carne. Jesús nace en Belén de María. Pastores, ángeles, magos, una estrella. Dios entre nosotros — Emanuel.",
    significado: "El Creador del universo durmió en una cuna de paja.",
    versosClaves: [
      { libro: "LUK", capInicio: 2, ref: "Lucas 2" },
      { libro: "MAT", capInicio: 1, capFin: 2, ref: "Mateo 1-2" },
    ],
    librosDelPeriodo: ["MAT", "MRK", "LUK", "JHN"],
  },
  {
    slug: "bautismo",
    era: "jesus",
    emoji: "🕊",
    titulo: "Bautismo de Jesús",
    anio: "~27 d.C.",
    anioOrden: 27,
    tipo: "transicion",
    descripcion:
      "Juan el Bautista bautiza a Jesús en el Jordán. El Espíritu desciende como paloma. Una voz del cielo: ‘Este es mi Hijo amado’. Comienza el ministerio público.",
    significado: "La Trinidad se muestra: Padre, Hijo y Espíritu en una misma escena.",
    versosClaves: [
      { libro: "MAT", capInicio: 3, ref: "Mateo 3" },
      { libro: "MRK", capInicio: 1, ref: "Marcos 1" },
    ],
    librosDelPeriodo: ["MAT", "MRK", "LUK", "JHN"],
  },
  {
    slug: "ministerio",
    era: "jesus",
    emoji: "🌿",
    titulo: "Ministerio · Reino y Milagros",
    anio: "~27-30 d.C.",
    anioOrden: 28,
    tipo: "milagro",
    descripcion:
      "Llamado de los 12. Sermón del Monte. Sanidades, exorcismos, multiplicación de panes, caminar sobre el agua, resurrección de Lázaro. Tres años que reescriben todo.",
    significado: "El Reino de Dios llegó en la persona de Jesús — y todavía rompe esquemas.",
    versosClaves: [
      { libro: "MAT", capInicio: 5, capFin: 7, ref: "Sermón del Monte (Mt 5-7)" },
      { libro: "JHN", capInicio: 11, ref: "Juan 11 — Lázaro" },
    ],
    librosDelPeriodo: ["MAT", "MRK", "LUK", "JHN"],
  },
  {
    slug: "ultima-cena",
    era: "jesus",
    emoji: "🍷",
    titulo: "Última Cena · Nuevo Pacto",
    anio: "~30 d.C.",
    anioOrden: 29.9,
    tipo: "pacto",
    descripcion:
      "Jesús comparte la Pascua con los discípulos y da nuevo sentido al pan y la copa: su cuerpo entregado, su sangre derramada. Promete enviar el Espíritu. Habla del Padre.",
    significado: "El Cordero Pascual celebra su última cena antes de ser él mismo el cordero.",
    versosClaves: [
      { libro: "LUK", capInicio: 22, ref: "Lucas 22" },
      { libro: "JHN", capInicio: 13, capFin: 17, ref: "Juan 13-17" },
    ],
    librosDelPeriodo: ["MAT", "MRK", "LUK", "JHN"],
  },
  {
    slug: "pasion",
    era: "jesus",
    emoji: "✝️",
    titulo: "Pasión y Cruz",
    anio: "~30 d.C.",
    anioOrden: 30,
    tipo: "redencion",
    descripcion:
      "Getsemaní. Traición de Judas. Juicio injusto. Crucifixión en el Gólgota. Tres horas de oscuridad. Jesús muere por los pecados del mundo: ‘Consumado es’.",
    significado: "El sacrificio que pone fin a todo sacrificio.",
    versosClaves: [
      { libro: "JHN", capInicio: 19, ref: "Juan 19" },
      { libro: "MAT", capInicio: 27, ref: "Mateo 27" },
    ],
    librosDelPeriodo: ["MAT", "MRK", "LUK", "JHN"],
  },
  {
    slug: "resurreccion",
    era: "jesus",
    emoji: "🌅",
    titulo: "Resurrección · El Tercer Día",
    anio: "~30 d.C.",
    anioOrden: 30.1,
    tipo: "cumplimiento",
    descripcion:
      "Las mujeres encuentran la tumba vacía. Jesús se aparece a María Magdalena, luego a los discípulos, a 500 a la vez. La muerte fue vencida.",
    significado: "Si Cristo resucitó, todo cambia. Si no, nada importa.",
    versosClaves: [
      { libro: "JHN", capInicio: 20, capFin: 21, ref: "Juan 20-21" },
      { libro: "1CO", capInicio: 15, ref: "1 Corintios 15" },
    ],
    librosDelPeriodo: ["MAT", "MRK", "LUK", "JHN"],
  },
  {
    slug: "ascension",
    era: "jesus",
    emoji: "☁️",
    titulo: "Ascensión y Gran Comisión",
    anio: "~30 d.C.",
    anioOrden: 30.2,
    tipo: "transicion",
    descripcion:
      "Tras 40 días apareciéndose, Jesús asciende al cielo prometiendo el Espíritu Santo y su regreso. ‘Id y haced discípulos a todas las naciones’.",
    significado: "Termina el evangelio en la tierra; empieza la misión por toda ella.",
    versosClaves: [
      { libro: "MAT", capInicio: 28, ref: "Mateo 28 — Gran Comisión" },
      { libro: "ACT", capInicio: 1, ref: "Hechos 1" },
    ],
    librosDelPeriodo: ["ACT"],
  },

  // ─── Iglesia primitiva ───
  {
    slug: "pentecostes",
    era: "iglesia",
    emoji: "🔥",
    titulo: "Pentecostés · Iglesia Naciente",
    anio: "~30 d.C.",
    anioOrden: 30.5,
    tipo: "fundacion",
    descripcion:
      "El Espíritu Santo desciende sobre los discípulos en Jerusalén. Hablan en muchas lenguas. Pedro predica; 3000 creen. Nace la Iglesia.",
    significado: "Babel se invierte: lo que dividió se vuelve a reunir bajo Cristo.",
    versosClaves: [{ libro: "ACT", capInicio: 2, ref: "Hechos 2" }],
    librosDelPeriodo: ["ACT"],
  },
  {
    slug: "esteban",
    era: "iglesia",
    emoji: "🩸",
    titulo: "Esteban · El Primer Mártir",
    anio: "~34 d.C.",
    anioOrden: 34,
    tipo: "transicion",
    descripcion:
      "Esteban predica con valentía y es apedreado. Mientras muere, ve a Jesús de pie a la diestra del Padre. Saulo aprueba la ejecución — sin saber que será el próximo.",
    significado: "La sangre del mártir es la semilla de la Iglesia.",
    versosClaves: [{ libro: "ACT", capInicio: 7, ref: "Hechos 7" }],
    librosDelPeriodo: ["ACT"],
  },
  {
    slug: "saulo",
    era: "iglesia",
    emoji: "⚡",
    titulo: "Conversión de Saulo",
    anio: "~35 d.C.",
    anioOrden: 35,
    tipo: "redencion",
    descripcion:
      "Camino a Damasco para perseguir cristianos, Saulo se encuentra con el Cristo resucitado. Queda ciego tres días. Se levanta como Pablo: apóstol a los gentiles.",
    significado: "Nadie está fuera del alcance de Cristo.",
    versosClaves: [{ libro: "ACT", capInicio: 9, ref: "Hechos 9" }],
    librosDelPeriodo: ["ACT"],
  },
  {
    slug: "pablo",
    era: "iglesia",
    emoji: "📜",
    titulo: "Pablo · Misiones y Cartas",
    anio: "~46-62 d.C.",
    anioOrden: 46,
    tipo: "fundacion",
    descripcion:
      "Tres viajes misioneros llevan el evangelio a Chipre, Asia Menor, Macedonia, Grecia y Roma. Pablo planta iglesias y les escribe cartas que hoy son la mitad del NT.",
    significado: "El evangelio camina, escribe, sufre — y sigue.",
    versosClaves: [
      { libro: "ACT", capInicio: 13, ref: "Hechos 13 — Envío" },
      { libro: "ROM", capInicio: 1, ref: "Romanos" },
      { libro: "EPH", capInicio: 2, ref: "Efesios 2" },
    ],
    librosDelPeriodo: [
      "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL",
      "1TH", "2TH", "1TI", "2TI", "TIT", "PHM",
    ],
  },
  {
    slug: "templo-destruido",
    era: "iglesia",
    emoji: "🏚",
    titulo: "Destrucción del Templo",
    anio: "70 d.C.",
    anioOrden: 70,
    tipo: "cumplimiento",
    descripcion:
      "Roma destruye Jerusalén y el Templo, tal como Jesús anticipó. El culto sacrificial termina para siempre. La Iglesia se expande por todo el imperio.",
    significado: "Ya no se necesita un templo de piedra: Cristo es el verdadero.",
    versosClaves: [
      { libro: "MAT", capInicio: 24, ref: "Mateo 24" },
      { libro: "HEB", capInicio: 10, ref: "Hebreos 10" },
    ],
    librosDelPeriodo: ["HEB", "1PE", "2PE", "JAS", "JUD"],
  },
  {
    slug: "apocalipsis",
    era: "iglesia",
    emoji: "👁",
    titulo: "Apocalipsis · Visión del Fin",
    anio: "~95 d.C.",
    anioOrden: 95,
    tipo: "profecia",
    descripcion:
      "Juan, exiliado en Patmos, recibe visiones del Cordero, los siete sellos y la Nueva Jerusalén donde Dios habita con los suyos. Se cierra el canon. ‘Ven, Señor Jesús’.",
    significado: "La historia tiene final feliz — y empieza con un nuevo cielo y nueva tierra.",
    versosClaves: [
      { libro: "REV", capInicio: 1, ref: "Apocalipsis 1" },
      { libro: "REV", capInicio: 21, capFin: 22, ref: "Apocalipsis 21-22" },
    ],
    librosDelPeriodo: ["1JN", "2JN", "3JN", "REV"],
  },
];

export function hitosPorEra(eraSlug?: EraSlug): Hito[] {
  if (!eraSlug) return HITOS;
  return HITOS.filter((h) => h.era === eraSlug);
}

export function obtenerHito(slug: string): Hito | null {
  return HITOS.find((h) => h.slug === slug) ?? null;
}

/** Etiquetas humanas para tipos de hito (color + label). */
export const TIPO_HITO: Record<
  TipoHito,
  { label: string; cls: string }
> = {
  creacion: { label: "Creación", cls: "bg-amber-100 text-amber-800 ring-amber-200" },
  pacto: { label: "Pacto", cls: "bg-indigo-100 text-indigo-800 ring-indigo-200" },
  promesa: { label: "Promesa", cls: "bg-violet-100 text-violet-800 ring-violet-200" },
  milagro: { label: "Milagro", cls: "bg-sky-100 text-sky-800 ring-sky-200" },
  profecia: { label: "Profecía", cls: "bg-fuchsia-100 text-fuchsia-800 ring-fuchsia-200" },
  cumplimiento: { label: "Cumplimiento", cls: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  juicio: { label: "Juicio", cls: "bg-rose-100 text-rose-800 ring-rose-200" },
  redencion: { label: "Redención", cls: "bg-green-100 text-green-800 ring-green-200" },
  fundacion: { label: "Fundación", cls: "bg-blue-100 text-blue-800 ring-blue-200" },
  transicion: { label: "Transición", cls: "bg-stone-100 text-stone-700 ring-stone-200" },
};

/** Stats agregadas para hero/landing. */
export function obtenerEstadisticas() {
  const totalHitos = HITOS.length;
  const totalEras = ERAS.length;
  const librosUnicos = new Set<string>();
  for (const h of HITOS) for (const l of h.librosDelPeriodo) librosUnicos.add(l);
  return {
    totalHitos,
    totalEras,
    totalLibros: librosUnicos.size,
    anioInicio: Math.min(...HITOS.map((h) => h.anioOrden)),
    anioFin: Math.max(...HITOS.map((h) => h.anioOrden)),
  };
}

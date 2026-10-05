// Catalogo canonico de los 66 libros.
// `nombreEn` matchea el `name` del JSON de scrollmapper (SpaRV).

export type Testamento = "AT" | "NT";

export interface LibroInfo {
  orden: number;
  codigo: string;          // OSIS
  nombre: string;          // espanol
  nombreCorto: string;     // forma abreviada habitual en RV
  nombreEn: string;        // nombre que usa el JSON fuente
  testamento: Testamento;
  numCapitulos: number;
}

export const LIBROS: readonly LibroInfo[] = [
  // ─── Antiguo Testamento ───
  { orden:  1, codigo: "GEN", nombre: "Génesis",          nombreCorto: "Gn",     nombreEn: "Genesis",            testamento: "AT", numCapitulos:  50 },
  { orden:  2, codigo: "EXO", nombre: "Éxodo",            nombreCorto: "Ex",     nombreEn: "Exodus",             testamento: "AT", numCapitulos:  40 },
  { orden:  3, codigo: "LEV", nombre: "Levítico",         nombreCorto: "Lv",     nombreEn: "Leviticus",          testamento: "AT", numCapitulos:  27 },
  { orden:  4, codigo: "NUM", nombre: "Números",          nombreCorto: "Nm",     nombreEn: "Numbers",            testamento: "AT", numCapitulos:  36 },
  { orden:  5, codigo: "DEU", nombre: "Deuteronomio",     nombreCorto: "Dt",     nombreEn: "Deuteronomy",        testamento: "AT", numCapitulos:  34 },
  { orden:  6, codigo: "JOS", nombre: "Josué",            nombreCorto: "Jos",    nombreEn: "Joshua",             testamento: "AT", numCapitulos:  24 },
  { orden:  7, codigo: "JDG", nombre: "Jueces",           nombreCorto: "Jue",    nombreEn: "Judges",             testamento: "AT", numCapitulos:  21 },
  { orden:  8, codigo: "RUT", nombre: "Rut",              nombreCorto: "Rut",    nombreEn: "Ruth",               testamento: "AT", numCapitulos:   4 },
  { orden:  9, codigo: "1SA", nombre: "1 Samuel",         nombreCorto: "1 Sm",   nombreEn: "I Samuel",           testamento: "AT", numCapitulos:  31 },
  { orden: 10, codigo: "2SA", nombre: "2 Samuel",         nombreCorto: "2 Sm",   nombreEn: "II Samuel",          testamento: "AT", numCapitulos:  24 },
  { orden: 11, codigo: "1KI", nombre: "1 Reyes",          nombreCorto: "1 Re",   nombreEn: "I Kings",            testamento: "AT", numCapitulos:  22 },
  { orden: 12, codigo: "2KI", nombre: "2 Reyes",          nombreCorto: "2 Re",   nombreEn: "II Kings",           testamento: "AT", numCapitulos:  25 },
  { orden: 13, codigo: "1CH", nombre: "1 Crónicas",       nombreCorto: "1 Cr",   nombreEn: "I Chronicles",       testamento: "AT", numCapitulos:  29 },
  { orden: 14, codigo: "2CH", nombre: "2 Crónicas",       nombreCorto: "2 Cr",   nombreEn: "II Chronicles",      testamento: "AT", numCapitulos:  36 },
  { orden: 15, codigo: "EZR", nombre: "Esdras",           nombreCorto: "Esd",    nombreEn: "Ezra",               testamento: "AT", numCapitulos:  10 },
  { orden: 16, codigo: "NEH", nombre: "Nehemías",         nombreCorto: "Neh",    nombreEn: "Nehemiah",           testamento: "AT", numCapitulos:  13 },
  { orden: 17, codigo: "EST", nombre: "Ester",            nombreCorto: "Est",    nombreEn: "Esther",             testamento: "AT", numCapitulos:  10 },
  { orden: 18, codigo: "JOB", nombre: "Job",              nombreCorto: "Job",    nombreEn: "Job",                testamento: "AT", numCapitulos:  42 },
  { orden: 19, codigo: "PSA", nombre: "Salmos",           nombreCorto: "Sal",    nombreEn: "Psalms",             testamento: "AT", numCapitulos: 150 },
  { orden: 20, codigo: "PRO", nombre: "Proverbios",       nombreCorto: "Pr",     nombreEn: "Proverbs",           testamento: "AT", numCapitulos:  31 },
  { orden: 21, codigo: "ECC", nombre: "Eclesiastés",      nombreCorto: "Ec",     nombreEn: "Ecclesiastes",       testamento: "AT", numCapitulos:  12 },
  { orden: 22, codigo: "SNG", nombre: "Cantares",         nombreCorto: "Cnt",    nombreEn: "Song of Solomon",    testamento: "AT", numCapitulos:   8 },
  { orden: 23, codigo: "ISA", nombre: "Isaías",           nombreCorto: "Is",     nombreEn: "Isaiah",             testamento: "AT", numCapitulos:  66 },
  { orden: 24, codigo: "JER", nombre: "Jeremías",         nombreCorto: "Jer",    nombreEn: "Jeremiah",           testamento: "AT", numCapitulos:  52 },
  { orden: 25, codigo: "LAM", nombre: "Lamentaciones",    nombreCorto: "Lm",     nombreEn: "Lamentations",       testamento: "AT", numCapitulos:   5 },
  { orden: 26, codigo: "EZK", nombre: "Ezequiel",         nombreCorto: "Ez",     nombreEn: "Ezekiel",            testamento: "AT", numCapitulos:  48 },
  { orden: 27, codigo: "DAN", nombre: "Daniel",           nombreCorto: "Dn",     nombreEn: "Daniel",             testamento: "AT", numCapitulos:  12 },
  { orden: 28, codigo: "HOS", nombre: "Oseas",            nombreCorto: "Os",     nombreEn: "Hosea",              testamento: "AT", numCapitulos:  14 },
  { orden: 29, codigo: "JOL", nombre: "Joel",             nombreCorto: "Jl",     nombreEn: "Joel",               testamento: "AT", numCapitulos:   3 },
  { orden: 30, codigo: "AMO", nombre: "Amós",             nombreCorto: "Am",     nombreEn: "Amos",               testamento: "AT", numCapitulos:   9 },
  { orden: 31, codigo: "OBA", nombre: "Abdías",           nombreCorto: "Abd",    nombreEn: "Obadiah",            testamento: "AT", numCapitulos:   1 },
  { orden: 32, codigo: "JON", nombre: "Jonás",            nombreCorto: "Jon",    nombreEn: "Jonah",              testamento: "AT", numCapitulos:   4 },
  { orden: 33, codigo: "MIC", nombre: "Miqueas",          nombreCorto: "Mi",     nombreEn: "Micah",              testamento: "AT", numCapitulos:   7 },
  { orden: 34, codigo: "NAM", nombre: "Nahúm",            nombreCorto: "Nah",    nombreEn: "Nahum",              testamento: "AT", numCapitulos:   3 },
  { orden: 35, codigo: "HAB", nombre: "Habacuc",          nombreCorto: "Hab",    nombreEn: "Habakkuk",           testamento: "AT", numCapitulos:   3 },
  { orden: 36, codigo: "ZEP", nombre: "Sofonías",         nombreCorto: "Sof",    nombreEn: "Zephaniah",          testamento: "AT", numCapitulos:   3 },
  { orden: 37, codigo: "HAG", nombre: "Hageo",            nombreCorto: "Hag",    nombreEn: "Haggai",             testamento: "AT", numCapitulos:   2 },
  { orden: 38, codigo: "ZEC", nombre: "Zacarías",         nombreCorto: "Zac",    nombreEn: "Zechariah",          testamento: "AT", numCapitulos:  14 },
  { orden: 39, codigo: "MAL", nombre: "Malaquías",        nombreCorto: "Mal",    nombreEn: "Malachi",            testamento: "AT", numCapitulos:   4 },

  // ─── Nuevo Testamento ───
  { orden: 40, codigo: "MAT", nombre: "Mateo",            nombreCorto: "Mt",     nombreEn: "Matthew",            testamento: "NT", numCapitulos:  28 },
  { orden: 41, codigo: "MRK", nombre: "Marcos",           nombreCorto: "Mc",     nombreEn: "Mark",               testamento: "NT", numCapitulos:  16 },
  { orden: 42, codigo: "LUK", nombre: "Lucas",            nombreCorto: "Lc",     nombreEn: "Luke",               testamento: "NT", numCapitulos:  24 },
  { orden: 43, codigo: "JHN", nombre: "Juan",             nombreCorto: "Jn",     nombreEn: "John",               testamento: "NT", numCapitulos:  21 },
  { orden: 44, codigo: "ACT", nombre: "Hechos",           nombreCorto: "Hch",    nombreEn: "Acts",               testamento: "NT", numCapitulos:  28 },
  { orden: 45, codigo: "ROM", nombre: "Romanos",          nombreCorto: "Ro",     nombreEn: "Romans",             testamento: "NT", numCapitulos:  16 },
  { orden: 46, codigo: "1CO", nombre: "1 Corintios",      nombreCorto: "1 Co",   nombreEn: "I Corinthians",      testamento: "NT", numCapitulos:  16 },
  { orden: 47, codigo: "2CO", nombre: "2 Corintios",      nombreCorto: "2 Co",   nombreEn: "II Corinthians",     testamento: "NT", numCapitulos:  13 },
  { orden: 48, codigo: "GAL", nombre: "Gálatas",          nombreCorto: "Gá",     nombreEn: "Galatians",          testamento: "NT", numCapitulos:   6 },
  { orden: 49, codigo: "EPH", nombre: "Efesios",          nombreCorto: "Ef",     nombreEn: "Ephesians",          testamento: "NT", numCapitulos:   6 },
  { orden: 50, codigo: "PHP", nombre: "Filipenses",       nombreCorto: "Flp",    nombreEn: "Philippians",        testamento: "NT", numCapitulos:   4 },
  { orden: 51, codigo: "COL", nombre: "Colosenses",       nombreCorto: "Col",    nombreEn: "Colossians",         testamento: "NT", numCapitulos:   4 },
  { orden: 52, codigo: "1TH", nombre: "1 Tesalonicenses", nombreCorto: "1 Ts",   nombreEn: "I Thessalonians",    testamento: "NT", numCapitulos:   5 },
  { orden: 53, codigo: "2TH", nombre: "2 Tesalonicenses", nombreCorto: "2 Ts",   nombreEn: "II Thessalonians",   testamento: "NT", numCapitulos:   3 },
  { orden: 54, codigo: "1TI", nombre: "1 Timoteo",        nombreCorto: "1 Ti",   nombreEn: "I Timothy",          testamento: "NT", numCapitulos:   6 },
  { orden: 55, codigo: "2TI", nombre: "2 Timoteo",        nombreCorto: "2 Ti",   nombreEn: "II Timothy",         testamento: "NT", numCapitulos:   4 },
  { orden: 56, codigo: "TIT", nombre: "Tito",             nombreCorto: "Tit",    nombreEn: "Titus",              testamento: "NT", numCapitulos:   3 },
  { orden: 57, codigo: "PHM", nombre: "Filemón",          nombreCorto: "Flm",    nombreEn: "Philemon",           testamento: "NT", numCapitulos:   1 },
  { orden: 58, codigo: "HEB", nombre: "Hebreos",          nombreCorto: "He",     nombreEn: "Hebrews",            testamento: "NT", numCapitulos:  13 },
  { orden: 59, codigo: "JAS", nombre: "Santiago",         nombreCorto: "Stg",    nombreEn: "James",              testamento: "NT", numCapitulos:   5 },
  { orden: 60, codigo: "1PE", nombre: "1 Pedro",          nombreCorto: "1 Pe",   nombreEn: "I Peter",            testamento: "NT", numCapitulos:   5 },
  { orden: 61, codigo: "2PE", nombre: "2 Pedro",          nombreCorto: "2 Pe",   nombreEn: "II Peter",           testamento: "NT", numCapitulos:   3 },
  { orden: 62, codigo: "1JN", nombre: "1 Juan",           nombreCorto: "1 Jn",   nombreEn: "I John",             testamento: "NT", numCapitulos:   5 },
  { orden: 63, codigo: "2JN", nombre: "2 Juan",           nombreCorto: "2 Jn",   nombreEn: "II John",            testamento: "NT", numCapitulos:   1 },
  { orden: 64, codigo: "3JN", nombre: "3 Juan",           nombreCorto: "3 Jn",   nombreEn: "III John",           testamento: "NT", numCapitulos:   1 },
  { orden: 65, codigo: "JUD", nombre: "Judas",            nombreCorto: "Jud",    nombreEn: "Jude",               testamento: "NT", numCapitulos:   1 },
  { orden: 66, codigo: "REV", nombre: "Apocalipsis",      nombreCorto: "Ap",     nombreEn: "Revelation of John", testamento: "NT", numCapitulos:  22 },
];

export const LIBROS_POR_CODIGO: ReadonlyMap<string, LibroInfo> = new Map(
  LIBROS.map((l) => [l.codigo, l]),
);

export const LIBROS_POR_NOMBRE_EN: ReadonlyMap<string, LibroInfo> = new Map(
  LIBROS.map((l) => [l.nombreEn, l]),
);

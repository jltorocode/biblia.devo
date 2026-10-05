/**
 * Sembrar usuarios demo via better-auth y, para premium, poblar 25 dias de
 * diario (mezclando modos: estado, conversacion, lectura) con notas realistas
 * + guardados. Para probar el flujo entero sin tener que generarlo a mano.
 *
 * Uso: `npx tsx prisma/seed/seed-usuarios-demo.ts --reset`
 *
 * Sin --reset: si el email ya existe lo deja intacto (sin re-poblar).
 */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { aplicarSuscripcion } from "@/lib/payments/aplicar-suscripcion";

type UsuarioDemo = {
  email: string;
  password: string;
  nombre: string;
  premium?: boolean;
  sembrarDiario?: boolean;
};

const DEMOS: UsuarioDemo[] = [
  {
    email: "demo@biblia.devo",
    password: "demo1234",
    nombre: "Demo (gratis)",
  },
  {
    email: "premium@biblia.devo",
    password: "premium1234",
    nombre: "Demo Premium",
    premium: true,
    sembrarDiario: true,
  },
  {
    email: "pastor@biblia.devo",
    password: "pastor1234",
    nombre: "Pastor Demo",
  },
];

// ─── Datos sinteticos para diario ───

const ESTADOS_USADOS = [
  "ansioso",
  "triste",
  "cansado",
  "feliz_agradecido",
  "buscando_direccion",
  "necesitando_fe",
  "en_prueba",
  "general",
];

const AREAS = ["trabajo", "familia", "pareja", "salud", "fe", "amistad"];

const NOTAS_REALISTAS = [
  "Hoy me costó arrancar. Leer esto me bajó el ritmo del pecho.",
  "Lo necesitaba sin saberlo. Gracias, Señor.",
  "Algo se ablandó adentro. Sigo con mi día.",
  "Lo quiero recordar mañana cuando me despierte.",
  "Mi cabeza estuvo todo el día con esto. Llegué cansado, pero acá hay calma.",
  "Lo voy a compartir con mi esposa después de la cena.",
  "Justo lo que mi alma pedía sin saber cómo pedirlo.",
  "Voy a anotar este versículo en mi mesa de luz.",
  "Hoy entendí que no estoy solo en esto.",
  "Una frase me marcó: 'él tiene cuidado de vosotros'. Eso me sostiene.",
  null, // sin nota — entrada minimalista
  null,
];

const LECTURAS_REFS = [
  { codigo: "PSA", capitulo: 23 },
  { codigo: "PSA", capitulo: 91 },
  { codigo: "ROM", capitulo: 8 },
  { codigo: "1CO", capitulo: 13 },
  { codigo: "MAT", capitulo: 6 },
  { codigo: "PRO", capitulo: 3 },
  { codigo: "PHP", capitulo: 4 },
  { codigo: "JHN", capitulo: 14 },
];

function rng(seed: number) {
  // PRNG determinístico para que el seed sea reproducible.
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function tomar<T>(arr: readonly T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)]!;
}

async function crearUno(u: UsuarioDemo, reset: boolean) {
  const existente = await prisma.usuario.findUnique({ where: { email: u.email } });
  if (existente && reset) {
    await prisma.usuario.delete({ where: { id: existente.id } });
    console.log(`  · borrado previo: ${u.email}`);
  } else if (existente) {
    console.log(`  · ya existe, omito: ${u.email}`);
    return existente.id;
  }

  await auth.api.signUpEmail({
    body: { email: u.email, password: u.password, name: u.nombre },
  });
  const creado = await prisma.usuario.findUnique({ where: { email: u.email } });
  if (!creado) throw new Error(`signUp no creo ${u.email}`);

  if (u.premium) {
    const ahora = new Date();
    const enUnMes = new Date(ahora);
    enUnMes.setMonth(enUnMes.getMonth() + 1);
    await aplicarSuscripcion({
      provider: "stripe",
      externalId: `demo_sub_${creado.id}`,
      evento: "activada",
      usuarioId: creado.id,
      plan: "premium_mensual",
      periodStart: ahora,
      periodEnd: enUnMes,
      cancelAtPeriodEnd: false,
    });
    console.log(`  · ${u.email}: premium hasta ${enUnMes.toISOString().slice(0, 10)}`);
  }

  if (u.sembrarDiario) {
    await sembrarDiario(creado.id);
  }

  return creado.id;
}

async function sembrarDiario(usuarioId: string) {
  const r = rng(0xc0ffee);
  const hoy = new Date();
  // Cargamos clasificacion una vez en memoria (lookup rapido).
  const veRows = await prisma.versiculoEstado.findMany({
    select: { estadoId: true, versiculoId: true, estado: { select: { slug: true } } },
  });
  const porEstado: Record<string, bigint[]> = {};
  for (const row of veRows) {
    const k = row.estado.slug;
    (porEstado[k] ??= []).push(row.versiculoId);
  }

  const libros = await prisma.libro.findMany({
    where: { codigo: { in: LECTURAS_REFS.map((l) => l.codigo) } },
    select: { id: true, codigo: true },
  });
  const libroPorCodigo = new Map(libros.map((l) => [l.codigo, l.id]));

  let total = 0;
  let lecturas = 0;

  // 28 dias hacia atras + hoy.
  for (let dia = 28; dia >= 0; dia--) {
    const fechaIso = new Date(hoy.getTime() - dia * 86400 * 1000)
      .toISOString()
      .slice(0, 10);

    // Skip aleatorio: ~15% de los días no hay entrada (más realista).
    if (dia > 0 && r() < 0.15) continue;

    // 1 a 3 entradas por día para premium (mostrar valor del plan).
    const cantidad = 1 + Math.floor(r() * 3);

    for (let i = 0; i < cantidad; i++) {
      const moneda = r();
      const tipo = moneda < 0.45 ? "estado" : moneda < 0.75 ? "conversacion" : "lectura";

      const horaUTC = 8 + Math.floor(r() * 14);
      const minutoUTC = Math.floor(r() * 60);
      const creadoEn = new Date(`${fechaIso}T${String(horaUTC).padStart(2, "0")}:${String(minutoUTC).padStart(2, "0")}:00Z`);
      const fecha = new Date(`${fechaIso}T00:00:00Z`);

      const nota = tomar(NOTAS_REALISTAS, r);

      if (tipo === "lectura") {
        const ref = tomar(LECTURAS_REFS, r);
        const libroId = libroPorCodigo.get(ref.codigo);
        if (!libroId) continue;
        const versos = await prisma.versiculo.findMany({
          where: { libroId, capitulo: ref.capitulo },
          orderBy: { versiculo: "asc" },
          select: { id: true },
        });
        if (versos.length === 0) continue;

        // Evitar duplicar la misma lectura el mismo dia.
        const yaExiste = await prisma.entrada.findFirst({
          where: {
            usuarioId,
            modo: "lectura",
            fecha,
            lecturaInicioId: versos[0]!.id,
          },
        });
        if (yaExiste) continue;

        await prisma.entrada.create({
          data: {
            usuarioId,
            modo: "lectura",
            fecha,
            creadoEn,
            actualizadoEn: creadoEn,
            lecturaInicioId: versos[0]!.id,
            lecturaFinId: versos.at(-1)!.id,
            nota,
          },
        });
        lecturas++;
      } else {
        const estadoSlug = tomar(ESTADOS_USADOS, r);
        const estadoRow = await prisma.estadoAnimo.findUnique({
          where: { slug: estadoSlug },
          select: { id: true },
        });
        if (!estadoRow) continue;
        const pool = porEstado[estadoSlug];
        if (!pool || pool.length === 0) continue;
        const versiculoId = pool[Math.floor(r() * pool.length)]!;

        // Idempotencia: misma fecha+estado solo una vez.
        const yaExiste = await prisma.entrada.findFirst({
          where: { usuarioId, fecha, estadoId: estadoRow.id },
        });
        if (yaExiste) continue;

        await prisma.entrada.create({
          data: {
            usuarioId,
            modo: tipo === "conversacion" ? "conversacion" : "estado",
            fecha,
            creadoEn,
            actualizadoEn: creadoEn,
            estadoId: estadoRow.id,
            versiculoId,
            area: tipo === "conversacion" ? tomar(AREAS, r) : null,
            nota,
          },
        });
      }
      total++;
    }
  }

  // Algunos guardados (versiculos favoritos)
  let guardados = 0;
  const algunosVE = await prisma.versiculoEstado.findMany({
    take: 30,
    orderBy: { id: "asc" },
    select: { versiculoId: true },
  });
  for (let i = 0; i < 7; i++) {
    const idx = Math.floor(r() * algunosVE.length);
    const vId = algunosVE[idx]!.versiculoId;
    try {
      await prisma.versiculoGuardado.create({
        data: { usuarioId, versiculoId: vId, notaPersonal: i === 0 ? "Mi favorito" : null },
      });
      guardados++;
    } catch {
      // unique constraint violation, ignoramos
    }
  }

  console.log(`  · sembrado: ${total} entradas (${lecturas} lecturas), ${guardados} guardados`);
}

async function main() {
  const reset = process.argv.includes("--reset");
  console.log(`→ Seed usuarios demo${reset ? " (reset)" : ""}`);
  for (const u of DEMOS) {
    await crearUno(u, reset);
  }
  console.log("\nUsuarios listos:\n");
  for (const u of DEMOS) {
    const tag = u.premium ? " [premium · diario poblado]" : "";
    console.log(`  ${u.email}  /  ${u.password}${tag}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

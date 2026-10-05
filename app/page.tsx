import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import {
  Heart,
  Search,
  Calendar,
  Sparkles,
  BookOpen,
  Layers,
  Image as ImageIcon,
  Flame,
  ArrowRight,
  Check,
  Users,
  Lock,
  Code2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "biblia.devo — La Palabra de Dios para cada momento",
  description:
    "Descubrí el versículo perfecto según cómo te sentís hoy. Planes de lectura, lista de oraciones, 8 versiones bíblicas en español. Open source y respetuoso.",
  alternates: { canonical: APP_URL },
  openGraph: {
    title: "biblia.devo — La Palabra de Dios para cada momento",
    description:
      "Descubrí el versículo perfecto según cómo te sentís hoy. Planes, oraciones, 8 versiones en español.",
    url: APP_URL,
    type: "website",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

export default async function LandingPage() {
  // Solo redirigimos a /inicio si el usuario está REALMENTE logueado
  // (sesión de better-auth, no cookie anónima). Anónimos ven la landing.
  const sesion = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (sesion?.user?.id) redirect("/inicio");

  return (
    <main className="relative flex-1">
      <FondoOrnamental />

      <Hero />
      <ComoFunciona />
      <Features />
      <Versiones />
      <Diferenciador />
      <Pricing />
      <CTAFinal />
    </main>
  );
}

/* ─────────────────────── HERO ─────────────────────── */

function Hero() {
  return (
    <section className="relative mx-auto max-w-5xl px-4 pb-12 pt-16 sm:px-6 sm:pt-24">
      <div className="text-center">
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
          <Sparkles className="size-3" />
          Open source · Para los que buscan
        </p>
        <h1
          className="font-serif text-4xl leading-[1.1] tracking-tight text-stone-900 sm:text-6xl"
          style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
        >
          La Palabra de Dios
          <br />
          <span className="text-stone-600">para cada momento de tu corazón.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
          Decí cómo te sentís hoy y recibí el versículo que necesitás escuchar. Llevá un
          diario, marcá tus oraciones y construí el hábito de estar con Dios — un día a la vez.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3.5 text-base font-medium text-white shadow-lg shadow-stone-900/10 transition hover:bg-stone-800 hover:shadow-xl sm:w-auto"
          >
            Crear cuenta gratis
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/signin"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3.5 text-base font-medium text-stone-700 transition hover:bg-stone-50 sm:w-auto"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <p className="mt-4 text-xs text-stone-500">
          Free para siempre · Sin tarjeta · 8 versiones bíblicas en español
        </p>
      </div>

      {/* Mockup del producto */}
      <div className="mt-16 sm:mt-20">
        <MockupTarjeta />
      </div>
    </section>
  );
}

function MockupTarjeta() {
  return (
    <div className="relative mx-auto max-w-3xl">
      <div
        aria-hidden
        className="absolute inset-x-0 -top-8 -bottom-4 -z-10 rounded-[2rem] bg-gradient-to-b from-amber-100/40 to-transparent blur-2xl"
      />
      <div className="rounded-3xl border border-stone-200 bg-white/80 p-6 shadow-2xl shadow-stone-900/5 backdrop-blur sm:p-10">
        <div className="text-center">
          <span className="text-5xl">🌅</span>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">
            Esperanzado · Familia
          </p>
          <p className="mt-1 max-w-md text-sm italic text-stone-500 mx-auto">
            Dios obra a través de tu día como obra en todo tiempo.
          </p>
          <div className="my-6 mx-auto h-px w-16 bg-amber-300/60" />
          <p
            className="font-serif text-xl leading-relaxed text-stone-800 sm:text-2xl"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            Tu Palabra es lámpara a mis pies y luz para mi camino.
          </p>
          <p className="mt-4 text-sm font-medium text-stone-700">Salmos 119:105</p>
          <p className="text-xs text-stone-500">Reina-Valera 1909</p>
          <div className="my-6 mx-auto h-px w-16 bg-amber-300/60" />
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600">
              <Heart className="size-3" /> Guardar
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600">
              <ImageIcon className="size-3" /> Compartir
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600">
              <Layers className="size-3" /> Comparar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────── CÓMO FUNCIONA ────────────────── */

function ComoFunciona() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Cómo funciona
        </p>
        <h2 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
          Tres pasos. Cinco minutos. Te encontrás con Dios.
        </h2>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <Paso
          n={1}
          titulo="Decí cómo te sentís"
          texto="Elegí entre 13 estados de ánimo. Ansioso, agradecido, en duda, esperanzado. Sin filtros, sin disfraces."
          emoji="💭"
        />
        <Paso
          n={2}
          titulo="Recibí tu versículo"
          texto="Un verso seleccionado por relevancia para ese momento. Curado a mano + búsqueda semántica sobre 31.000 versículos."
          emoji="📖"
        />
        <Paso
          n={3}
          titulo="Hacé tu diario"
          texto="Subrayá, anotá tu reflexión, marcá oraciones respondidas. Tu caminar queda guardado para volver."
          emoji="✍️"
        />
      </div>
    </section>
  );
}

function Paso({ n, titulo, texto, emoji }: { n: number; titulo: string; texto: string; emoji: string }) {
  return (
    <div className="relative rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <span className="absolute -top-3 -left-3 inline-flex size-8 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">
        {n}
      </span>
      <p className="text-3xl">{emoji}</p>
      <h3 className="mt-3 font-serif text-xl text-stone-900">{titulo}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{texto}</p>
    </div>
  );
}

/* ─────────────────── FEATURES ─────────────────── */

function Features() {
  const items = [
    {
      icon: <Heart className="size-5 text-rose-500" />,
      titulo: "Versículo según tu estado",
      texto: "13 estados de ánimo × 8 áreas de vida. Mapeados a versículos curados y enriquecidos con búsqueda semántica.",
    },
    {
      icon: <Calendar className="size-5 text-emerald-500" />,
      titulo: "Planes de lectura",
      texto: "Salmos en 30 días · Juan en una semana · La Biblia en un año. Calendario, racha y reflexión por día.",
    },
    {
      icon: <Sparkles className="size-5 text-amber-500" />,
      titulo: "Lista de oraciones",
      texto: "Anotá tus peticiones, marcalas como respondidas. Un registro íntimo de cómo Dios trabaja en tu vida.",
    },
    {
      icon: <Search className="size-5 text-blue-500" />,
      titulo: "Búsqueda libre",
      texto: "Escribí ‘paz’, ‘Juan 3:16’ o ‘no temas’ — encuentra lo que necesitás en cualquier libro.",
    },
    {
      icon: <Layers className="size-5 text-violet-500" />,
      titulo: "Comparador de versiones",
      texto: "Leé el mismo versículo en 8 traducciones a la vez. RV1909, RVG, VBL, BES y más.",
    },
    {
      icon: <Flame className="size-5 text-orange-500" />,
      titulo: "Racha + logros",
      texto: "Construí el hábito día a día. Heatmap del año, logros desbloqueables y mejor racha histórica.",
    },
    {
      icon: <ImageIcon className="size-5 text-pink-500" />,
      titulo: "Compartir como imagen",
      texto: "Generá una tarjeta con tipografía cuidada y compartila en WhatsApp o Instagram con un click.",
    },
    {
      icon: <BookOpen className="size-5 text-stone-700" />,
      titulo: "Diario y subrayados",
      texto: "4 colores de subrayado, notas en cada entrada, vista por día/mes/año. Tu diario espiritual.",
    },
  ];
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Todo lo que necesitás
        </p>
        <h2 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
          Construida con cariño, no con prisa.
        </h2>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((f, i) => (
          <div
            key={i}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400 hover:shadow-md"
          >
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-lg bg-stone-50">
              {f.icon}
            </div>
            <h3 className="font-serif text-base text-stone-900">{f.titulo}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{f.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────── VERSIONES ─────────────────── */

function Versiones() {
  const versiones = [
    { codigo: "RV1909", nombre: "Reina-Valera 1909", tipo: "Dominio público" },
    { codigo: "RVG", nombre: "Reina-Valera Gómez 2010", tipo: "Libre uso" },
    { codigo: "VBL", nombre: "Versión Biblia Libre", tipo: "Creative Commons" },
    { codigo: "BES", nombre: "Biblia en Español Sencillo", tipo: "Creative Commons" },
    { codigo: "RV1865", nombre: "Reina-Valera 1865", tipo: "Dominio público" },
    { codigo: "PdDpt", nombre: "Palabra de Dios para ti", tipo: "Libre" },
    { codigo: "BLM", nombre: "Spanish Free Bible", tipo: "Creative Commons" },
    { codigo: "V2P", nombre: "Reina-Valera Purificada", tipo: "Libre uso" },
  ];
  return (
    <section className="bg-stone-50/60 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            8 versiones · 248.000+ versículos
          </p>
          <h2 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
            Todas las traducciones legales en un solo lugar.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-600 sm:text-base">
            Cargamos sólo versiones de dominio público o licencia libre — sin redistribuir
            contenido con copyright. Si querés NVI, RVR1960 o PDT, las integramos vía API
            oficial (api.bible) con tu propia clave.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {versiones.map((v) => (
            <div
              key={v.codigo}
              className="rounded-xl border border-stone-200 bg-white p-4 text-center shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {v.codigo}
              </p>
              <p className="mt-1 text-xs leading-tight text-stone-600">{v.nombre}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-700">
                {v.tipo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── DIFERENCIADOR ─────────────────── */

function Diferenciador() {
  const items = [
    { icon: <Lock className="size-5" />, titulo: "Open source", texto: "Auditable. Self-hostable. Sin caja negra." },
    { icon: <Users className="size-5" />, titulo: "Sin tracking", texto: "Nadie vende tus datos. Tus reflexiones quedan acá." },
    { icon: <Check className="size-5" />, titulo: "Sin LLM ‘hablando por Dios’", texto: "Recuperación semántica + curados humanos. Cero IA generando texto bíblico." },
    { icon: <Code2 className="size-5" />, titulo: "Hecho por creyentes", texto: "Para creyentes. No es producto de quienes no creen." },
  ];
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Lo que nos hace distintos
        </p>
        <h2 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
          Tu fe merece una app que la respete.
        </h2>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((d, i) => (
          <div key={i} className="flex flex-col items-start gap-3 rounded-2xl border border-stone-200 bg-white p-5">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-stone-900 text-white">
              {d.icon}
            </div>
            <h3 className="font-serif text-lg text-stone-900">{d.titulo}</h3>
            <p className="text-sm leading-relaxed text-stone-600">{d.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────── PRICING ─────────────────── */

function Pricing() {
  return (
    <section className="bg-stone-50/60 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Precios
          </p>
          <h2 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
            Free hace casi todo. Premium para los que quieren más.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <PlanCard
            destacado={false}
            nombre="Free"
            precio="$0"
            descripcion="Para siempre"
            features={[
              "1 versículo + 1 entrada por día",
              "Todas las 8 versiones bíblicas",
              "Lista de oraciones ilimitada",
              "Planes de lectura",
              "Búsqueda libre",
              "Comparador de versiones",
              "Subrayados (4 colores)",
              "Compartir como imagen",
            ]}
            cta="Crear cuenta gratis"
            href="/signup"
          />
          <PlanCard
            destacado
            nombre="Premium"
            precio="$3"
            descripcion="por mes — o $30/año"
            features={[
              "Todo lo del plan Free",
              "Entradas ilimitadas por día",
              "Diario rico (sin límite)",
              "Estadísticas avanzadas",
              "Soporte directo",
              "Apoyás un proyecto open source",
            ]}
            cta="Quiero Premium"
            href="/premium"
          />
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  destacado,
  nombre,
  precio,
  descripcion,
  features,
  cta,
  href,
}: {
  destacado: boolean;
  nombre: string;
  precio: string;
  descripcion: string;
  features: string[];
  cta: string;
  href: string;
}) {
  return (
    <div
      className={`rounded-2xl border-2 p-6 shadow-sm transition ${
        destacado
          ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white"
          : "border-stone-200 bg-white"
      }`}
    >
      {destacado && (
        <span className="mb-3 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
          Recomendado
        </span>
      )}
      <h3 className="font-serif text-xl text-stone-900">{nombre}</h3>
      <p className="mt-2 text-3xl font-bold text-stone-900">
        {precio} <span className="text-sm font-normal text-stone-500">{descripcion}</span>
      </p>
      <ul className="mt-5 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-6 inline-flex w-full items-center justify-center gap-1 rounded-full px-5 py-2.5 text-sm font-medium transition ${
          destacado
            ? "bg-stone-900 text-white hover:bg-stone-800"
            : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
        }`}
      >
        {cta}
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

/* ─────────────────── CTA FINAL ─────────────────── */

function CTAFinal() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-3xl bg-stone-900 px-8 py-12 text-center text-white sm:px-16 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          Da el primer paso
        </p>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
          ¿Cómo estás hoy?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-stone-300 sm:text-base">
          Tomate 30 segundos. Decinos cómo te sentís y recibí tu primer versículo. Sin cuenta,
          sin tarjeta, sin promesas vacías.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-medium text-stone-900 transition hover:bg-stone-100"
        >
          Crear mi cuenta
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────── ORNAMENTO DE FONDO ─────────────────── */

function FondoOrnamental() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 size-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-100/30 via-amber-50/20 to-transparent blur-3xl"
      />
    </div>
  );
}

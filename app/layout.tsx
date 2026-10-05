import type { Metadata, Viewport } from "next";
import { Geist, Lora, EB_Garamond, Cardo } from "next/font/google";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { HeaderUsuario } from "@/components/HeaderUsuario";
import { NavMobile } from "@/components/NavMobile";
import { FooterGlobal } from "@/components/FooterGlobal";
import { RegistrarServiceWorker } from "@/components/RegistrarServiceWorker";
import { getTemaActual } from "@/lib/tema-actual";
import { temaACss } from "@/lib/temas";
import "./globals.css";

// IMPORTANTE: solo Geist+Lora se precargan (las que usa la home).
// EB Garamond y Cardo se cargan on-demand cuando el usuario activa esos temas
// — preload:false evita 6+ requests woff2 que Firefox queja por "no usados".
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const cardo = Cardo({
  variable: "--font-cardo",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Devocional",
    template: "%s — Devocional",
  },
  description: "La Palabra de Dios para cada momento de tu corazón.",
  applicationName: "Devocional",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Devocional",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "Devocional",
    locale: "es",
    url: APP_URL,
    title: "Devocional",
    description: "La Palabra de Dios para cada momento de tu corazón.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Devocional",
    description: "La Palabra de Dios para cada momento de tu corazón.",
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#5b4636",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sesion, tema] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),
    getTemaActual(),
  ]);
  const autenticado = !!sesion?.user?.id;

  return (
    <html
      lang="es"
      data-theme={tema.slug}
      style={temaACss(tema)}
      className={`${geistSans.variable} ${lora.variable} ${ebGaramond.variable} ${cardo.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col pb-16 sm:pb-0"
        style={{ background: tema.bg, color: tema.text }}
      >
        <HeaderUsuario />
        {children}
        <FooterGlobal />
        <NavMobile autenticado={autenticado} />
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}

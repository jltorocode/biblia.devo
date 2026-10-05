import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Imagen 1200x630 (estándar OG, perfecto para WhatsApp/Instagram/Twitter).
// Recibe texto del versículo + referencia + version como query params.
// Renderiza server-side con next/og (no necesita Chromium headless).

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Paleta por slug de tema (mantener en sync con lib/temas.ts).
const TEMAS: Record<string, { bg: string; text: string; accent: string; ornament: string }> = {
  pergamino: { bg: "#faf7f2", text: "#2b2b2b", accent: "#5b4636", ornament: "#c8a87a" },
  aurora:    { bg: "#f6f1ff", text: "#28223b", accent: "#6c5cd7", ornament: "#b8a8ff" },
  bosque:    { bg: "#f0f4ef", text: "#1f2e23", accent: "#3d6249", ornament: "#88a890" },
  cielo:     { bg: "#eef5fb", text: "#1a2e3f", accent: "#4778a6", ornament: "#a8c7e0" },
  noche:     { bg: "#1a1a23", text: "#f5f1e8", accent: "#d4af68", ornament: "#b39960" },
  luz:       { bg: "#ffffff", text: "#1a1a1a", accent: "#c0392b", ornament: "#e8b8b0" },
};

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const texto = clamp((searchParams.get("texto") ?? "").trim(), 380);
  const ref = clamp((searchParams.get("ref") ?? "").trim(), 60);
  const version = clamp((searchParams.get("version") ?? "Reina-Valera 1909").trim(), 40);
  const temaSlug = (searchParams.get("tema") ?? "pergamino").toLowerCase();
  const tema = TEMAS[temaSlug] ?? TEMAS.pergamino;

  if (!texto || !ref) {
    return new Response("Faltan parámetros: texto y ref", { status: 400 });
  }

  // Ajustamos el tamaño de fuente del texto según la longitud
  const fontSize = texto.length > 240 ? 36 : texto.length > 140 ? 44 : 52;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: tema.bg,
          color: tema.text,
          padding: "70px 80px",
          fontFamily: "serif",
        }}
      >
        {/* Marca arriba */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: tema.accent,
          }}
        >
          <span style={{ fontWeight: 600 }}>Devocional</span>
          <span style={{ opacity: 0.6 }}>biblia.devo</span>
        </div>

        {/* Ornamento decorativo */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 36,
          }}
        >
          <div
            style={{
              width: 60,
              height: 2,
              background: tema.ornament,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Versículo */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 40px",
          }}
        >
          <p
            style={{
              fontSize,
              lineHeight: 1.45,
              textAlign: "center",
              fontWeight: 400,
              margin: 0,
            }}
          >
            {texto}
          </p>
        </div>

        {/* Ornamento + referencia */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 60,
              height: 2,
              background: tema.ornament,
              borderRadius: 2,
            }}
          />
          <p style={{ fontSize: 32, fontWeight: 600, color: tema.accent, margin: 0 }}>{ref}</p>
          <p
            style={{
              fontSize: 18,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: tema.text,
              opacity: 0.5,
              margin: 0,
            }}
          >
            {version}
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

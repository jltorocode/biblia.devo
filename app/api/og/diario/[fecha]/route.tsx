// OG image dinámico del diario: 1200x630, estilo "carta espiritual".
// Sin LLM, sin web fonts externas — usamos las del sistema.
// Acceso protegido por sesion (no queremos exponer notas de otros usuarios).

import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { entradasDelDia } from "@/lib/entradas";
import { planDeUsuario } from "@/lib/plan-limits";

export const runtime = "nodejs"; // necesitamos prisma + better-auth

interface Params {
  fecha: string;
}

function esFechaValida(f: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(f);
}

function fechaBonita(f: string): string {
  const d = new Date(`${f}T12:00:00Z`);
  return d
    .toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function fragmento(texto: string, max: number): string {
  const t = texto.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { fecha } = await ctx.params;
  if (!esFechaValida(fecha)) {
    return new Response("fecha invalida", { status: 400 });
  }

  const sesion = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!sesion?.user?.id) {
    return new Response("requiere sesion", { status: 401 });
  }

  // Solo premium pueden compartir días que no sean hoy.
  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.user.id },
    select: { premiumHasta: true },
  });
  const esPremium = planDeUsuario(usuario?.premiumHasta) === "PREMIUM";
  const hoy = new Date().toISOString().slice(0, 10);
  if (!esPremium && fecha !== hoy) {
    return new Response("requiere premium", { status: 403 });
  }

  const entradas = await entradasDelDia(sesion.user.id, fecha);
  const primera = entradas[0];

  // Para la imagen tomamos la PRIMERA entrada del dia como protagonista.
  // Si hay mas, mostramos un contador.
  let verso = "";
  let referencia = "";
  let estadoTag = "";
  if (primera) {
    if (primera.versiculo) {
      verso = fragmento(primera.versiculo.texto, 220);
      referencia = `${primera.versiculo.libro.nombre} ${primera.versiculo.capitulo}:${primera.versiculo.versiculo}`;
    } else if (primera.lecturaInicio) {
      referencia = `${primera.lecturaInicio.libro.nombre} ${primera.lecturaInicio.capitulo}`;
      verso = "Una lectura en silencio.";
    }
    if (primera.estado) {
      estadoTag = primera.estado.emoji ? `${primera.estado.emoji} ${primera.estado.nombre}` : primera.estado.nombre;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#faf7f2",
          padding: "70px 90px",
          fontFamily: "Georgia, serif",
          color: "#2b2b2b",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#9c8a78", letterSpacing: 2 }}>
          <span>DEVOCIONAL</span>
          <span>{fechaBonita(fecha).toUpperCase()}</span>
        </div>

        {/* Cuerpo */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingTop: 40,
          }}
        >
          {!primera ? (
            <div style={{ display: "flex", justifyContent: "center", fontSize: 36, color: "#888" }}>
              Sin entrada para este día
            </div>
          ) : (
            <>
              {estadoTag && (
                <div
                  style={{
                    display: "flex",
                    fontSize: 24,
                    color: "#5b4636",
                    marginBottom: 22,
                    letterSpacing: 1,
                  }}
                >
                  {estadoTag}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  fontSize: 44,
                  lineHeight: 1.35,
                  color: "#2b2b2b",
                  borderLeft: "3px solid #c8a87a",
                  paddingLeft: 30,
                  marginBottom: 32,
                }}
              >
                “{verso}”
              </div>
              <div style={{ display: "flex", fontSize: 26, color: "#5b4636", fontStyle: "italic" }}>
                — {referencia}
              </div>
            </>
          )}
        </div>

        {/* Pie */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            color: "#9c8a78",
            borderTop: "1px solid #e8dccd",
            paddingTop: 22,
          }}
        >
          <span>biblia.devo</span>
          <span>
            {entradas.length > 1
              ? `${entradas.length} entradas hoy`
              : entradas.length === 1
                ? "1 entrada hoy"
                : ""}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

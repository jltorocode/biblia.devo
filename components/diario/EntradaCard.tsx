// Render visual de UNA entrada del diario en formato "carta espiritual".
// Sin generacion de texto, solo composicion tipografica.
//
// Modos:
//  - estado / conversacion: "Hoy me sentí X (por Y). La Palabra que recibí: ..."
//  - lectura:               "Hoy abrí mi Biblia en X N. Leí y anoté..."

import { AREAS_POR_SLUG } from "@/lib/areas";

interface VersiculoBasico {
  capitulo: number;
  versiculo: number;
  texto: string;
  libro: { nombre: string; nombreCorto: string; codigo: string };
}

export interface EntradaDiarioInput {
  id: string;
  modo: "estado" | "conversacion" | "lectura";
  creadoEn: Date;
  nota: string | null;
  area: string | null;
  estado: {
    nombre: string;
    emoji: string | null;
    colorHex: string | null;
  } | null;
  versiculo: VersiculoBasico | null;
  lecturaInicio: {
    capitulo: number;
    versiculo: number;
    libro: { nombre: string; nombreCorto: string; codigo: string };
  } | null;
  lecturaFin: {
    capitulo: number;
    versiculo: number;
  } | null;
}

export function EntradaCard({ entrada }: { entrada: EntradaDiarioInput }) {
  const hora = entrada.creadoEn.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="rounded-2xl border border-stone-200 bg-white/80 px-6 py-8 sm:px-10 sm:py-10 shadow-sm">
      <header className="flex items-center justify-between border-b border-stone-100 pb-4">
        <span className="text-xs uppercase tracking-[0.18em] text-stone-400">
          {hora}
        </span>
        <span className="text-xs uppercase tracking-[0.18em] text-stone-400">
          {modoLabel(entrada.modo)}
        </span>
      </header>

      <div className="mt-6 space-y-6 text-stone-700">
        {(entrada.modo === "estado" || entrada.modo === "conversacion") && entrada.estado && (
          <CuerpoEstado entrada={entrada} />
        )}
        {entrada.modo === "lectura" && entrada.lecturaInicio && (
          <CuerpoLectura entrada={entrada} />
        )}
      </div>

      {entrada.nota && (
        <div className="mt-8 border-t border-stone-100 pt-6">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400 mb-3">
            Mi reflexión
          </p>
          <p
            className="text-base leading-relaxed text-stone-700 italic whitespace-pre-wrap"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            {entrada.nota}
          </p>
        </div>
      )}
    </article>
  );
}

function CuerpoEstado({ entrada }: { entrada: EntradaDiarioInput }) {
  const estado = entrada.estado!;
  const verso = entrada.versiculo!;
  const ref = `${verso.libro.nombre} ${verso.capitulo}:${verso.versiculo}`;
  const areaInfo = entrada.area ? AREAS_POR_SLUG.get(entrada.area as never) : null;

  return (
    <>
      <p className="text-stone-600">
        Hoy me sentí{" "}
        <strong className="text-stone-800">{estado.nombre.toLowerCase()}</strong>
        {estado.emoji && <span className="ml-1.5">{estado.emoji}</span>}
        {areaInfo && (
          <>
            {" "}sobre{" "}
            <strong className="text-stone-800">{areaInfo.nombre.toLowerCase()}</strong>
            <span className="ml-1.5">{areaInfo.emoji}</span>
          </>
        )}
        .
      </p>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-400 mb-3">
          La Palabra que recibí
        </p>
        <blockquote
          className="border-l-2 pl-5 text-lg sm:text-xl leading-relaxed text-stone-800"
          style={{
            fontFamily: "var(--font-lora), Georgia, serif",
            borderColor: estado.colorHex ?? "#c8a87a",
          }}
        >
          {limpiar(verso.texto)}
        </blockquote>
        <p className="mt-3 text-sm font-medium text-stone-600">— {ref}</p>
      </div>
    </>
  );
}

function CuerpoLectura({ entrada }: { entrada: EntradaDiarioInput }) {
  const li = entrada.lecturaInicio!;
  const lf = entrada.lecturaFin;
  const rangoVersos =
    lf && (lf.capitulo !== li.capitulo || lf.versiculo !== li.versiculo)
      ? lf.capitulo === li.capitulo
        ? `${li.libro.nombre} ${li.capitulo}:${li.versiculo}–${lf.versiculo}`
        : `${li.libro.nombre} ${li.capitulo}:${li.versiculo} – ${lf.capitulo}:${lf.versiculo}`
      : `${li.libro.nombre} ${li.capitulo}:${li.versiculo}`;

  return (
    <p className="text-stone-700">
      Hoy abrí mi Biblia en{" "}
      <strong className="text-stone-800">{rangoVersos}</strong>.
    </p>
  );
}

function modoLabel(modo: EntradaDiarioInput["modo"]): string {
  if (modo === "lectura") return "Lectura";
  if (modo === "conversacion") return "Conversación";
  return "Estado del día";
}

function limpiar(t: string): string {
  return t.trim().replace(/\s+/g, " ");
}

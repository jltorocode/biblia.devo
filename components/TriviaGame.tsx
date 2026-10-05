"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Heart, Clock, Trophy, Zap, RotateCcw, Home, Check, X } from "lucide-react";
import type { Pregunta } from "@/lib/trivia";
import { SEGUNDOS_POR_PREGUNTA, VIDAS_INICIALES } from "@/lib/trivia";

interface Props {
  preguntas: Pregunta[];
  modoLabel: string;
  modoEmoji: string;
  modoHref: string;
}

type Estado = "jugando" | "respondida" | "terminada";

interface Respuesta {
  pregId: string;
  correcta: boolean;
  tiempoUsado: number;
  seleccionada: number | null; // null = se acabó el tiempo
}

export function TriviaGame({ preguntas, modoLabel, modoEmoji, modoHref }: Props) {
  const total = preguntas.length;
  const [indice, setIndice] = useState(0);
  const [puntaje, setPuntaje] = useState(0);
  const [vidas, setVidas] = useState(VIDAS_INICIALES);
  const [racha, setRacha] = useState(0);
  const [rachaMax, setRachaMax] = useState(0);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [tiempo, setTiempo] = useState(SEGUNDOS_POR_PREGUNTA);
  const [estado, setEstado] = useState<Estado>("jugando");
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const tiempoInicio = useRef<number>(0);
  const opcionesShuffled = useMemo(() => {
    // Mezclar el orden de opciones por pregunta para evitar memorización
    return preguntas.map(() => {
      const indices = [0, 1, 2, 3];
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      return indices;
    });
  }, [preguntas]);

  const preg = preguntas[indice];
  const ordenActual = opcionesShuffled[indice] ?? [0, 1, 2, 3];

  // Reset + countdown en un solo effect (evita cascading renders entre dos
  // useEffect que comparten dependencias). El reset del cronómetro y el
  // arranque del intervalo viven juntos.
  useEffect(() => {
    if (estado !== "jugando") return;
    tiempoInicio.current = Date.now();
    // Reset deliberado al cambiar de pregunta — un render extra es aceptable
    // vs. el refactor a key prop o derivar `tiempo` de Date.now() en render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTiempo(SEGUNDOS_POR_PREGUNTA);
    const id = setInterval(() => {
      setTiempo((t) => {
        if (t <= 1) {
          clearInterval(id);
          // Tiempo agotado → cuenta como fallo
          manejarRespuesta(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, estado]);

  function manejarRespuesta(opcion: number | null) {
    if (estado !== "jugando") return;
    const tiempoUsado = (Date.now() - tiempoInicio.current) / 1000;
    const correcta = opcion !== null && opcion === preg.correcta;

    setSeleccionada(opcion);
    setEstado("respondida");

    const nuevaResp: Respuesta = {
      pregId: preg.id,
      correcta,
      tiempoUsado,
      seleccionada: opcion,
    };
    setRespuestas((r) => [...r, nuevaResp]);

    if (correcta) {
      // Score: base 100 + bono tiempo (0-50) + bono racha (10 por consecutivas)
      const bonoTiempo = Math.max(0, Math.floor((SEGUNDOS_POR_PREGUNTA - tiempoUsado) * 3));
      const bonoRacha = racha * 10;
      const ganado = 100 + bonoTiempo + bonoRacha;
      setPuntaje((p) => p + ganado);
      setRacha((r) => {
        const nueva = r + 1;
        setRachaMax((m) => Math.max(m, nueva));
        return nueva;
      });
    } else {
      setVidas((v) => v - 1);
      setRacha(0);
    }
  }

  function siguiente() {
    // `vidas` ya fue decrementado por manejarRespuesta — usar el valor actual.
    if (vidas <= 0) {
      setEstado("terminada");
      return;
    }
    if (indice + 1 >= total) {
      setEstado("terminada");
      return;
    }
    setIndice((i) => i + 1);
    setSeleccionada(null);
    setEstado("jugando");
  }

  function reiniciar() {
    setIndice(0);
    setPuntaje(0);
    setVidas(VIDAS_INICIALES);
    setRacha(0);
    setRachaMax(0);
    setSeleccionada(null);
    setTiempo(SEGUNDOS_POR_PREGUNTA);
    setRespuestas([]);
    setEstado("jugando");
  }

  // ────────── Pantalla final ──────────
  if (estado === "terminada") {
    const correctas = respuestas.filter((r) => r.correcta).length;
    const respondidas = respuestas.length;
    const precision = respondidas > 0 ? Math.round((correctas / respondidas) * 100) : 0;
    const tiempoPromedio =
      respondidas > 0
        ? Math.round((respuestas.reduce((s, r) => s + r.tiempoUsado, 0) / respondidas) * 10) / 10
        : 0;

    const veredicto =
      precision === 100
        ? { titulo: "¡Perfecto! 🌟", color: "text-amber-600", msg: "Conocés tu Biblia. Otra ronda quizás?" }
        : precision >= 80
        ? { titulo: "¡Excelente! 🎯", color: "text-emerald-600", msg: "Casi perfecto. Estás afinado." }
        : precision >= 60
        ? { titulo: "Buen intento 👏", color: "text-blue-600", msg: "Vas por buen camino. Otra vez?" }
        : precision >= 40
        ? { titulo: "Sigue practicando 💪", color: "text-orange-600", msg: "Toda historia se aprende leyendo. Volvé a la Biblia." }
        : { titulo: "Hora de leer 📖", color: "text-stone-700", msg: "Una buena lectura cambia el próximo intento." };

    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-8 ring-1 ring-stone-200 text-center sm:p-12">
          <div className="text-6xl">{precision >= 80 ? "🏆" : precision >= 60 ? "🎯" : "📖"}</div>
          <h2 className={`mt-4 font-serif text-3xl ${veredicto.color} sm:text-4xl`}>
            {veredicto.titulo}
          </h2>
          <p className="mt-2 text-sm text-stone-600">{veredicto.msg}</p>

          {/* Score grande */}
          <div className="mt-8 inline-flex items-baseline gap-2 rounded-2xl bg-white px-8 py-4 ring-1 ring-stone-200 shadow-sm">
            <span className="font-serif text-5xl text-stone-900">{puntaje}</span>
            <span className="text-xs uppercase tracking-wider text-stone-500">puntos</span>
          </div>

          {/* Grid de stats */}
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Aciertos" valor={`${correctas}/${respondidas}`} />
            <StatBox label="Precisión" valor={`${precision}%`} />
            <StatBox label="Racha máx" valor={`${rachaMax}🔥`} />
            <StatBox label="T° prom" valor={`${tiempoPromedio}s`} />
          </dl>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={reiniciar}
              className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
            >
              <RotateCcw className="size-4" aria-hidden />
              Otra ronda
            </button>
            <Link
              href={modoHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-stone-700 ring-1 ring-stone-200 shadow-sm transition hover:bg-stone-50"
            >
              Cambiar modo
            </Link>
            <Link
              href="/trivia"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-stone-700 ring-1 ring-stone-200 shadow-sm transition hover:bg-stone-50"
            >
              <Home className="size-4" aria-hidden />
              Inicio
            </Link>
          </div>

          {/* Repaso de fallos */}
          {respuestas.some((r) => !r.correcta) && (
            <div className="mt-10 text-left">
              <h3 className="font-serif text-lg text-stone-800">Repaso de lo fallado</h3>
              <ul className="mt-3 space-y-2">
                {respuestas.map((r, i) => {
                  if (r.correcta) return null;
                  const p = preguntas[i];
                  return (
                    <li
                      key={r.pregId}
                      className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4"
                    >
                      <p className="text-sm text-stone-800">
                        <strong>{p.pregunta}</strong>
                      </p>
                      <p className="mt-1.5 text-xs text-emerald-700">
                        ✓ {p.opciones[p.correcta]}
                      </p>
                      <p className="mt-1 text-xs text-stone-600">{p.explicacion}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ────────── Pantalla de juego ──────────
  const progreso = ((indice) / total) * 100;
  const tiempoProgreso = (tiempo / SEGUNDOS_POR_PREGUNTA) * 100;
  const tiempoCritico = tiempo <= 5;

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-6 sm:py-8">
      {/* Header: modo + vidas + score */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/trivia"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
        >
          <span>{modoEmoji}</span>
          <span className="hidden sm:inline">{modoLabel}</span>
        </Link>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: VIDAS_INICIALES }).map((_, i) => (
            <Heart
              key={i}
              className={`size-5 transition ${
                i < vidas ? "fill-rose-500 text-rose-500" : "fill-stone-200 text-stone-300"
              }`}
              aria-hidden
            />
          ))}
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white">
          <Trophy className="size-3.5" aria-hidden />
          {puntaje}
        </div>
      </div>

      {/* Progress bar de preguntas */}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
          style={{ width: `${progreso}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-stone-500">
        <span>
          Pregunta {indice + 1} / {total}
        </span>
        {racha >= 2 && (
          <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
            <Zap className="size-3" aria-hidden /> Racha x{racha}
          </span>
        )}
      </div>

      {/* Timer bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold transition ${
              tiempoCritico ? "text-rose-600" : "text-stone-600"
            }`}
          >
            <Clock className="size-3.5" aria-hidden />
            {tiempo}s
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              tiempoCritico
                ? "bg-gradient-to-r from-rose-400 to-rose-600"
                : "bg-gradient-to-r from-amber-300 to-orange-500"
            }`}
            style={{ width: `${tiempoProgreso}%` }}
          />
        </div>
      </div>

      {/* Card de pregunta */}
      <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-stone-200 shadow-sm sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
          {preg.testamento === "AT" ? "Antiguo Testamento" : "Nuevo Testamento"} · {preg.libro}
        </p>
        <h2 className="mt-3 font-serif text-2xl leading-snug text-stone-900 sm:text-3xl">
          {preg.pregunta}
        </h2>
      </div>

      {/* Opciones */}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {ordenActual.map((idxOriginal, posVisual) => {
          const opcion = preg.opciones[idxOriginal];
          const esCorrecta = idxOriginal === preg.correcta;
          const esSeleccionada = seleccionada === idxOriginal;
          const mostrarFeedback = estado === "respondida";

          let cls =
            "group relative flex items-center gap-3 rounded-2xl border bg-white p-4 text-left text-sm font-medium text-stone-800 transition";
          if (!mostrarFeedback) {
            cls += " border-stone-200 hover:border-stone-400 hover:bg-stone-50 active:scale-[0.99]";
          } else if (esCorrecta) {
            cls += " border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200";
          } else if (esSeleccionada) {
            cls += " border-rose-400 bg-rose-50 ring-2 ring-rose-200";
          } else {
            cls += " border-stone-200 opacity-50";
          }

          return (
            <button
              key={idxOriginal}
              disabled={mostrarFeedback}
              onClick={() => manejarRespuesta(idxOriginal)}
              className={cls}
            >
              <span
                className={`inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  mostrarFeedback && esCorrecta
                    ? "bg-emerald-500 text-white"
                    : mostrarFeedback && esSeleccionada
                    ? "bg-rose-500 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {String.fromCharCode(65 + posVisual)}
              </span>
              <span className="flex-1">{opcion}</span>
              {mostrarFeedback && esCorrecta && <Check className="size-5 text-emerald-600" aria-hidden />}
              {mostrarFeedback && esSeleccionada && !esCorrecta && (
                <X className="size-5 text-rose-600" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback + siguiente */}
      {estado === "respondida" && (
        <div
          className={`mt-5 rounded-2xl p-5 ring-1 ${
            seleccionada === preg.correcta
              ? "bg-emerald-50 ring-emerald-200"
              : "bg-rose-50 ring-rose-200"
          }`}
        >
          <p
            className={`font-serif text-lg ${
              seleccionada === preg.correcta ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            {seleccionada === preg.correcta
              ? "✓ ¡Correcto!"
              : seleccionada === null
              ? "⏱ Se acabó el tiempo"
              : "✗ No, era…"}
          </p>
          {seleccionada !== preg.correcta && (
            <p className="mt-1 text-sm text-stone-700">
              <strong>{preg.opciones[preg.correcta]}</strong>
            </p>
          )}
          <p className="mt-2 text-sm leading-relaxed text-stone-700">{preg.explicacion}</p>
          <button
            onClick={siguiente}
            className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm transition ${
              seleccionada === preg.correcta
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-stone-900 text-white hover:bg-stone-800"
            }`}
          >
            {indice + 1 >= total || vidas <= 0 ? "Ver resultado" : "Siguiente →"}
          </button>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-stone-200">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </dt>
      <dd className="mt-0.5 font-serif text-xl text-stone-900">{valor}</dd>
    </div>
  );
}

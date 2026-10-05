"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // El digest viene de Next y permite cruzar el log del servidor.
    console.error("[error.tsx]", error.message, error.digest);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16 text-center">
      <div className="max-w-md">
        <p className="font-serif text-6xl text-stone-300 mb-4">Algo se rompió</p>
        <h1 className="font-serif text-2xl text-stone-800 mb-3">
          Ocurrió un error inesperado
        </h1>
        <p className="text-stone-600 mb-6">
          Lo lamentamos. Intenta de nuevo o vuelve al inicio. Si sigue pasando,
          escríbenos.
        </p>
        {error.digest && (
          <p className="text-xs text-stone-400 mb-6 font-mono">
            ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-stone-700 hover:bg-stone-800 text-white px-5 py-3 rounded-lg font-medium transition-colors"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="border border-stone-300 hover:bg-stone-50 text-stone-700 px-5 py-3 rounded-lg font-medium transition-colors"
          >
            Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

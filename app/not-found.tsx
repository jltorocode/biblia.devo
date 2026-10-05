import Link from "next/link";

export const metadata = {
  title: "No encontramos esta página",
};

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16 text-center">
      <div className="max-w-md">
        <p className="font-serif text-6xl text-stone-300 mb-4">404</p>
        <h1 className="font-serif text-3xl text-stone-800 mb-3">
          No encontramos esta página
        </h1>
        <p className="text-stone-600 mb-8">
          Tal vez el enlace se rompió o esta sección ya no existe. Vuelve al inicio y elige
          cómo te sientes hoy.
        </p>
        <Link
          href="/"
          className="inline-block bg-stone-700 hover:bg-stone-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

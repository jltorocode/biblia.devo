export const metadata = {
  title: "Sin conexion",
};

export default function OfflinePage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16 text-center">
      <div className="max-w-md">
        <h1 className="font-serif text-3xl text-stone-800 mb-3">Sin conexion</h1>
        <p className="text-stone-600">
          No hay red ahora mismo. Tu ultimo versiculo aun esta guardado. Vuelve a intentarlo
          cuando recuperes conexion.
        </p>
      </div>
    </main>
  );
}

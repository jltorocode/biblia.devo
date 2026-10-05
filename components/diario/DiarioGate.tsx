import Link from "next/link";

export function DiarioGate() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
      <div className="rounded-2xl border border-stone-200 bg-white/80 px-8 py-12 sm:px-12 sm:py-16 shadow-sm text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-400 mb-3">
          Premium
        </p>
        <h1
          className="font-serif text-3xl sm:text-4xl text-stone-800 mb-4"
          style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
        >
          Tu diario espiritual
        </h1>
        <p className="mx-auto max-w-md text-stone-600 leading-relaxed">
          Cada día, una entrada con lo que sentiste, la Palabra que recibiste y tu
          reflexión. Mes a mes, ves todo lo que Dios te fue diciendo en un solo lugar.
        </p>

        {/* Preview visual (no real data) */}
        <div className="my-10 rounded-xl border border-stone-200 bg-stone-50/60 px-6 py-8 text-left">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400 mb-2">
            Lunes 18 de mayo
          </p>
          <p className="text-sm text-stone-600">
            Hoy me sentí <strong className="text-stone-800">ansioso</strong> 😰 sobre{" "}
            <strong className="text-stone-800">trabajo</strong> 💼.
          </p>
          <blockquote
            className="mt-4 border-l-2 border-stone-300 pl-4 text-base leading-relaxed text-stone-700"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            “Echando toda vuestra solicitud en él, porque él tiene cuidado de
            vosotros.”
          </blockquote>
          <p className="mt-2 text-xs text-stone-500">— 1 Pedro 5:7</p>
        </div>

        <ul className="mx-auto max-w-md space-y-3 text-left text-sm text-stone-700">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-stone-400">✦</span>
            <span>Entradas <strong>ilimitadas</strong> al día</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-stone-400">✦</span>
            <span>Vista mensual con todas tus reflexiones en una página</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-stone-400">✦</span>
            <span>Acceso completo a tu historia (sin límite de 90 días)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-stone-400">✦</span>
            <span>Versículos ilimitados guardados</span>
          </li>
        </ul>

        <Link
          href="/premium"
          className="mt-10 inline-block rounded-full bg-stone-800 px-7 py-3 text-sm font-medium text-white hover:bg-stone-900 transition"
        >
          Ver planes Premium
        </Link>
      </div>
    </main>
  );
}

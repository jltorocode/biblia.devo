import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Cómo Devocional trata tus datos personales.",
};

const ULTIMA_ACTUALIZACION = "2026-05-18";

export default function PrivacidadPage() {
  return (
    <main className="flex-1 px-6 py-12 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-stone-800 mb-2">Política de privacidad</h1>
      <p className="text-sm text-stone-500 mb-8">Última actualización: {ULTIMA_ACTUALIZACION}</p>

      <article className="prose prose-stone max-w-none space-y-6 text-stone-700">
        <section>
          <h2 className="font-serif text-xl text-stone-800">1. Quiénes somos</h2>
          <p>
            Devocional es una aplicación que entrega versículos de la Biblia (Reina-Valera 1909,
            dominio público) según el estado de ánimo del usuario. El responsable del tratamiento
            es el operador del servicio.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">2. Qué datos recopilamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Cuenta</strong>: email, nombre opcional y hash de contraseña (no la
              contraseña en claro).
            </li>
            <li>
              <strong>Uso</strong>: estados de ánimo seleccionados, versículos guardados,
              historial de interacciones y hora preferida de recordatorio.
            </li>
            <li>
              <strong>Pagos</strong>: identificadores de suscripción del proveedor (Stripe,
              MercadoPago o PayPal). <em>No almacenamos números de tarjeta.</em>
            </li>
            <li>
              <strong>Cookie anónima</strong> (<code>devo_uid</code>): permite usar la app sin
              cuenta. Si te registras, migramos tu actividad anónima a la cuenta nueva.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">3. Para qué los usamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Servir la aplicación y personalizar la rotación de versículos.</li>
            <li>Enviar el recordatorio diario si lo activas en tus ajustes.</li>
            <li>Procesar pagos de la suscripción Premium.</li>
            <li>Comunicaciones operativas (bienvenida, cambios en la suscripción).</li>
          </ul>
          <p>No hacemos publicidad ni vendemos datos a terceros.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">4. Terceros con los que compartimos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Stripe / MercadoPago / PayPal</strong>: solo para procesar la suscripción
              que elijas.
            </li>
            <li>
              <strong>Servidor SMTP propio</strong>: para enviar correos transaccionales.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">5. Tus derechos</h2>
          <p>
            Puedes acceder, corregir o eliminar tu cuenta desde la página de ajustes. Para borrar
            todos tus datos contáctanos por email — eliminamos también los identificadores de
            suscripción asociados.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">6. Conservación</h2>
          <p>
            Guardamos tus datos mientras tu cuenta esté activa. Al cerrarla, eliminamos tu
            actividad personal en un plazo razonable, salvo lo que la ley exija conservar
            (facturación).
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">7. Contacto</h2>
          <p>
            Preguntas o solicitudes de borrado:{" "}
            <a href="mailto:hola@biblia.devo" className="underline">
              hola@biblia.devo
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}

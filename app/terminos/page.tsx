import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos",
  description: "Términos y condiciones de uso de Devocional.",
};

const ULTIMA_ACTUALIZACION = "2026-05-18";

export default function TerminosPage() {
  return (
    <main className="flex-1 px-6 py-12 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-stone-800 mb-2">Términos y condiciones</h1>
      <p className="text-sm text-stone-500 mb-8">Última actualización: {ULTIMA_ACTUALIZACION}</p>

      <article className="prose prose-stone max-w-none space-y-6 text-stone-700">
        <section>
          <h2 className="font-serif text-xl text-stone-800">1. Aceptación</h2>
          <p>
            Al usar Devocional aceptas estos términos. Si no estás de acuerdo, no uses el
            servicio.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">2. Qué es el servicio</h2>
          <p>
            Devocional entrega versículos de la Biblia (Reina-Valera 1909, dominio público)
            clasificados por estado de ánimo, con opción de guardar favoritos y recordatorios
            diarios.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">3. Cuenta</h2>
          <p>
            Eres responsable de mantener segura tu contraseña. Puedes usar Devocional sin
            cuenta — algunas funciones (guardados sincronizados, recordatorios, Premium)
            requieren registro.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">4. Suscripción Premium</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>El pago se realiza a través de Stripe, MercadoPago o PayPal, según elijas.</li>
            <li>
              La suscripción se renueva automáticamente hasta que la canceles desde la página
              de ajustes.
            </li>
            <li>
              Si cancelas, mantienes acceso Premium hasta el final del período ya pagado; no
              hay reembolsos prorrateados.
            </li>
            <li>El precio puede cambiar con aviso previo de 30 días.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">5. Uso aceptable</h2>
          <p>No uses el servicio para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Vulnerar la seguridad o disponibilidad de la app.</li>
            <li>Automatizar acceso a escala (scraping, bots) sin permiso escrito.</li>
            <li>Redistribuir contenido propio del servicio sin atribución.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">6. Contenido bíblico</h2>
          <p>
            La Reina-Valera 1909 es de dominio público. Otras versiones que añadamos en el
            futuro tendrán su licencia indicada en la app.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">7. Sin garantía</h2>
          <p>
            El servicio se entrega &quot;tal cual&quot;. No garantizamos disponibilidad
            ininterrumpida ni ausencia de errores. Devocional es una herramienta de edificación,
            no sustituye consejería pastoral o profesional.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">8. Limitación de responsabilidad</h2>
          <p>
            En la máxima medida que permita la ley, no respondemos por daños indirectos, pérdida
            de datos o lucro cesante derivados del uso del servicio.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">9. Cambios</h2>
          <p>
            Podemos actualizar estos términos. Si el cambio es material, te avisaremos por email
            o dentro de la app antes de que entre en vigor.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-stone-800">10. Contacto</h2>
          <p>
            Para cualquier consulta:{" "}
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

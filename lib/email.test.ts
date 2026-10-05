import { beforeEach, describe, expect, it } from "vitest";
import { enviarEmail, getTransporter, _resetTransporter } from "./email";
import { plantillaBienvenida, plantillaRecordatorio } from "./email-plantillas";

// Sin SMTP_* en entorno de test el transporter cae a jsonTransport,
// que devuelve el payload en `info.message` (string JSON) sin enviar.

beforeEach(() => {
  _resetTransporter();
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
});

describe("lib/email", () => {
  it("usa jsonTransport cuando faltan SMTP_*", () => {
    const t = getTransporter();
    expect(t.transporter).toBeDefined();
    // jsonTransport expone `name === "JSONTransport"` en nodemailer.
    // El cast a unknown evita la rigidez del tipo Transporter.
    const name = (t as unknown as { transporter: { name: string } }).transporter.name;
    expect(name).toMatch(/json/i);
  });

  it("enviarEmail devuelve el payload serializado por jsonTransport", async () => {
    process.env.SMTP_FROM = "Devocional <devo@test.local>";
    const info = (await enviarEmail({
      to: "user@test.local",
      subject: "asunto",
      html: "<p>hola</p>",
      text: "hola",
    })) as unknown as { message: string };

    const payload = JSON.parse(info.message);
    expect(payload.to).toEqual([{ address: "user@test.local", name: "" }]);
    expect(payload.from).toEqual({ address: "devo@test.local", name: "Devocional" });
    expect(payload.subject).toBe("asunto");
    expect(payload.text).toBe("hola");
    expect(payload.html).toBe("<p>hola</p>");
  });
});

describe("plantillas", () => {
  it("bienvenida incluye nombre cuando hay nombre", () => {
    const { subject, text, html } = plantillaBienvenida({
      nombre: "Maria",
      appUrl: "https://app.test",
    });
    expect(subject).toBe("Bienvenido a Devocional");
    expect(text).toMatch(/Hola, Maria/);
    expect(html).toMatch(/Hola, Maria/);
    expect(html).toMatch(/https:\/\/app\.test/);
  });

  it("bienvenida sin nombre", () => {
    const { text } = plantillaBienvenida({ nombre: null, appUrl: "https://app.test" });
    expect(text).toMatch(/^Hola,\n/);
  });

  it("recordatorio escapa HTML en texto y referencia", () => {
    const { html, subject, text } = plantillaRecordatorio({
      nombre: null,
      referencia: "Salmos 23:1",
      texto: 'Jehova es mi pastor <script>alert("x")</script>',
      estadoNombre: "Esperanzado",
      appUrl: "https://app.test",
    });
    expect(subject).toBe("Tu versiculo de hoy — Salmos 23:1");
    expect(text).toMatch(/Salmos 23:1/);
    expect(html).not.toMatch(/<script>/);
    expect(html).toMatch(/&lt;script&gt;/);
  });
});

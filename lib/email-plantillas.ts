type BienvenidaInput = {
  nombre: string | null;
  appUrl: string;
};

type RecordatorioInput = {
  nombre: string | null;
  referencia: string; // p.ej. "Salmos 23:1"
  texto: string;
  estadoNombre: string; // p.ej. "Esperanzado"
  appUrl: string;
};

const baseHtml = (titulo: string, cuerpo: string) => `<!doctype html>
<html lang="es">
  <body style="font-family:Georgia,serif;background:#faf7f2;color:#2b2b2b;padding:32px 16px;margin:0;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.05);">
      <h1 style="font-size:20px;margin:0 0 16px;">${titulo}</h1>
      ${cuerpo}
    </div>
    <p style="text-align:center;color:#888;font-size:12px;margin-top:24px;">
      Devocional &middot; La Palabra de Dios para cada momento.
    </p>
  </body>
</html>`;

export function plantillaBienvenida(input: BienvenidaInput) {
  const saludo = input.nombre ? `Hola, ${input.nombre}` : "Hola";
  const subject = "Bienvenido a Devocional";
  const text = `${saludo},

Gracias por unirte a Devocional. Recibe la Palabra de Dios segun como te sientas hoy.

Abrir la app: ${input.appUrl}
Configurar recordatorio diario: ${input.appUrl}/ajustes

— El equipo de Devocional`;

  const html = baseHtml(
    `${saludo} 👋`,
    `<p>Gracias por unirte a <strong>Devocional</strong>. Recibe la Palabra de Dios segun como te sientas hoy.</p>
     <p style="margin:24px 0;">
       <a href="${input.appUrl}" style="display:inline-block;background:#5b4636;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Abrir la app</a>
     </p>
     <p style="font-size:14px;color:#666;">¿Quieres recibir un versiculo cada manana? Configura tu recordatorio en <a href="${input.appUrl}/ajustes">tus ajustes</a>.</p>`,
  );

  return { subject, text, html };
}

export function plantillaRecordatorio(input: RecordatorioInput) {
  const saludo = input.nombre ? `Hola, ${input.nombre}` : "Hola";
  const subject = `Tu versiculo de hoy — ${input.referencia}`;
  const text = `${saludo},

${input.texto}
— ${input.referencia}

Si hoy te sientes "${input.estadoNombre.toLowerCase()}", recuerda que Dios tiene una palabra para ti.

Abrir la app: ${input.appUrl}

— El equipo de Devocional`;

  const html = baseHtml(
    `${saludo} ☀️`,
    `<p style="font-size:14px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;">Tu versiculo de hoy</p>
     <blockquote style="font-family:Lora,Georgia,serif;font-size:20px;line-height:1.5;margin:0 0 16px;border-left:3px solid #c8a87a;padding-left:16px;color:#2b2b2b;">
       ${escapeHtml(input.texto)}
     </blockquote>
     <p style="font-weight:600;color:#5b4636;">— ${escapeHtml(input.referencia)}</p>
     <p style="margin-top:24px;color:#555;">Si hoy te sientes <em>${escapeHtml(input.estadoNombre.toLowerCase())}</em>, Dios tiene una palabra para ti.</p>
     <p style="margin:24px 0;">
       <a href="${input.appUrl}" style="display:inline-block;background:#5b4636;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Abrir la app</a>
     </p>`,
  );

  return { subject, text, html };
}

type ResumenMensualInput = {
  nombre: string | null;
  mesNombre: string; // p.ej. "mayo de 2026"
  mesISO: string; // YYYY-MM
  totalEntradas: number;
  diasActivos: number;
  destacados: Array<{ fecha: string; emoji: string | null; referencia: string }>;
  appUrl: string;
};

export function plantillaResumenMensual(input: ResumenMensualInput) {
  const saludo = input.nombre ? `Hola, ${input.nombre}` : "Hola";
  const subject = `Tu mes con Dios — ${input.mesNombre}`;
  const enlaceMes = `${input.appUrl}/diario/mes/${input.mesISO}`;

  const text = `${saludo},

Cerraste ${input.mesNombre} con:
  · ${input.totalEntradas} entradas en el diario
  · ${input.diasActivos} dias activos

${input.destacados
  .slice(0, 5)
  .map((d) => `  ${d.fecha}  ${d.emoji ?? "·"}  ${d.referencia}`)
  .join("\n")}

Mira el mes completo: ${enlaceMes}

— El equipo de Devocional`;

  const filasDestacadas = input.destacados
    .slice(0, 5)
    .map(
      (d) => `<tr>
        <td style="padding:6px 8px;color:#888;font-size:13px;">${escapeHtml(d.fecha)}</td>
        <td style="padding:6px 8px;font-size:18px;">${d.emoji ?? "·"}</td>
        <td style="padding:6px 8px;color:#444;font-size:14px;font-family:Lora,Georgia,serif;">${escapeHtml(d.referencia)}</td>
      </tr>`,
    )
    .join("");

  const html = baseHtml(
    `${saludo} ✦`,
    `<p style="font-size:14px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;">Tu mes con Dios</p>
     <h2 style="font-family:Lora,Georgia,serif;font-size:24px;color:#2b2b2b;margin:0 0 16px;text-transform:capitalize;">${escapeHtml(input.mesNombre)}</h2>
     <p style="color:#555;line-height:1.6;">Cerraste el mes con
       <strong>${input.totalEntradas}</strong> entradas en
       <strong>${input.diasActivos}</strong> dia${input.diasActivos === 1 ? "" : "s"} activos.
     </p>

     ${
       filasDestacadas
         ? `<table style="width:100%;border-collapse:collapse;margin:20px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;">${filasDestacadas}</table>`
         : ""
     }

     <p style="margin:24px 0;">
       <a href="${enlaceMes}" style="display:inline-block;background:#5b4636;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;">Ver el mes completo</a>
     </p>
     <p style="font-size:13px;color:#888;">Sigue escribiendo. Sigue escuchando.</p>`,
  );

  return { subject, text, html };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

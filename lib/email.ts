import nodemailer, { type Transporter } from "nodemailer";

type EnviarEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let _transporter: Transporter | null = null;

function buildTransporter(): Transporter {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Sin SMTP configurado (tests, dev sin servidor) usamos jsonTransport:
  // no envia nada por la red, devuelve el payload en `info.message`.
  if (!host || !user || !pass) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function getTransporter(): Transporter {
  if (!_transporter) _transporter = buildTransporter();
  return _transporter;
}

/** Solo para tests: forzar reconstruccion del transporter. */
export function _resetTransporter() {
  _transporter = null;
}

export async function enviarEmail(input: EnviarEmailInput) {
  const from =
    process.env.SMTP_FROM ?? `Devocional <${process.env.SMTP_USER ?? "no-reply@localhost"}>`;
  const transporter = getTransporter();
  return transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

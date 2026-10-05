"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInAction, signUpAction, type AuthResult } from "@/actions/auth";

interface Props {
  modo: "signin" | "signup";
}

export function FormularioAuth({ modo }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function manejar(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nombre = String(formData.get("nombre") ?? "").trim();

    startTransition(async () => {
      let res: AuthResult;
      if (modo === "signup") {
        res = await signUpAction({ email, password, nombre: nombre || undefined });
      } else {
        res = await signInAction({ email, password });
      }
      if (res.ok) {
        router.push("/inicio");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const titulo = modo === "signup" ? "Creá tu cuenta" : "Volvé a entrar";
  const cta = modo === "signup" ? "Crear cuenta" : "Entrar";
  const linkTexto =
    modo === "signup" ? "¿Ya tenés cuenta?" : "¿Es tu primera vez?";
  const linkHref = modo === "signup" ? "/signin" : "/signup";
  const linkLabel = modo === "signup" ? "Entrá" : "Creá una cuenta";

  return (
    <div className="w-full max-w-sm space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <header className="text-center">
        <h1 className="text-2xl font-medium text-neutral-800">{titulo}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Para guardar versículos y verlos en cualquier dispositivo.
        </p>
      </header>

      <form action={manejar} className="space-y-4">
        {modo === "signup" && (
          <Field label="Nombre (opcional)">
            <input
              type="text"
              name="nombre"
              autoComplete="name"
              maxLength={80}
              className={inputClass}
              disabled={pending}
            />
          </Field>
        )}

        <Field label="Email">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            maxLength={160}
            className={inputClass}
            disabled={pending}
          />
        </Field>

        <Field label="Contraseña">
          <input
            type="password"
            name="password"
            required
            minLength={modo === "signup" ? 8 : 1}
            autoComplete={modo === "signup" ? "new-password" : "current-password"}
            className={inputClass}
            disabled={pending}
          />
          {modo === "signup" && (
            <p className="mt-1 text-xs text-neutral-500">Mínimo 8 caracteres.</p>
          )}
        </Field>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
        >
          {pending ? "Procesando…" : cta}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        {linkTexto}{" "}
        <Link href={linkHref} className="font-medium text-neutral-800 underline">
          {linkLabel}
        </Link>
      </p>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-200";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}

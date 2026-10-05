import { cookies } from "next/headers";
import { TEMA_POR_DEFECTO, TEMAS_POR_SLUG, temaPorSlug, type Tema } from "@/lib/temas";

export const TEMA_COOKIE = "devo_tema";
const COOKIE_DIAS = 365;

/** Lee el tema actual del cookie. Sin cookie → tema por defecto. */
export async function getTemaActual(): Promise<Tema> {
  const store = await cookies();
  const slug = store.get(TEMA_COOKIE)?.value;
  return temaPorSlug(slug);
}

/** Server-side: setea el cookie del tema (en una Server Action / Route Handler). */
export async function setTemaCookie(slug: string): Promise<boolean> {
  if (!TEMAS_POR_SLUG.has(slug)) return false;
  const store = await cookies();
  store.set(TEMA_COOKIE, slug, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_DIAS * 24 * 60 * 60,
    path: "/",
  });
  return true;
}

/** Re-exporta por conveniencia. */
export { TEMA_POR_DEFECTO };

"use server";

import { revalidatePath } from "next/cache";
import { setTemaCookie } from "@/lib/tema-actual";

export async function cambiarTemaAction(slug: string): Promise<{ ok: boolean }> {
  const ok = await setTemaCookie(slug);
  if (ok) revalidatePath("/", "layout");
  return { ok };
}

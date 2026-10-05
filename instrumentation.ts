import { assertEnvOrExit } from "@/lib/env";

export function register() {
  // Solo en runtime Node (no en edge). El runtime edge no nos aplica aqui
  // pero la guarda evita ruido si Next decide ejecutarnos ahi mas adelante.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    assertEnvOrExit();
  }
}

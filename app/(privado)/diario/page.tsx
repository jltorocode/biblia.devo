import { redirect } from "next/navigation";
import { hoyISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function DiarioRoot() {
  redirect(`/diario/${hoyISO()}`);
}

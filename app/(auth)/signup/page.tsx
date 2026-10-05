import { FormularioAuth } from "@/components/FormularioAuth";

export const metadata = { title: "Crear cuenta" };

export default function SignUpPage() {
  return <FormularioAuth modo="signup" />;
}

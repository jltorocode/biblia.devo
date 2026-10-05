import { FormularioAuth } from "@/components/FormularioAuth";

export const metadata = { title: "Entrar" };

export default function SignInPage() {
  return <FormularioAuth modo="signin" />;
}

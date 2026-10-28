import type { Metadata } from "next";
import { LegalPage } from "@/shared/components/LegalPage";

export const metadata: Metadata = { title: "Política de Privacidade | MobiFix" };

export default function Page() {
  return (
    <LegalPage title="Política de Privacidade">
      <p>
        O texto oficial da Política de Privacidade do MobiFix ainda não foi fornecido. Esta página existe para que o
        link do cadastro funcione e deve ser substituída pelo documento definitivo(se houver) (em conformidade com a
        LGPD) antes da publicação.
      </p>
    </LegalPage>
  );
}
